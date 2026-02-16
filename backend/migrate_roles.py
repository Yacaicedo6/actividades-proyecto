"""Script para migrar roles 'core' a 'Admin' en la base de datos"""
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)
conn = engine.connect()

result = conn.execute(text("UPDATE users SET role = 'Admin' WHERE role = 'core'"))
conn.commit()

print(f"✅ {result.rowcount} usuarios actualizados de 'core' a 'Admin'")
conn.close()
