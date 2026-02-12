"""
Script para crear un usuario CORE directamente en la base de datos
"""
import sys
sys.path.insert(0, '.')

from app.database import SessionLocal, engine, Base
from app import models
from passlib.context import CryptContext

# Configurar hash de contraseñas
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

# Crear tablas si no existen
Base.metadata.create_all(bind=engine)

db = SessionLocal()

# Datos del usuario
username = "yan"
password = "Samantha27"
hashed_password = hash_password(password)

# Verificar si el usuario ya existe
existing_user = db.query(models.User).filter(models.User.username == username).first()

if existing_user:
    print(f"⚠️  El usuario '{username}' ya existe.")
    print(f"   Rol actual: {existing_user.role}")
    
    if existing_user.role != "core":
        existing_user.role = "core"
        existing_user.hashed_password = hashed_password  # Actualizar también la contraseña
        db.commit()
        print(f"✅ Usuario '{username}' actualizado a ROL: CORE")
        print(f"✅ Contraseña actualizada")
    else:
        print(f"✅ El usuario ya es CORE. Actualizando solo la contraseña...")
        existing_user.hashed_password = hashed_password
        db.commit()
        print(f"✅ Contraseña actualizada para '{username}'")
else:
    # Crear nuevo usuario CORE
    new_user = models.User(
        username=username,
        email=username,
        full_name=username,
        role="core",  # 👑 ROL CORE
        hashed_password=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    print(f"✅ Usuario CORE creado exitosamente:")
    print(f"   👤 Username: {new_user.username}")
    print(f"   👑 Rol: {new_user.role}")
    print(f"   🔑 Contraseña: Samantha27")

# Mostrar todos los usuarios
print("\n📋 Todos los usuarios en el sistema:")
all_users = db.query(models.User).all()
for user in all_users:
    icon = "👑" if user.role == "core" else "👤"
    print(f"   {icon} {user.username} - Rol: {user.role}")

db.close()

print("\n✨ ¡Listo! Ahora puedes iniciar sesión con:")
print(f"   Usuario: {username}")
print(f"   Contraseña: Samantha27")
