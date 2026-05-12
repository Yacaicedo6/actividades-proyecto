import os
import resend
from dotenv import load_dotenv
from .logging_config import logger

load_dotenv()

RESEND_API_KEY = os.getenv("RESEND_API_KEY")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
FROM_EMAIL = "Sistema de Actividades <onboarding@resend.dev>"

resend.api_key = RESEND_API_KEY


def send_invitation_email(to_email: str, activity_title: str, invitation_token: str, inviter_name: str):
    if not RESEND_API_KEY:
        logger.warning("Resend no configurado. RESEND_API_KEY faltante")
        logger.info(f"FALLBACK TOKEN para {to_email}: {invitation_token}")
        return False

    try:
        acceptance_link = f"{FRONTEND_URL}?token={invitation_token}"

        params = {
            "from": FROM_EMAIL,
            "to": [to_email],
            "subject": f"Invitacion a colaborar: {activity_title}",
            "html": f"""
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h2 style="color: #2c3e50; margin-top: 0;">Invitacion a colaborar</h2>
      <p><strong>{inviter_name}</strong> te ha invitado a trabajar en:</p>
      <div style="background-color: #ecf0f1; padding: 15px; border-left: 4px solid #3498db; margin: 20px 0;">
        <h3 style="margin: 0; color: #2c3e50;">{activity_title}</h3>
      </div>
      <p>Para aceptar la invitacion y acceder a la tarea, haz clic en el boton:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{acceptance_link}" style="background-color: #27ae60; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Aceptar Invitacion</a>
      </div>
      <p style="color: #7f8c8d; font-size: 0.9em;">Este enlace expirara en 7 dias.</p>
      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
      <p style="font-size: 0.85em; color: #999; text-align: center; margin: 0;">
        Sistema de Seguimiento de Actividades<br>
        Este correo fue enviado porque {inviter_name} te invito a colaborar.<br>
        Si no reconoces esta invitacion, puedes ignorar este mensaje.
      </p>
    </div>
  </body>
</html>
""",
        }

        response = resend.Emails.send(params)
        logger.info(f"Email enviado a {to_email} para tarea '{activity_title}' (ID: {response['id']})")
        return True
    except Exception as e:
        logger.error(f"Error al enviar email: {str(e)}", exc_info=True)
        logger.info(f"FALLBACK TOKEN para {to_email}: {invitation_token}")
        return False


def send_assignment_notification_email(to_email: str, activity_title: str, activity_description: str, assigner_name: str):
    if not RESEND_API_KEY:
        logger.warning("Resend no configurado. RESEND_API_KEY faltante")
        return False

    try:
        params = {
            "from": FROM_EMAIL,
            "to": [to_email],
            "subject": f"Nueva actividad asignada: {activity_title}",
            "html": f"""
<html>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <h2 style="color: #2c3e50;">Nueva actividad asignada</h2>
      <p><strong>{assigner_name}</strong> te ha asignado la siguiente actividad:</p>
      <div style="background-color: #ecf0f1; padding: 15px; border-left: 4px solid #3498db; margin: 20px 0;">
        <h3 style="margin: 0; color: #2c3e50;">{activity_title}</h3>
        <p style="margin: 10px 0 0 0; color: #555;">{activity_description or ''}</p>
      </div>
      <p>Accede a la plataforma para ver todos los detalles:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{FRONTEND_URL}" style="background-color: #27ae60; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Ir a la Plataforma</a>
      </div>
    </div>
  </body>
</html>
""",
        }

        response = resend.Emails.send(params)
        logger.info(f"Notificacion de asignacion enviada a {to_email} para '{activity_title}' (ID: {response['id']})")
        return True
    except Exception as e:
        logger.error(f"Error al enviar notificacion de asignacion: {str(e)}", exc_info=True)
        return False


def send_deadline_email(to_email: str, activity_title: str, due_date: str, owner_name: str, attachments: list = None):
    if not RESEND_API_KEY:
        logger.warning(f"Resend no configurado. No se envia recordatorio a {to_email}")
        return False

    try:
        params = {
            "from": FROM_EMAIL,
            "to": [to_email],
            "subject": f"Recordatorio: actividad proxima a vencer - {activity_title}",
            "html": f"""
<html>
  <body style="font-family: Arial, sans-serif; color: #333;">
  <div style="max-width:600px;margin:0 auto;padding:20px;border:1px solid #ddd;border-radius:8px;">
    <h3>Recordatorio: actividad proxima a vencer</h3>
    <p><strong>{activity_title}</strong></p>
    <p>Asignada por: {owner_name}</p>
    <p>Fecha limite: <strong>{due_date}</strong></p>
    <p><a href="{FRONTEND_URL}" style="background:#27ae60;color:#fff;padding:10px 18px;text-decoration:none;border-radius:4px;">Abrir aplicacion</a></p>
  </div>
  </body>
</html>
""",
        }

        response = resend.Emails.send(params)
        logger.info(f"Recordatorio enviado a {to_email} para '{activity_title}' (ID: {response['id']})")
        return True
    except Exception as e:
        logger.error(f"Error al enviar recordatorio: {str(e)}", exc_info=True)
        return False