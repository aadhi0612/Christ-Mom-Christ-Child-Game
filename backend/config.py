# backend/config.py

import secrets

# Configuration settings for the Chris Mom and Child Game application
class Config:
    # MongoDB Configuration
    MONGODB_URI = 'mongodb://localhost:3002/'
    DATABASE_NAME = 'chris_mom_game'

    # JWT Configuration
    SECRET_KEY = secrets.token_hex(32)  # Generates a secure random 32-byte hex key
    JWT_ACCESS_TOKEN_EXPIRES = 3600  # 1 hour token expiration

    # Application Settings
    DEBUG = True
    CORS_ENABLED = True

    # Admin Credentials
    ADMIN_EMAIL = "admin@christmom.com"
    ADMIN_PASSWORD = "Admin@123"  # You should change this to a secure password

