from sqlalchemy.orm import Session
from . import models, schemas
from .auth import get_password_hash, verify_password
import requests
import json
from sqlalchemy import or_

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed = get_password_hash(user.password)
    role = "Admin" if db.query(models.User).count() == 0 else "collaborator"
    email = user.email or user.username
    db_user = models.User(
        username=user.username,
        email=email,
        full_name=user.full_name or user.username,
        role=role,
        hashed_password=hashed
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, username: str, password: str):
    user = get_user_by_username(db, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def create_activity(db: Session, owner_id: int, activity: schemas.ActivityCreate):
    db_act = models.Activity(
        title=activity.title,
        description=activity.description,
        injected_by=activity.injected_by,
        due_date=activity.due_date,
        owner_id=owner_id,
    )
    db.add(db_act)
    db.commit()
    db.refresh(db_act)
    return db_act

def has_activity_access(db: Session, activity_id: int, user_id: int):
    act = db.query(models.Activity).filter(models.Activity.id == activity_id).first()
    if not act:
        return False
    
    # Verificar si el usuario es Admin
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user and user.role == "Admin":
        return True
    
    # Verificar si es el dueño
    if act.owner_id == user_id:
        return True
    
    # Verificar si tiene acceso compartido
    shared = db.query(models.ActivityAccess).filter(
        models.ActivityAccess.activity_id == activity_id,
        models.ActivityAccess.user_id == user_id
    ).first()
    return shared is not None

def _activity_scope_query(db: Session, current_user: models.User):
    query = db.query(models.Activity)
    if current_user.role != "Admin":
        query = query.outerjoin(
            models.ActivityAccess,
            models.ActivityAccess.activity_id == models.Activity.id
        ).filter(
            or_(
                models.Activity.owner_id == current_user.id,
                models.ActivityAccess.user_id == current_user.id
            )
        ).distinct()
    return query

def list_activities(db: Session, current_user: models.User, status: str = None, assigned_to: str = None, page: int = 1, per_page: int = 10):
    query = _activity_scope_query(db, current_user)
    
    if status:
        query = query.filter(models.Activity.status == status)
    if assigned_to:
        query = query.filter(models.Activity.assigned_to == assigned_to)
    
    # Paginado
    total = query.count()
    offset = (page - 1) * per_page
    items = query.order_by(models.Activity.timestamp.desc()).offset(offset).limit(per_page).all()
    
    return {"total": total, "page": page, "per_page": per_page, "items": items}

def update_activity(db: Session, activity_id: int, owner_id: int, activity_update: schemas.ActivityUpdate, username: str):
    if not has_activity_access(db, activity_id, owner_id):
        return None
    db_act = db.query(models.Activity).filter(models.Activity.id == activity_id).first()
    if not db_act:
        return None
    
    changed = False
    # Registrar cambios en historial
    if activity_update.status is not None and activity_update.status != db_act.status:
        history = models.ActivityHistory(
            activity_id=activity_id,
            changed_by=username,
            changed_field='status',
            old_value=db_act.status,
            new_value=activity_update.status
        )
        db.add(history)
        db_act.status = activity_update.status
        changed = True
    
    if activity_update.assigned_to is not None and activity_update.assigned_to != db_act.assigned_to:
        history = models.ActivityHistory(
            activity_id=activity_id,
            changed_by=username,
            changed_field='assigned_to',
            old_value=db_act.assigned_to,
            new_value=activity_update.assigned_to
        )
        db.add(history)
        db_act.assigned_to = activity_update.assigned_to
        changed = True
    
    if activity_update.description is not None and activity_update.description != db_act.description:
        history = models.ActivityHistory(
            activity_id=activity_id,
            changed_by=username,
            changed_field='description',
            old_value=db_act.description,
            new_value=activity_update.description
        )
        db.add(history)
        db_act.description = activity_update.description
        changed = True
    
    if activity_update.due_date is not None and activity_update.due_date != db_act.due_date:
        old_val = db_act.due_date.isoformat() if db_act.due_date else None
        new_val = activity_update.due_date.isoformat() if activity_update.due_date else None
        history = models.ActivityHistory(
            activity_id=activity_id,
            changed_by=username,
            changed_field='due_date',
            old_value=old_val,
            new_value=new_val
        )
        db.add(history)
        db_act.due_date = activity_update.due_date
        changed = True
    
    db.commit()
    db.refresh(db_act)
    
    # Enviar webhooks si hubo cambio
    if changed:
        send_webhooks(db, owner_id, 'activity_updated', {
            'id': db_act.id,
            'title': db_act.title,
            'status': db_act.status,
            'assigned_to': db_act.assigned_to
        })
    
    return db_act

def delete_activity(db: Session, activity_id: int):
    db_act = db.query(models.Activity).filter(models.Activity.id == activity_id).first()
    if not db_act:
        return None
    # Remove related records that do not cascade automatically
    db.query(models.ActivityHistory).filter(models.ActivityHistory.activity_id == activity_id).delete()
    db.query(models.Invitation).filter(models.Invitation.activity_id == activity_id).delete()
    db.delete(db_act)
    db.commit()
    return db_act

def get_activity_history(db: Session, activity_id: int, owner_id: int):
    if not has_activity_access(db, activity_id, owner_id):
        return None
    return db.query(models.ActivityHistory).filter(
        models.ActivityHistory.activity_id == activity_id
    ).order_by(models.ActivityHistory.timestamp.desc()).all()

def get_activities_for_export(db: Session, current_user: models.User, status: str = None):
    query = _activity_scope_query(db, current_user)
    if status:
        query = query.filter(models.Activity.status == status)
    return query.order_by(models.Activity.timestamp.desc()).all()

def create_webhook(db: Session, owner_id: int, webhook: schemas.WebhookCreate):
    db_webhook = models.Webhook(owner_id=owner_id, url=webhook.url, event=webhook.event)
    db.add(db_webhook)
    db.commit()
    db.refresh(db_webhook)
    return db_webhook

def list_webhooks(db: Session, owner_id: int):
    return db.query(models.Webhook).filter(models.Webhook.owner_id == owner_id).all()

def delete_webhook(db: Session, webhook_id: int, owner_id: int):
    db_webhook = db.query(models.Webhook).filter(
        models.Webhook.id == webhook_id,
        models.Webhook.owner_id == owner_id
    ).first()
    if db_webhook:
        db.delete(db_webhook)
        db.commit()
    return db_webhook

def get_webhooks_for_event(db: Session, owner_id: int, event: str):
    return db.query(models.Webhook).filter(
        models.Webhook.owner_id == owner_id,
        models.Webhook.active == True,
        (models.Webhook.event == "*") | (models.Webhook.event == event)
    ).all()

def send_webhooks(db: Session, owner_id: int, event: str, activity_data: dict):
    """Enviar webhooks para un evento específico"""
    webhooks = get_webhooks_for_event(db, owner_id, event)
    for webhook in webhooks:
        try:
            requests.post(webhook.url, json={
                'event': event,
                'activity': activity_data,
                'timestamp': str(__import__('datetime').datetime.utcnow())
            }, timeout=5)
        except Exception as e:
            # Log error pero no falla la aplicación
            print(f"Error enviando webhook {webhook.url}: {str(e)}")

def create_subtask(db: Session, activity_id: int, owner_id: int, subtask: schemas.SubActivityCreate):
    """Crear una subtarea para una actividad"""
    db_act = db.query(models.Activity).filter(models.Activity.id == activity_id).first()
    if not db_act or not has_activity_access(db, activity_id, owner_id):
        return None
    
    # Obtener el orden máximo
    max_order = db.query(models.SubActivity).filter(
        models.SubActivity.activity_id == activity_id
    ).order_by(models.SubActivity.order.desc()).first()
    next_order = (max_order.order + 1) if max_order else 0
    
    db_subtask = models.SubActivity(
        activity_id=activity_id,
        title=subtask.title,
        description=subtask.description,
        order=next_order
    )
    db.add(db_subtask)
    db.commit()
    db.refresh(db_subtask)
    return db_subtask

def list_subtasks(db: Session, activity_id: int, owner_id: int):
    """Listar todas las subtareas de una actividad"""
    if not has_activity_access(db, activity_id, owner_id):
        return None
    
    return db.query(models.SubActivity).filter(
        models.SubActivity.activity_id == activity_id
    ).order_by(models.SubActivity.order).all()

def update_subtask(db: Session, subtask_id: int, activity_id: int, owner_id: int, subtask_update: schemas.SubActivityUpdate, username: str):
    """Actualizar una subtarea"""
    if not has_activity_access(db, activity_id, owner_id):
        return None
    
    db_subtask = db.query(models.SubActivity).filter(
        models.SubActivity.id == subtask_id,
        models.SubActivity.activity_id == activity_id
    ).first()
    if not db_subtask:
        return None
    
    changed = False
    if subtask_update.status is not None and subtask_update.status != db_subtask.status:
        old_status = db_subtask.status
        db_subtask.status = subtask_update.status
        
        # Si se marca como Done, registrar completed_at
        if subtask_update.status == "Done" and not db_subtask.completed_at:
            import datetime as dt
            db_subtask.completed_at = dt.datetime.utcnow()
        elif subtask_update.status != "Done":
            db_subtask.completed_at = None
        
        changed = True
    
    if subtask_update.description is not None and subtask_update.description != db_subtask.description:
        db_subtask.description = subtask_update.description
        changed = True
    
    db.commit()
    db.refresh(db_subtask)
    
    return db_subtask

def delete_subtask(db: Session, subtask_id: int, activity_id: int, owner_id: int):
    """Eliminar una subtarea"""
    if not has_activity_access(db, activity_id, owner_id):
        return None
    
    db_subtask = db.query(models.SubActivity).filter(
        models.SubActivity.id == subtask_id,
        models.SubActivity.activity_id == activity_id
    ).first()
    if not db_subtask:
        return None
    
    db.delete(db_subtask)
    db.commit()
    return db_subtask

def create_activity_file(db: Session, activity_id: int, owner_id: int, fileinfo: dict):
    if not has_activity_access(db, activity_id, owner_id):
        return None
    db_file = models.ActivityFile(
        activity_id=activity_id,
        filename=fileinfo.get('filename'),
        file_path=fileinfo.get('file_path'),
        file_size=fileinfo.get('file_size'),
        file_type=fileinfo.get('file_type'),
        uploaded_by=fileinfo.get('uploaded_by')
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    return db_file

def list_activity_files(db: Session, activity_id: int, owner_id: int):
    if not has_activity_access(db, activity_id, owner_id):
        return None
    return db.query(models.ActivityFile).filter(models.ActivityFile.activity_id == activity_id).order_by(models.ActivityFile.timestamp.desc()).all()

def get_activity_file(db: Session, file_id: int, activity_id: int, owner_id: int):
    if not has_activity_access(db, activity_id, owner_id):
        return None
    return db.query(models.ActivityFile).filter(models.ActivityFile.id == file_id, models.ActivityFile.activity_id == activity_id).first()

def delete_activity_file(db: Session, file_id: int, activity_id: int, owner_id: int):
    db_file = get_activity_file(db, file_id, activity_id, owner_id)
    if not db_file:
        return None
    db.delete(db_file)
    db.commit()
    return db_file

def get_weekly_dashboard(db: Session, current_user: models.User):
    """Get weekly activity summary by status for last 7 days"""
    import datetime as dt
    today = dt.datetime.utcnow().date()
    week_ago = today - dt.timedelta(days=7)
    base_query = _activity_scope_query(db, current_user)
    
    # Count activities by status created in last 7 days
    new_count = base_query.filter(
        models.Activity.status == 'New',
        models.Activity.timestamp >= dt.datetime(week_ago.year, week_ago.month, week_ago.day)
    ).count()
    
    in_progress_count = base_query.filter(
        models.Activity.status == 'In Progress',
        models.Activity.timestamp >= dt.datetime(week_ago.year, week_ago.month, week_ago.day)
    ).count()
    
    done_count = base_query.filter(
        models.Activity.status == 'Done',
        models.Activity.timestamp >= dt.datetime(week_ago.year, week_ago.month, week_ago.day)
    ).count()
    
    total = new_count + in_progress_count + done_count
    
    return {
        'period': f'Últimos 7 días (desde {week_ago})',
        'new': new_count,
        'in_progress': in_progress_count,
        'done': done_count,
        'total': total,
        'percentages': {
            'new': round((new_count / total * 100) if total > 0 else 0, 1),
            'in_progress': round((in_progress_count / total * 100) if total > 0 else 0, 1),
            'done': round((done_count / total * 100) if total > 0 else 0, 1)
        }
    }

def get_due_activities(db: Session, current_user: models.User, within_hours: int = 24):
    """Return activities with due_date within the next `within_hours` hours and not Done."""
    import datetime as dt
    now = dt.datetime.utcnow()
    window = now + dt.timedelta(hours=within_hours)

    return _activity_scope_query(db, current_user).filter(
        models.Activity.due_date != None,
        models.Activity.due_date >= now,
        models.Activity.due_date <= window,
        models.Activity.status != 'Done'
    ).order_by(models.Activity.due_date.asc()).all()

def create_invitation(db: Session, activity_id: int, owner_id: int, invited_email: str, username: str):
    """Crear una invitación para una actividad"""
    import secrets
    import datetime as dt
    
    # Verificar que la actividad existe y el usuario tiene acceso
    if not has_activity_access(db, activity_id, owner_id):
        return None
    
    db_act = db.query(models.Activity).filter(models.Activity.id == activity_id).first()
    if not db_act:
        return None
    
    # Generar token único
    token = secrets.token_urlsafe(32)
    expires_at = dt.datetime.utcnow() + dt.timedelta(days=7)
    
    db_inv = models.Invitation(
        activity_id=activity_id,
        invited_email=invited_email,
        token=token,
        created_by=username,
        expires_at=expires_at
    )
    db.add(db_inv)
    db.commit()
    db.refresh(db_inv)
    return db_inv

def get_invitation_by_token(db: Session, token: str):
    """Obtener invitación por token"""
    import datetime as dt
    inv = db.query(models.Invitation).filter(models.Invitation.token == token).first()
    if inv and inv.expires_at and inv.expires_at > dt.datetime.utcnow():
        return inv
    return None

def list_invitations_for_activity(db: Session, activity_id: int, owner_id: int):
    """Listar todas las invitaciones de una actividad"""
    db_act = db.query(models.Activity).filter(
        models.Activity.id == activity_id,
        models.Activity.owner_id == owner_id
    ).first()
    if not db_act:
        return None
    return db.query(models.Invitation).filter(models.Invitation.activity_id == activity_id).order_by(models.Invitation.created_at.desc()).all()

def accept_invitation(db: Session, token: str, guest_username: str):
    """Aceptar una invitación con token"""
    import datetime as dt
    inv = get_invitation_by_token(db, token)
    if not inv:
        return None
    
    inv.accepted_by = guest_username
    inv.accepted_at = dt.datetime.utcnow()
    db.commit()
    db.refresh(inv)
    return inv

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def list_collaborators(db: Session, current_user_id: int):
    return db.query(models.User).filter(
        models.User.id != current_user_id,
        models.User.role == "collaborator"
    ).order_by(models.User.full_name.asc()).all()

def assign_activity_to_collaborator(db: Session, activity_id: int, owner_id: int, collaborator_id: int, username: str):
    activity = db.query(models.Activity).filter(
        models.Activity.id == activity_id,
        models.Activity.owner_id == owner_id
    ).first()
    if not activity:
        return None, None, None

    collaborator = db.query(models.User).filter(
        models.User.id == collaborator_id,
        models.User.role == "collaborator"
    ).first()
    if not collaborator:
        return activity, None, None

    old_assignee = activity.assigned_to
    activity.assigned_to = collaborator.full_name or collaborator.username
    activity.assigned_email = collaborator.email or collaborator.username

    access = db.query(models.ActivityAccess).filter(
        models.ActivityAccess.activity_id == activity_id,
        models.ActivityAccess.user_id == collaborator.id
    ).first()
    if not access:
        db.add(models.ActivityAccess(
            activity_id=activity_id,
            user_id=collaborator.id,
            granted_by=username
        ))

    db.add(models.ActivityHistory(
        activity_id=activity_id,
        changed_by=username,
        changed_field='assigned_to',
        old_value=old_assignee,
        new_value=activity.assigned_to
    ))

    inv = create_invitation(db, activity_id, owner_id, activity.assigned_email, username)
    db.commit()
    db.refresh(activity)
    return activity, collaborator, inv

def create_admin_user(db: Session, current_user: models.User, payload: schemas.AdminUserCreate):
    if current_user.role != "Admin":
        return None
    existing = get_user_by_username(db, payload.username)
    if existing:
        return existing
    user = models.User(
        username=payload.username,
        email=payload.email or payload.username,
        full_name=payload.full_name or payload.username,
        role="Admin",
        hashed_password=get_password_hash(payload.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
