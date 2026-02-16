"""
Script para gestionar usuarios CORE en la base de datos PostgreSQL (Render)

Uso:
    # Listar todos los usuarios
    python manage_users.py list

    # Crear usuario CORE
    python manage_users.py create --username "usuario" --email "email@ejemplo.com" --password "contraseña"

    # Eliminar usuario
    python manage_users.py delete --username "usuario"

    # Convertir a CORE
    python manage_users.py promote --username "usuario"
"""

import argparse
import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print(" Error: DATABASE_URL no configurada en .env")
    sys.exit(1)

# Fix para Render (postgres:// -> postgresql://)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def list_users():
    """Listar todos los usuarios"""
    with SessionLocal() as db:
        result = db.execute(text("SELECT id, username, email, role FROM users ORDER BY id"))
        users = result.fetchall()
        
        if not users:
            print(" No hay usuarios en la base de datos")
            return
        
        print("\n📋 USUARIOS EN LA BASE DE DATOS:")
        print("=" * 80)
        print(f"{'ID':<5} {'USERNAME':<20} {'EMAIL':<30} {'ROLE':<10}")
        print("=" * 80)
        for user in users:
            print(f"{user[0]:<5} {user[1]:<20} {user[2] or 'N/A':<30} {user[3]:<10}")
        print("=" * 80)
        print(f"\nTotal: {len(users)} usuarios")


def create_user(username, email, password, role="Admin"):
    """Crear un nuevo usuario"""
    with SessionLocal() as db:
        # Verificar si ya existe
        existing = db.execute(text("SELECT id FROM users WHERE username = :username"), {"username": username}).fetchone()
        if existing:
            print(f"❌ Error: El usuario '{username}' ya existe")
            return False
        
        # Hash de contraseña
        hashed_password = pwd_context.hash(password)
        
        # Insertar usuario
        db.execute(
            text("""
                INSERT INTO users (username, email, role, hashed_password) 
                VALUES (:username, :email, :role, :hashed_password)
            """),
            {
                "username": username,
                "email": email,
                "role": role,
                "hashed_password": hashed_password
            }
        )
        db.commit()
        
        print(f"✅ Usuario creado exitosamente:")
        print(f"   Username: {username}")
        print(f"   Email: {email}")
        print(f"   Role: {role}")
        return True


def delete_user(username):
    """Eliminar un usuario"""
    with SessionLocal() as db:
        # Verificar si existe
        existing = db.execute(text("SELECT id FROM users WHERE username = :username"), {"username": username}).fetchone()
        if not existing:
            print(f"❌ Error: El usuario '{username}' no existe")
            return False
        
        # Eliminar usuario
        db.execute(text("DELETE FROM users WHERE username = :username"), {"username": username})
        db.commit()
        
        print(f"✅ Usuario '{username}' eliminado exitosamente")
        return True


def promote_user(username):
    """Convertir usuario a CORE"""
    with SessionLocal() as db:
        # Verificar si existe
        existing = db.execute(
            text("SELECT id, role FROM users WHERE username = :username"), 
            {"username": username}
        ).fetchone()
        
        if not existing:
            print(f"❌ Error: El usuario '{username}' no existe")
            return False
        
        if existing[1] == "Admin":
            print(f"⚠️ El usuario '{username}' ya es Admin")
            return True
        
        # Actualizar a Admin
        db.execute(
            text("UPDATE users SET role = 'Admin' WHERE username = :username"),
            {"username": username}
        )
        db.commit()
        
        print(f"✅ Usuario '{username}' promovido a Admin exitosamente")
        return True


def main():
    parser = argparse.ArgumentParser(description="Gestionar usuarios en PostgreSQL (Render)")
    subparsers = parser.add_subparsers(dest="command", help="Comando a ejecutar")
    
    # Comando list
    subparsers.add_parser("list", help="Listar todos los usuarios")
    
    # Comando create
    create_parser = subparsers.add_parser("create", help="Crear un nuevo usuario CORE")
    create_parser.add_argument("--username", required=True, help="Nombre de usuario")
    create_parser.add_argument("--email", required=True, help="Email del usuario")
    create_parser.add_argument("--password", required=True, help="Contraseña del usuario")
    
    # Comando delete
    delete_parser = subparsers.add_parser("delete", help="Eliminar un usuario")
    delete_parser.add_argument("--username", required=True, help="Nombre de usuario a eliminar")
    
    # Comando promote
    promote_parser = subparsers.add_parser("promote", help="Convertir usuario a CORE")
    promote_parser.add_argument("--username", required=True, help="Nombre de usuario a promover")
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    try:
        if args.command == "list":
            list_users()
        elif args.command == "create":
            create_user(args.username, args.email, args.password)
        elif args.command == "delete":
            delete_user(args.username)
        elif args.command == "promote":
            promote_user(args.username)
    except Exception as e:
        print(f" Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
