# backend/app.py
from flask import Flask, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from datetime import datetime, timedelta
import os
import jwt  # PyJWT
from flask_cors import CORS

# Local imports
from extensions import db, migrate, bcrypt
from models.user_model import User
from routes.destination_routes import destinations_bp
from routes.auth import auth_bp


def create_app():
    app = Flask(__name__)
    CORS(app, supports_credentials=True, resources={
    r"/*": {
        "origins": ["http://localhost:5173"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})


    # --- Config ---
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg2://goquest_user:viha%401812@localhost:5432/goquest_db",
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "supersecretkey")

    # --- Init Extensions ---
    db.init_app(app)
    migrate.init_app(app, db)
    bcrypt.init_app(app)

    with app.app_context():
        db.create_all()

    # --- Auth helper ---
    def token_required(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            token = None

            # Expect: Authorization: Bearer <token>
            if "Authorization" in request.headers:
                parts = request.headers["Authorization"].split()
                if len(parts) == 2 and parts[0].lower() == "bearer":
                    token = parts[1]
                else:
                    return jsonify({"error": "Token format is invalid!"}), 401

            if not token:
                return jsonify({"error": "Token is missing!"}), 401

            try:
                data = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
                current_user = User.query.get(data["user_id"])
                if not current_user:
                    return jsonify({"error": "User not found"}), 401
            except jwt.ExpiredSignatureError:
                return jsonify({"error": "Token expired!"}), 401
            except jwt.InvalidTokenError:
                return jsonify({"error": "Invalid token!"}), 401

            return f(current_user, *args, **kwargs)

        return decorated

    # --- Routes ---
    @app.get("/")
    def home():
        return jsonify({"message": "GoQuest Transit API is running 🚀"})

    @app.post("/signup")
    def signup():
        data = request.get_json() or {}
        if not data.get("username") or not data.get("email") or not data.get("password"):
            return jsonify({"error": "Missing required fields"}), 400

        # Check if user already exists
        exists = User.query.filter(
            (User.username == data["username"]) | (User.email == data["email"])
        ).first()
        if exists:
            return jsonify({"error": "User already exists"}), 409

        # Hash password
        hashed_pw = generate_password_hash(data["password"], method="pbkdf2:sha256")

        user = User(username=data["username"], email=data["email"], password=hashed_pw)
        db.session.add(user)
        db.session.commit()

        return jsonify({"message": "User created successfully"}), 201

    @app.post("/login")
    def login():
        data = request.get_json() or {}
        if not data.get("username") or not data.get("password"):
            return jsonify({"error": "Missing username or password"}), 400

        user = User.query.filter_by(username=data["username"]).first()
        if not user or not check_password_hash(user.password, data["password"]):
            return jsonify({"error": "Invalid credentials"}), 401

        token = jwt.encode(
            {"user_id": user.id, "exp": datetime.utcnow() + timedelta(hours=2)},
            app.config["SECRET_KEY"],
            algorithm="HS256",
        )
        return jsonify({"token": token})

    @app.get("/profile")
    @token_required
    def profile(current_user):
        return jsonify(
            {"id": current_user.id, "username": current_user.username, "email": current_user.email}
        )
    
    # --- Register blueprints ---
    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(destinations_bp, url_prefix="/destinations")
    

    # Debug: Print all routes at startup
    with app.app_context():
        print("\n--- Registered Routes ---")
        for rule in app.url_map.iter_rules():
            print(f"{rule.endpoint}: {rule}")
        print("--------------------------\n")

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
