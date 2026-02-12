import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv
import mimetypes
from email import encoders
from email.mime.base import MIMEBase

load_dotenv()

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
SMTP_USE_SSL = os.getenv("SMTP_USE_SSL", "False").lower() in ("1", "true", "yes")
SMTP_STARTTLS = os.getenv("SMTP_STARTTLS", "True").lower() in ("1", "true", "yes")

def send_invitation_email(to_email: str, activity_title: str, invitation_token: str, inviter_name: str):
    """Enviar email de invitación con enlace clickeable"""
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        print(f"[WARNING] Email no configurado. Credenciales faltantes en .env")
        print(f"Token para {to_email}: {invitation_token}")
        return False
    
    try:
        acceptance_link = f"{FRONTEND_URL}?token={invitation_token}"

        # Crear mensaje (multipart/mixed permite adjuntos)
        message = MIMEMultipart('mixed')
        message['Subject'] = f"¡Has sido invitado a: {activity_title}!"
        message['From'] = SMTP_EMAIL
        message['To'] = to_email

        # Cuerpo alternativo (plain + html)
        alt = MIMEMultipart('alternative')

        text_part = f"""
Hola,

{inviter_name} te ha invitado a colaborar en la tarea de gestión:

{activity_title}

Para aceptar la invitación, haz clic en el siguiente enlace:
{acceptance_link}

Este enlace expirará en 7 días.

¡Saludos!
Sistema de Seguimiento de Actividades
"""

        html_part = f"""
<html>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <h2 style="color: #2c3e50;">¡Has sido invitado a colaborar!</h2>
      <p><strong>{inviter_name}</strong> te ha invitado a trabajar en:</p>
      <div style="background-color: #ecf0f1; padding: 15px; border-left: 4px solid #3498db; margin: 20px 0;">
        <h3 style="margin: 0; color: #2c3e50;">{activity_title}</h3>
      </div>
      <p>Para aceptar la invitación y acceder a la tarea, haz clic en el botón:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{acceptance_link}" style="background-color: #27ae60; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">✓ Aceptar Invitación</a>
      </div>
      <p style="color: #7f8c8d; font-size: 0.9em;">Este enlace expirará en 7 días.</p>
    </div>
  </body>
</html>
"""

        alt.attach(MIMEText(text_part, 'plain'))
        alt.attach(MIMEText(html_part, 'html'))
        message.attach(alt)

        # Envío: soportar SSL directo o STARTTLS según configuración
        if SMTP_USE_SSL:
            server = smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT, timeout=10)
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.sendmail(SMTP_EMAIL, [to_email], message.as_string())
            server.quit()
        else:
            server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=10)
            if SMTP_STARTTLS:
                server.starttls()
            if SMTP_EMAIL and SMTP_PASSWORD:
                server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.sendmail(SMTP_EMAIL, [to_email], message.as_string())
            server.quit()

        print(f"[EMAIL SENT] Para: {to_email}, Tarea: {activity_title}")
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] {str(e)}")
        print(f"[FALLBACK TOKEN] {to_email}: {invitation_token}")
        return False



def _smtp_send(raw_message: str, recipients: list[str]):
  try:
    if SMTP_USE_SSL:
      server = smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT, timeout=10)
      if SMTP_EMAIL and SMTP_PASSWORD:
        server.login(SMTP_EMAIL, SMTP_PASSWORD)
      server.sendmail(SMTP_EMAIL, recipients, raw_message)
      server.quit()
    else:
      server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=10)
      if SMTP_STARTTLS:
        server.starttls()
      if SMTP_EMAIL and SMTP_PASSWORD:
        server.login(SMTP_EMAIL, SMTP_PASSWORD)
      server.sendmail(SMTP_EMAIL, recipients, raw_message)
      server.quit()
    return True
  except Exception as e:
    print(f"[SMTP ERROR] {e}")
    return False


def send_deadline_email(to_email: str, activity_title: str, due_date: str, owner_name: str, attachments: list = None):
  """Enviar email recordatorio de vencimiento. `attachments` es una lista de rutas absolutas a archivos."""
  if not SMTP_EMAIL or not SMTP_PASSWORD:
    print(f"[WARNING] Email no configurado. No se envía recordatorio a {to_email}")
    return False

  try:
    message = MIMEMultipart('mixed')
    message['Subject'] = f"Recordatorio: actividad próxima a vencer - {activity_title}"
    message['From'] = SMTP_EMAIL
    message['To'] = to_email

    alt = MIMEMultipart('alternative')

    text_part = f"""
Hola,

Este es un recordatorio de que la actividad "{activity_title}" asignada por {owner_name} tiene fecha límite: {due_date}.

Por favor ingresa al sistema para actualizar el estado o añadir comentarios.

{FRONTEND_URL}

Saludos,
Sistema de Seguimiento de Actividades
"""

    html_part = f"""
<html>
  <body style="font-family: Arial, sans-serif; color: #333;">
  <div style="max-width:600px;margin:0 auto;padding:20px;border:1px solid #ddd;border-radius:8px;">
    <h3>Recordatorio: actividad próxima a vencer</h3>
    <p><strong>{activity_title}</strong></p>
    <p>Asignada por: {owner_name}</p>
    <p>Fecha límite: <strong>{due_date}</strong></p>
    <p><a href="{FRONTEND_URL}" style="background:#27ae60;color:#fff;padding:10px 18px;text-decoration:none;border-radius:4px;">Abrir aplicación</a></p>
  </div>
  </body>
</html>
"""

    alt.attach(MIMEText(text_part, 'plain'))
    alt.attach(MIMEText(html_part, 'html'))
    message.attach(alt)

    # Adjuntar archivos si los hay
    if attachments:
      for path in attachments:
        try:
          if not os.path.exists(path):
            print(f"[ATTACHMENT SKIP] Missing: {path}")
            continue
          ctype, encoding = mimetypes.guess_type(path)
          if ctype is None:
            ctype = 'application/octet-stream'
          maintype, subtype = ctype.split('/', 1)
          with open(path, 'rb') as fp:
            part = MIMEBase(maintype, subtype)
            part.set_payload(fp.read())
            encoders.encode_base64(part)
            filename = os.path.basename(path)
            part.add_header('Content-Disposition', 'attachment', filename=filename)
            message.attach(part)
        except Exception as e:
          print(f"[ATTACHMENT ERROR] {path} -> {e}")

    sent = _smtp_send(message.as_string(), [to_email])
    if sent:
      print(f"[EMAIL SENT] Reminder to: {to_email}, Task: {activity_title}")
    return sent
  except Exception as e:
    print(f"[EMAIL ERROR] {str(e)}")
    return False
