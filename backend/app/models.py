from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base
import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=True)
    full_name = Column(String, nullable=True)
    role = Column(String, default="collaborator", index=True)  # core | collaborator
    hashed_password = Column(String, nullable=False)
    activities = relationship("Activity", back_populates="owner")
    shared_activities = relationship("ActivityAccess", back_populates="user")

class Activity(Base):
    __tablename__ = "activities"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text, nullable=True)
    injected_by = Column(String, nullable=True)
    status = Column(String, default="En Curso", index=True)  # En Curso, Completada, Cancelada
    assigned_to = Column(String, nullable=True)
    assigned_email = Column(String, nullable=True)
    due_date = Column(DateTime, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="activities")
    history = relationship("ActivityHistory", back_populates="activity")
    subtasks = relationship("SubActivity", back_populates="activity", cascade="all, delete-orphan")
    files = relationship("ActivityFile", back_populates="activity", cascade="all, delete-orphan")
    shared_with = relationship("ActivityAccess", back_populates="activity", cascade="all, delete-orphan")

class ActivityAccess(Base):
    __tablename__ = "activity_access"
    id = Column(Integer, primary_key=True, index=True)
    activity_id = Column(Integer, ForeignKey("activities.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    granted_by = Column(String, nullable=True)
    granted_at = Column(DateTime, default=datetime.datetime.utcnow)
    activity = relationship("Activity", back_populates="shared_with")
    user = relationship("User", back_populates="shared_activities")

class SubActivity(Base):
    __tablename__ = "sub_activities"
    id = Column(Integer, primary_key=True, index=True)
    activity_id = Column(Integer, ForeignKey("activities.id"))
    activity = relationship("Activity", back_populates="subtasks")
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, default="En Curso")  # En Curso, Completada, Cancelada
    order = Column(Integer, default=0)
    completed_at = Column(DateTime, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class ActivityHistory(Base):
    __tablename__ = "activity_history"
    id = Column(Integer, primary_key=True, index=True)
    activity_id = Column(Integer, ForeignKey("activities.id"))
    activity = relationship("Activity", back_populates="history")
    changed_by = Column(String)
    changed_field = Column(String)  # 'status', 'assigned_to', 'description'
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class Webhook(Base):
    __tablename__ = "webhooks"
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    url = Column(String, nullable=False)
    event = Column(String, default="*")  # '*' for all, 'status_changed', 'activity_created', etc.
    active = Column(String, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ActivityFile(Base):
    __tablename__ = "activity_files"
    id = Column(Integer, primary_key=True, index=True)
    activity_id = Column(Integer, ForeignKey("activities.id"))
    activity = relationship("Activity", back_populates="files")
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)  # Path relative to uploads directory
    file_size = Column(Integer)  # Size in bytes
    file_type = Column(String)  # MIME type
    uploaded_by = Column(String)  # Username
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class Invitation(Base):
    __tablename__ = "invitations"
    id = Column(Integer, primary_key=True, index=True)
    activity_id = Column(Integer, ForeignKey("activities.id"))
    activity = relationship("Activity", foreign_keys=[activity_id])
    invited_email = Column(String, nullable=False)
    token = Column(String, unique=True, index=True, nullable=False)
    created_by = Column(String)  # Username who created the invitation
    accepted_by = Column(String, nullable=True)  # Guest username who accepted
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    expires_at = Column(DateTime)  # When invitation expires (e.g., 7 days from creation)
    accepted_at = Column(DateTime, nullable=True)
