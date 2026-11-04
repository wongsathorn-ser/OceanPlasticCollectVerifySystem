"""Feature 1 - Pydantic request/response models.

Pattern from class: a Base model plus In (request body) and Out (response)
models. Out models never contain password_hash, so FastAPI filters it out of
every response (return type / response_model).
"""

from datetime import datetime

from pydantic import BaseModel, EmailStr

# Spec section 3 (roles) and DM-1 (status)
ROLES = ("CREW_MEMBER", "SPONSOR_MANAGEMENT", "ADMIN")
REGISTRATION_ROLES = ("CREW_MEMBER", "SPONSOR_MANAGEMENT")  # BR-9: never ADMIN
MIN_PASSWORD_LENGTH = 8  # FR-1.4


class UserBase(BaseModel):
    name: str
    email: EmailStr
    username: str


class RegisterIn(UserBase):
    password: str
    role: str  # checked in service.register (BR-9) to give a readable message


class LoginIn(BaseModel):
    username: str
    password: str


class ChangePasswordIn(BaseModel):
    current_password: str
    new_password: str


class ApproveIn(BaseModel):
    role: str  # FR-1.6: the admin may correct the requested role


class UserOut(UserBase):
    id: int
    role: str
    status: str
    created_at: datetime
