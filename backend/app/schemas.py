from pydantic import BaseModel, field_validator, ConfigDict
from typing import Optional
import datetime
import re

class UserCreate(BaseModel):
    username: str
    password: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    
    @field_validator('username')
    @classmethod
    def validate_username(cls, v):
        if len(v) < 3:
            raise ValueError('Username debe tener al menos 3 caracteres')
        if not re.match(r'^[a-zA-Z0-9_-]+$', v):
            raise ValueError('Username solo puede contener letras, numeros, guiones y guiones bajos')
        return v
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Contraseña debe tener al menos 6 caracteres')
        return v

class UserOut(BaseModel):
    id: int
    username: str
    email: Optional[str]
    full_name: Optional[str]
    role: str
    last_login: Optional[datetime.datetime] = None
    created_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class SubActivityCreate(BaseModel):
    title: str
    description: Optional[str] = None

class SubActivityUpdate(BaseModel):
    status: Optional[str] = None
    description: Optional[str] = None

class SubActivityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    activity_id: int
    title: str
    description: Optional[str]
    status: str
    order: int
    completed_at: Optional[datetime.datetime]
    timestamp: datetime.datetime

class IndicatorOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    name: str
    description: Optional[str]
    created_at: datetime.datetime

class ActivityCreate(BaseModel):
    title: str
    description: Optional[str] = None
    injected_by: Optional[str] = None
    due_date: Optional[datetime.datetime] = None
    indicator_id: int

class ActivityUpdate(BaseModel):
    status: Optional[str] = None
    assigned_to: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime.datetime] = None
    indicator_id: Optional[int] = None

class ActivityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    title: str
    description: Optional[str]
    injected_by: Optional[str]
    status: str
    assigned_to: Optional[str]
    assigned_email: Optional[str]
    due_date: Optional[datetime.datetime]
    timestamp: datetime.datetime
    updated_at: datetime.datetime
    owner_id: int
    indicator_id: int
    indicator: Optional[IndicatorOut] = None
    subtasks: list[SubActivityOut] = []
    files: list[ActivityFileOut] = []

class ActivityHistoryOut(BaseModel):
    id: int
    activity_id: int
    changed_by: str
    changed_field: str
    old_value: Optional[str]
    new_value: Optional[str]
    timestamp: datetime.datetime

    class Config:
        from_attributes = True

class ActivityFileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    activity_id: int
    filename: str
    file_path: str
    file_size: Optional[int]
    file_type: Optional[str]
    uploaded_by: Optional[str]
    timestamp: datetime.datetime

class PaginatedActivityOut(BaseModel):
    total: int
    page: int
    per_page: int
    items: list[ActivityOut]

class WebhookCreate(BaseModel):
    url: str
    event: Optional[str] = "*"

class WebhookOut(BaseModel):
    id: int
    url: str
    event: str
    active: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class InvitationCreate(BaseModel):
    invited_email: str

class InvitationOut(BaseModel):
    id: int
    activity_id: int
    invited_email: str
    token: str
    created_by: Optional[str]
    accepted_by: Optional[str]
    created_at: datetime.datetime
    expires_at: Optional[datetime.datetime]
    accepted_at: Optional[datetime.datetime]

    class Config:
        from_attributes = True

class InvitationAccept(BaseModel):
    username: str
    password: str

class CollaboratorOut(BaseModel):
    id: int
    username: str
    email: Optional[str]
    full_name: Optional[str]
    last_login: Optional[datetime.datetime] = None
    created_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True

class AssignActivityRequest(BaseModel):
    collaborator_id: int

class AdminUserCreate(BaseModel):
    username: str
    password: str
    email: Optional[str] = None
    full_name: Optional[str] = None
