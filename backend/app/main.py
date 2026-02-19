from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from sqlalchemy.orm import Session
from typing import Optional
from . import models, schemas, crud, auth
from .database import engine, Base, get_db
from .email_service import send_invitation_email, send_deadline_email, send_assignment_notification_email
import csv
import io
import os
from pathlib import Path
import sqlalchemy
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Seguimiento de Actividades - Prototipo")

# Permitir CORS desde el frontend (ajustar orígenes en producción)
origins = [
    "http://127.0.0.1:5173",
    "http://localhost:5173",
    "https://yacaicedo6.github.io",
    "https://yacaicedo6.github.io/actividades-proyecto/",
    "https://yacaicedo6.github.io/actividades-proyecto",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post('/register', response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    logger.info(f"Register attempt: username={user.username}")
    existing = crud.get_user_by_username(db, user.username)
    if existing:
        logger.warning(f"Register failed: username already exists - {user.username}")
        raise HTTPException(status_code=400, detail='Username already registered')
    new_user = crud.create_user(db, user)
    logger.info(f"User registered successfully: {user.username}")
    return new_user

@app.post('/token', response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    logger.info(f"Login attempt: username={form_data.username}")
    user = crud.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        logger.warning(f"Login failed: invalid credentials for {form_data.username}")
        raise HTTPException(status_code=400, detail='Incorrect username or password')
    # Registrar último login
    import datetime
    user.last_login = datetime.datetime.utcnow()
    db.commit()
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post('/activities')
def create_activity(activity: schemas.ActivityCreate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    db_act = crud.create_activity(db, owner_id=current_user.id, activity=activity)
    # Return a simple JSON representation to avoid response-model serialization issues
    return {
        'id': db_act.id,
        'title': db_act.title,
        'description': db_act.description,
        'injected_by': db_act.injected_by,
        'status': db_act.status,
        'assigned_to': db_act.assigned_to,
        'due_date': db_act.due_date.isoformat() if db_act.due_date else None,
        'timestamp': db_act.timestamp.isoformat() if db_act.timestamp else None,
        'updated_at': db_act.updated_at.isoformat() if db_act.updated_at else None,
        'owner_id': db_act.owner_id,
        'subtasks': [],
        'files': []
    }

@app.get('/activities', response_model=schemas.PaginatedActivityOut)
def get_activities(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
    status: Optional[str] = None,
    assigned_to: Optional[str] = None,
    page: int = 1,
    per_page: int = 10
):
    return crud.list_activities(db, current_user=current_user, status=status, assigned_to=assigned_to, page=page, per_page=per_page)

@app.patch('/activities/{activity_id}')
def update_activity(activity_id: int, activity_update: schemas.ActivityUpdate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    result = crud.update_activity(db, activity_id, current_user.id, activity_update, current_user.username)
    if not result:
        raise HTTPException(status_code=404, detail='Activity not found')
    # Return simple JSON to avoid serialization issues
    return {
        'id': result.id,
        'title': result.title,
        'description': result.description,
        'status': result.status,
        'assigned_to': result.assigned_to,
        'due_date': result.due_date.isoformat() if result.due_date else None,
        'timestamp': result.timestamp.isoformat() if result.timestamp else None,
        'updated_at': result.updated_at.isoformat() if result.updated_at else None,
        'injected_by': result.injected_by,
        'owner_id': result.owner_id
    }

@app.delete('/activities/{activity_id}')
def delete_activity(activity_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail='Solo usuarios Admin pueden eliminar actividades')
    result = crud.delete_activity(db, activity_id)
    if not result:
        raise HTTPException(status_code=404, detail='Activity not found')
    return {"ok": True}

@app.get('/activities/{activity_id}/history', response_model=list[schemas.ActivityHistoryOut])
def get_activity_history(activity_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    result = crud.get_activity_history(db, activity_id, current_user.id)
    if result is None:
        raise HTTPException(status_code=404, detail='Activity not found')
    return result

@app.get('/activities/export/csv')
def export_activities_csv(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
    status: Optional[str] = None
):
    activities = crud.get_activities_for_export(db, current_user, status)
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['ID', 'Título', 'Descripción', 'Estado', 'Asignado a', 'Inyectado por', 'Creado', 'Actualizado'])
    
    for act in activities:
        writer.writerow([
            act.id,
            act.title,
            act.description or '',
            act.status,
            act.assigned_to or '',
            act.injected_by or '',
            act.timestamp.isoformat(),
            act.updated_at.isoformat()
        ])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=actividades.csv"}
    )

@app.post('/webhooks', response_model=schemas.WebhookOut)
def create_webhook(webhook: schemas.WebhookCreate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    return crud.create_webhook(db, current_user.id, webhook)

@app.get('/webhooks', response_model=list[schemas.WebhookOut])
def list_webhooks(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    return crud.list_webhooks(db, current_user.id)

@app.delete('/webhooks/{webhook_id}')
def delete_webhook(webhook_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    result = crud.delete_webhook(db, webhook_id, current_user.id)
    if not result:
        raise HTTPException(status_code=404, detail='Webhook not found')
    return {"ok": True}

# Uploads directory
BASE_DIR = Path(__file__).resolve().parent.parent
UPLOADS_DIR = BASE_DIR / 'uploads'
os.makedirs(UPLOADS_DIR, exist_ok=True)


@app.post('/activities/{activity_id}/files', response_model=schemas.ActivityFileOut)
async def upload_activity_file(activity_id: int, file: UploadFile = File(...), current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    # Guardar archivo en disco
    safe_name = f"{int(__import__('time').time())}_{file.filename}"
    dest = UPLOADS_DIR / safe_name
    with open(dest, 'wb') as f:
        while True:
            chunk = await file.read(1024*1024)
            if not chunk:
                break
            f.write(chunk)

    info = {
        'filename': file.filename,
        'file_path': str(dest.relative_to(BASE_DIR)),
        'file_size': dest.stat().st_size,
        'file_type': file.content_type,
        'uploaded_by': current_user.username
    }
    db_file = crud.create_activity_file(db, activity_id, current_user.id, info)
    if not db_file:
        # remove saved file if record fails
        try:
            os.remove(dest)
        except Exception:
            pass
        raise HTTPException(status_code=404, detail='Activity not found')
    return db_file


@app.get('/activities/{activity_id}/files', response_model=list[schemas.ActivityFileOut])
def list_activity_files(activity_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    result = crud.list_activity_files(db, activity_id, current_user.id)
    if result is None:
        raise HTTPException(status_code=404, detail='Activity not found')
    return result


@app.get('/activities/{activity_id}/files/{file_id}')
def download_activity_file(activity_id: int, file_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    db_file = crud.get_activity_file(db, file_id, activity_id, current_user.id)
    if not db_file:
        raise HTTPException(status_code=404, detail='File not found')
    file_path = BASE_DIR / db_file.file_path
    if not file_path.exists():
        raise HTTPException(status_code=404, detail='File missing on server')
    return FileResponse(path=str(file_path), filename=db_file.filename, media_type=db_file.file_type)


@app.delete('/activities/{activity_id}/files/{file_id}')
def delete_activity_file(activity_id: int, file_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    db_file = crud.get_activity_file(db, file_id, activity_id, current_user.id)
    if not db_file:
        raise HTTPException(status_code=404, detail='File not found')
    file_path = BASE_DIR / db_file.file_path
    # borrar registro y archivo
    deleted = crud.delete_activity_file(db, file_id, activity_id, current_user.id)
    try:
        if file_path.exists():
            os.remove(file_path)
    except Exception:
        pass
    return {"ok": True}

@app.post('/activities/{activity_id}/subtasks', response_model=schemas.SubActivityOut)
def create_subtask(activity_id: int, subtask: schemas.SubActivityCreate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    result = crud.create_subtask(db, activity_id, current_user.id, subtask)
    if not result:
        raise HTTPException(status_code=404, detail='Activity not found')
    return result

@app.get('/activities/{activity_id}/subtasks', response_model=list[schemas.SubActivityOut])
def get_subtasks(activity_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    result = crud.list_subtasks(db, activity_id, current_user.id)
    if result is None:
        raise HTTPException(status_code=404, detail='Activity not found')
    return result

@app.patch('/activities/{activity_id}/subtasks/{subtask_id}', response_model=schemas.SubActivityOut)
def update_subtask(activity_id: int, subtask_id: int, subtask_update: schemas.SubActivityUpdate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    result = crud.update_subtask(db, subtask_id, activity_id, current_user.id, subtask_update, current_user.username)
    if not result:
        raise HTTPException(status_code=404, detail='Subtask not found')
    return result

@app.delete('/activities/{activity_id}/subtasks/{subtask_id}')
def delete_subtask(activity_id: int, subtask_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    result = crud.delete_subtask(db, subtask_id, activity_id, current_user.id)
    if not result:
        raise HTTPException(status_code=404, detail='Subtask not found')
    return {"ok": True}

@app.get('/dashboard/weekly')
def get_weekly_dashboard(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Dashboard solo disponible para usuarios Admin")
    return crud.get_weekly_dashboard(db, current_user)


@app.get('/activities/due')
def get_due_activities(hours: int = 24, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    """List activities due within the next `hours` hours."""
    activities = crud.get_due_activities(db, current_user, within_hours=hours)
    # return simplified serializable list
    out = []
    for a in activities:
        out.append({
            'id': a.id,
            'title': a.title,
            'due_date': a.due_date.isoformat() if a.due_date else None,
            'status': a.status,
            'assigned_to': a.assigned_to,
            'owner_id': a.owner_id
        })
    return out


@app.post('/activities/due/send-reminders')
def send_due_reminders(hours: int = 24, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    """Send reminder emails for activities due within `hours` hours.
    Will attempt to send to `assigned_to` if it looks like an email (contains '@').
    Returns summary of attempts.
    """
    activities = crud.get_due_activities(db, current_user, within_hours=hours)
    results = []
    for a in activities:
        target = a.assigned_to
        if target and '@' in target:
            # formatted due_date
            due_str = a.due_date.isoformat() if a.due_date else ''
            # obtener archivos adjuntos de la actividad (si existen)
            files = crud.list_activity_files(db, a.id, current_user.id) or []
            attachments = [str(BASE_DIR / f.file_path) for f in files]
            sent = send_deadline_email(target, a.title, due_str, current_user.username, attachments=attachments)
            results.append({'activity_id': a.id, 'to': target, 'sent': bool(sent)})
        else:
            # no email available
            results.append({'activity_id': a.id, 'to': target, 'sent': False, 'reason': 'no-email'})
    return {'count': len(results), 'results': results}


@app.post('/smtp/test')
def smtp_test_send(
    to_email: str,
    activity_id: Optional[int] = None,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db),
):
    """Send a manual SMTP test email, optionally attaching files from an activity."""
    attachments: list[str] = []
    if activity_id is not None:
        files = crud.list_activity_files(db, activity_id, current_user.id)
        if files is None:
            raise HTTPException(status_code=404, detail='Activity not found')
        attachments = [str(BASE_DIR / f.file_path) for f in files]

    ok = send_deadline_email(
        to_email=to_email,
        activity_title='Prueba SMTP',
        due_date=datetime.utcnow().isoformat(),
        owner_name=current_user.username,
        attachments=attachments,
    )
    return {
        'ok': bool(ok),
        'to': to_email,
        'activity_id': activity_id,
        'attachments_count': len(attachments),
    }

@app.post('/activities/{activity_id}/invite', response_model=schemas.InvitationOut)
def create_invitation(activity_id: int, invite: schemas.InvitationCreate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    result = crud.create_invitation(db, activity_id, current_user.id, invite.invited_email, current_user.username)
    if not result:
        raise HTTPException(status_code=404, detail='Activity not found')
    
    # Obtener datos de la actividad
    activity = db.query(models.Activity).filter(models.Activity.id == activity_id).first()
    activity_title = activity.title if activity else "Actividad sin título"
    
    # Enviar email
    send_invitation_email(
        to_email=invite.invited_email,
        activity_title=activity_title,
        invitation_token=result.token,
        inviter_name=current_user.username
    )
    
    return result

@app.get('/collaborators', response_model=list[schemas.CollaboratorOut])
def list_collaborators(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail='Solo usuarios Admin pueden asignar colaboradores')
    return crud.list_collaborators(db, current_user.id)

@app.patch('/admin/users/{user_id}/role')
def update_user_role(user_id: int, role: str, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    """Actualizar rol de un usuario a Admin o collaborator"""
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail='Solo usuarios Admin pueden cambiar roles')
    if role not in ["Admin", "collaborator"]:
        raise HTTPException(status_code=400, detail='Rol inválido')
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail='Usuario no encontrado')
    
    user.role = role
    db.commit()
    return {"success": True, "message": f"Rol actualizado a {role}"}

@app.delete('/admin/users/{user_id}')
def delete_user(user_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    """Eliminar un usuario (solo Admin)"""
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail='Solo usuarios Admin pueden eliminar usuarios')
    
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail='No puedes eliminar tu propia cuenta')
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail='Usuario no encontrado')
    
    db.delete(user)
    db.commit()
    return {"success": True, "message": f"Usuario {user.username} eliminado"}

@app.post('/activities/{activity_id}/assign', response_model=schemas.ActivityOut)
def assign_activity(activity_id: int, body: schemas.AssignActivityRequest, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail='Solo usuarios Admin pueden asignar actividades')
    activity, collaborator, invitation = crud.assign_activity_to_collaborator(
        db, activity_id, current_user.id, body.collaborator_id, current_user.username
    )
    if not activity:
        raise HTTPException(status_code=404, detail='Activity not found')
    if not collaborator:
        raise HTTPException(status_code=404, detail='Collaborator not found')
    
    # Enviar email de notificación al colaborador asignado
    if collaborator.email:
        send_assignment_notification_email(
            to_email=collaborator.email,
            activity_title=activity.title,
            activity_description=activity.description or '',
            assigner_name=current_user.username
        )
    
    # Si también se creó una invitación (para nuevos usuarios), enviar ese email también
    if invitation:
        send_invitation_email(
            to_email=collaborator.email or collaborator.username,
            activity_title=activity.title,
            invitation_token=invitation.token,
            inviter_name=current_user.username
        )
    return activity

@app.get('/activities/{activity_id}/invitations', response_model=list[schemas.InvitationOut])
def list_invitations(activity_id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    result = crud.list_invitations_for_activity(db, activity_id, current_user.id)
    if result is None:
        raise HTTPException(status_code=404, detail='Activity not found')
    return result

@app.get('/invite/{token}')
def get_invitation(token: str, db: Session = Depends(get_db)):
    inv = crud.get_invitation_by_token(db, token)
    if not inv:
        raise HTTPException(status_code=400, detail='Invalid or expired invitation token')
    return {
        "activity_id": inv.activity_id,
        "invited_email": inv.invited_email,
        "expires_at": inv.expires_at.isoformat() if inv.expires_at else None,
    }

@app.post('/invite/{token}/accept-login', response_model=schemas.Token)
def accept_invitation_login(token: str, payload: schemas.InvitationAccept, db: Session = Depends(get_db)):
    """Accept invitation with custom username and password."""
    inv = crud.get_invitation_by_token(db, token)
    if not inv:
        raise HTTPException(status_code=400, detail='Invalid or expired invitation token')
    
    # Check if username already exists
    existing_user = crud.get_user_by_username(db, payload.username)
    if existing_user:
        # If user exists, verify they can log in with provided password
        if not auth.verify_password(payload.password, existing_user.hashed_password):
            raise HTTPException(status_code=400, detail='Usuario ya existe con contraseña diferente')
        guest_user = existing_user
    else:
        # Create new user with custom credentials
        guest_user = crud.create_user(db, schemas.UserCreate(
            username=payload.username,
            password=payload.password,
            email=inv.invited_email,
            full_name=payload.username
        ))

    # Grant access to this activity
    if not crud.has_activity_access(db, inv.activity_id, guest_user.id):
        db.add(models.ActivityAccess(
            activity_id=inv.activity_id,
            user_id=guest_user.id,
            granted_by=inv.created_by
        ))
        db.commit()

    crud.accept_invitation(db, token, guest_user.username)
    access_token = auth.create_access_token(data={"sub": guest_user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get('/me', response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@app.post('/admin/admin-users', response_model=schemas.UserOut)
def create_admin_user(payload: schemas.AdminUserCreate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    user = crud.create_admin_user(db, current_user, payload)
    if not user:
        raise HTTPException(status_code=403, detail='Solo usuarios Admin pueden crear usuarios Admin')
    return user
