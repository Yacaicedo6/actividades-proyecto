import os
import base64
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from dotenv import load_dotenv
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from .logging_config import logger

load_dotenv()

GMAIL_CLIENT_ID = os.getenv("GMAIL_CLIENT_ID")
GMAIL_CLIENT_SECRET = os.getenv("GMAIL_CLIENT_SECRET")
GMAIL_REFRESH_TOKEN = os.getenv("GMAIL_REFRESH_TOKEN")
GMAIL_USER = os.getenv("GMAIL_USER")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


def _get_gmail_service():
    creds = Credentials(
        token=None,
        refresh_token=GMAIL_REFRESH_TOKEN,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=GMAIL_CLIENT_ID,
        client_secret=GMAIL_CLIENT_SECRET,
        scopes=["https://www.googleapis.com/auth/gmail.send"]
    )
    return build("gmail", "v1", credentials=creds)


def _send_email(to_email: str, subject: str, html_content: str) -> bool:
    if not all([GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, GMAIL_USER]):
        logger.warning("Gmail API no configurada. Faltan variables de entorno.")
        return False
    try:
        service = _get_gmail_service()
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"Sistema de Actividades <{GMAIL_USER}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html_content, "html"))

        raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()
        service.users().messages().send(userId="me", body={"raw": raw}).execute()
        logger.info(f"Email enviado correctamente a {to_email}")
        return True
    except HttpError as e:
        logger.error(f"Error HTTP al enviar email a {to_email}: {e}", exc_info=True)
        return False
    except Exception as e:
        logger.error(f"Error al enviar email a {to_email}: {e}", exc_info=True)
        return False


def send_invitation_email(to_email: str, activity_title: str, invitation_token: str, inviter_name: str):
    acceptance_link = f"{FRONTEND_URL}?token={invitation_token}"
    html = f"""
<html>
  <head><meta charset="UTF-8"></head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px;">
      <h2 style="color: #2c3e50; margin-top: 0;">Invitacion a colaborar</h2>
      <p><strong>{inviter_name}</strong> te ha invitado a trabajar en:</p>
      <div style="background-color: #ecf0f1; padding: 15px; border-left: 4px solid #3498db; margin: 20px 0;">
        <h3 style="margin: 0; color: #2c3e50;">{activity_title}</h3>
      </div>
      <p>Para aceptar la invitacion, haz clic en el boton:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{acceptance_link}" style="background-color: #27ae60; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Aceptar Invitacion</a>
      </div>
      <p style="color: #7f8c8d; font-size: 0.9em;">Este enlace expirara en 7 dias.</p>
      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
      <p style="font-size: 0.85em; color: #999; text-align: center; margin: 0;">
        Sistema de Seguimiento de Actividades<br>
        Si no reconoces esta invitacion, puedes ignorar este mensaje.
      </p>
    </div>
  </body>
</html>
"""
    result = _send_email(to_email, f"Invitacion a colaborar: {activity_title}", html)
    if not result:
        logger.info(f"FALLBACK TOKEN para {to_email}: {invitation_token}")
    return result


def send_assignment_notification_email(to_email: str, activity_title: str, activity_description: str, assigner_name: str):
    html = f"""
<html>
  <head><meta charset="UTF-8"></head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <h2 style="color: #2c3e50;">Nueva actividad asignada</h2>
      <p><strong>{assigner_name}</strong> te ha asignado la siguiente actividad:</p>
      <div style="background-color: #ecf0f1; padding: 15px; border-left: 4px solid #3498db; margin: 20px 0;">
        <h3 style="margin: 0; color: #2c3e50;">{activity_title}</h3>
        <p style="margin: 10px 0 0 0; color: #555;">{activity_description or ''}</p>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{FRONTEND_URL}" style="background-color: #27ae60; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Ir a la Plataforma</a>
      </div>
    </div>
  </body>
</html>
"""
    return _send_email(to_email, f"Nueva actividad asignada: {activity_title}", html)


def send_deadline_email(to_email: str, activity_title: str, due_date: str, owner_name: str, attachments: list = None):
    html = f"""
<html>
  <head><meta charset="UTF-8"></head>
  <body style="font-family: Arial, sans-serif; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <h3>Recordatorio: actividad proxima a vencer</h3>
      <p><strong>{activity_title}</strong></p>
      <p>Asignada por: {owner_name}</p>
      <p>Fecha limite: <strong>{due_date}</strong></p>
      <div style="text-align: center; margin: 20px 0;">
        <a href="{FRONTEND_URL}" style="background:#27ae60; color:#fff; padding:10px 18px; text-decoration:none; border-radius:4px;">Abrir aplicacion</a>
      </div>
    </div>
  </body>
</html>
"""
    return _send_email(to_email, f"Recordatorio: actividad proxima a vencer - {activity_title}", html)