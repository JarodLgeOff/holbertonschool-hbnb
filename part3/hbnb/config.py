import os

class Config:
    """Base configuation class"""
    SECRET_KEY = os.getenv('SECRET_KEY', 'default_secret_key')
    DEBUG = False

class DevelopmentConfig(Config):
    """Developpement environnement configuration"""
    DEBUG = True
    SQLALCHMEY_DATABSE_URI = 'sqlite:///developpement.db'

config = {
    'development': DevelopmentConfig,
    'default': DevelopmentConfig
}
