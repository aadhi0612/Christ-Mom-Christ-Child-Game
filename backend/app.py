# backend/app.py

from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from config import Config
from routes import routes
from models import DatabaseManager

def create_app():
    app = Flask(__name__)
    
    # Configuration
    app.config.from_object(Config)
    
    # CORS
    CORS(app) if Config.CORS_ENABLED else None
    
    # JWT
    jwt = JWTManager(app)
    
    # Database
    db_manager = DatabaseManager(Config)
    
    # Register Routes
    app.register_blueprint(routes, url_prefix='/api')
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=Config.DEBUG, host='0.0.0.0', port=5000)