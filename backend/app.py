from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from config import Config
from routes import api_bp



# Global extensions
jwt = JWTManager()
db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Init extensions
    CORS(app, supports_credentials=True)
    jwt.init_app(app)
    db.init_app(app)
    app.register_blueprint(api_bp)

    # Register blueprints
    from routes.auth import auth_bp
    from routes.user import user_bp
    from routes.feedback import feedback_bp
    from routes.trips import trips_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(user_bp, url_prefix="/api/user")
    app.register_blueprint(feedback_bp, url_prefix="/api/feedback")
    app.register_blueprint(trips_bp, url_prefix="/api/trips")

    # Create tables (dev-only)
    with app.app_context():
        db.create_all()

    @app.route("/")
    def home():
        return {"message": "GoQuest Transit Backend is running 🚀"}
    
    


    return app

if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=True)