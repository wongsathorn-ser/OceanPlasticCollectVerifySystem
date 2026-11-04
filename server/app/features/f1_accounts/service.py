"""Feature 1 - business logic (router functions stay thin).

Data is kept in memory for now (memory_store.py). This is the only module that
touches USERS / SESSIONS, so moving to the database later only changes this file.

Passwords: hashed with PBKDF2-SHA256 from Python's standard library (hashlib),
so nothing new is installed. NFR-15 asks for bcrypt or argon2 - that library
choice is still open (docs/DECISIONS.md) and should replace hash_password /
verify_password before real accounts are stored.
"""

import hashlib
import hmac
import re
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status

from app.core import config
from app.features.f1_accounts import memory_store as db
from app.features.f1_accounts.schemas import MIN_PASSWORD_LENGTH, REGISTRATION_ROLES, ROLES

USERNAME_PATTERN = re.compile(r"^[a-z0-9._-]{3,30}$")
PBKDF2_ITERATIONS = 120_000


def now() -> datetime:
    return datetime.now(timezone.utc)


# ---------- passwords ----------

def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, PBKDF2_ITERATIONS)
    return f"pbkdf2_sha256${PBKDF2_ITERATIONS}${salt.hex()}${digest.hex()}"


def verify_password(password: str, password_hash: str) -> bool:
    _, iterations, salt_hex, digest_hex = password_hash.split("$")
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt_hex), int(iterations))
    return hmac.compare_digest(digest.hex(), digest_hex)  # constant-time compare


# ---------- users ----------

def get_user(user_id: int) -> dict:
    user = db.USERS.get(user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Account not found.")
    return user


def find_by_username(username: str) -> dict | None:
    return next((u for u in db.USERS.values() if u["username"] == username), None)


def register(name: str, email: str, username: str, password: str, role: str) -> dict:
    """FR-1.4: create a PENDING account that an administrator must approve."""
    username = username.strip().lower()
    email = email.strip().lower()
    if role not in REGISTRATION_ROLES:  # BR-9
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Choose Crew member or Sponsor / Management.")
    if not name.strip():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Enter your full name.")
    if not USERNAME_PATTERN.match(username):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Usernames use 3-30 letters, numbers, dots, dashes or underscores.",
        )
    if len(password) < MIN_PASSWORD_LENGTH:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, f"Passwords need at least {MIN_PASSWORD_LENGTH} characters."
        )
    if find_by_username(username):
        raise HTTPException(status.HTTP_409_CONFLICT, "That username is already taken. Please choose another one.")
    if any(u["email"] == email for u in db.USERS.values()):
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with this email address already exists.")

    user = {
        "id": db.new_user_id(),
        "name": name.strip(),
        "email": email,
        "username": username,
        "password_hash": hash_password(password),
        "role": role,
        "status": "PENDING",
        "created_at": now(),
    }
    db.USERS[user["id"]] = user
    return user


def authenticate(username: str, password: str) -> dict:
    """FR-1.1 + BR-8: check the password, then that the account may sign in."""
    user = find_by_username(username.strip().lower())
    if user is None or not verify_password(password, user["password_hash"]):
        # generic message - do not reveal which field was wrong
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect username or password.")
    messages = {
        "PENDING": "Your account is waiting for an administrator to approve it.",
        "REJECTED": "Your account request was not approved. Please contact the administrator.",
        "SUSPENDED": "Your account is suspended. Please contact the administrator.",
    }
    if user["status"] in messages:
        raise HTTPException(status.HTTP_403_FORBIDDEN, messages[user["status"]])
    return user


def change_password(user_id: int, current_password: str, new_password: str) -> None:
    user = get_user(user_id)
    if not verify_password(current_password, user["password_hash"]):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Your current password is not correct.")
    if len(new_password) < MIN_PASSWORD_LENGTH:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, f"The new password needs at least {MIN_PASSWORD_LENGTH} characters."
        )
    user["password_hash"] = hash_password(new_password)


# ---------- sessions (FR-1.2, FR-1.3) ----------

def _key(session_id: str) -> str:
    # store only a hash of the cookie value, so a leaked store cannot be replayed
    return hashlib.sha256(session_id.encode()).hexdigest()


def create_session(user_id: int) -> str:
    session_id = secrets.token_urlsafe(32)  # random, unguessable
    db.SESSIONS[_key(session_id)] = {
        "user_id": user_id,
        "created_at": now(),
        "expires_at": now() + timedelta(days=config.SESSION_TTL_DAYS),
    }
    return session_id


def user_for_session(session_id: str) -> dict | None:
    """Return the ACTIVE user of a valid session and slide its expiry, else None."""
    key = _key(session_id)
    session = db.SESSIONS.get(key)
    if session is None:
        return None
    user = db.USERS.get(session["user_id"])
    if session["expires_at"] < now() or user is None or user["status"] != "ACTIVE":
        db.SESSIONS.pop(key, None)
        return None
    session["expires_at"] = now() + timedelta(days=config.SESSION_TTL_DAYS)  # FR-1.3 sliding expiry
    return user


def end_session(session_id: str) -> None:
    db.SESSIONS.pop(_key(session_id), None)


def end_all_sessions(user_id: int) -> None:
    for key in [k for k, s in db.SESSIONS.items() if s["user_id"] == user_id]:
        del db.SESSIONS[key]


# ---------- admin (FR-1.6, FR-1.7) ----------

def list_requests() -> list[dict]:
    pending = [u for u in db.USERS.values() if u["status"] == "PENDING"]
    return sorted(pending, key=lambda u: u["created_at"], reverse=True)  # newest first (Figma)


def _pending(user_id: int) -> dict:
    user = get_user(user_id)
    if user["status"] != "PENDING":
        raise HTTPException(status.HTTP_409_CONFLICT, "This request has already been handled.")
    return user


def approve(user_id: int, role: str) -> dict:
    user = _pending(user_id)
    if role not in ROLES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Choose a valid role.")
    user["role"] = role
    user["status"] = "ACTIVE"
    return user


def reject(user_id: int) -> dict:
    user = _pending(user_id)
    user["status"] = "REJECTED"
    return user


def list_users(search: str = "") -> list[dict]:
    """Everyone except PENDING requests (those are on the Requests screen)."""
    term = search.strip().lower()
    users = [u for u in db.USERS.values() if u["status"] != "PENDING"]
    if term:
        users = [u for u in users if term in f'{u["name"]} {u["username"]} {u["email"]}'.lower()]
    return sorted(users, key=lambda u: u["name"])


def suspend(user_id: int, admin_id: int) -> dict:
    user = get_user(user_id)
    if user_id == admin_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "You cannot suspend your own account.")
    if user["status"] != "ACTIVE":
        raise HTTPException(status.HTTP_409_CONFLICT, "Only active accounts can be suspended.")
    user["status"] = "SUSPENDED"
    end_all_sessions(user_id)  # BR-7: signs the person out everywhere
    return user


def reactivate(user_id: int) -> dict:
    user = get_user(user_id)
    if user["status"] != "SUSPENDED":
        raise HTTPException(status.HTTP_409_CONFLICT, "Only suspended accounts can be reactivated.")
    user["status"] = "ACTIVE"
    return user
