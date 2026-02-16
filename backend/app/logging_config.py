import logging
import sys
from pathlib import Path

# Crear directorio de logs si no existe
log_dir = Path("logs")
log_dir.mkdir(exist_ok=True)

# Configuración del logger
def setup_logger(name: str = "actividades_app") -> logging.Logger:
    """Configura y retorna un logger con formato estructurado"""
    
    logger = logging.getLogger(name)
    
    # Evitar duplicar handlers si ya existe
    if logger.handlers:
        return logger
    
    logger.setLevel(logging.INFO)
    
    # Formato detallado
    formatter = logging.Formatter(
        '[%(asctime)s] %(levelname)-8s [%(name)s:%(funcName)s:%(lineno)d] - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Handler para consola
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # Handler para archivo
    file_handler = logging.FileHandler(log_dir / "app.log", encoding='utf-8')
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
    
    # Handler para errores críticos
    error_handler = logging.FileHandler(log_dir / "errors.log", encoding='utf-8')
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(formatter)
    logger.addHandler(error_handler)
    
    return logger

# Logger por defecto
logger = setup_logger()
