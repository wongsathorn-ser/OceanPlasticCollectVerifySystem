"""Feature 1 - Pydantic request/response models.

Use the pattern from class: a Base model plus In (request body) and Out
(response) models. Out models must never contain password_hash.

TODO(F1): for example
    UserBase, RegisterIn, LoginIn, ChangePasswordIn, UserOut,
    AccountRequestOut, ApproveIn (role)
"""
