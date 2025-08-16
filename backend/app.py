from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
import os
from functools import wraps

# Initialize DB
db = SQLAlchemy()

def create_app():
    app = Flask(__name__)

    # Database setup (from env or fallback to local)
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
        "DATABASE_URL",
        "postgresql://goquest_user:viha%401812@localhost:5432/goquest_db"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SECRET_KEY"] = "supersecretkey"  # change in production

    db.init_app(app)

    # -----------------------------
    # Models
    # -----------------------------
    class User(db.Model):
        __tablename__ = "users"
        id = db.Column(db.Integer, primary_key=True)
        username = db.Column(db.String(50), unique=True, nullable=False)
        email = db.Column(db.String(100), unique=True, nullable=False)
        password = db.Column(db.String(200), nullable=False)

    # Create tables
    with app.app_context():
        db.create_all()

    # -----------------------------
    # Token Required Decorator
    # -----------------------------
    def token_required(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            token = None

            # Token must be sent in Authorization header as Bearer <token>
            if "Authorization" in request.headers:
                try:
                    token = request.headers["Authorization"].split(" ")[1]
                except IndexError:
                    return jsonify({"error": "Token format is invalid!"}), 401

            if not token:
                return jsonify({"error": "Token is missing!"}), 401

            try:
                data = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
                current_user = User.query.get(data["user_id"])
            except Exception as e:
                return jsonify({"error": "Token is invalid or expired!"}), 401

            return f(current_user, *args, **kwargs)
        return decorated

    # -----------------------------
    # Routes
    # -----------------------------
    @app.route("/", methods=["GET"])
    def home():
        return jsonify({"message": "GoQuest Transit API is running 🚀"})

    @app.route("/signup", methods=["POST"])
    def signup():
        data = request.get_json()
        print("📩 Received JSON:", data)
        
        if not data or not data.get("username") or not data.get("email") or not data.get("password"):
            return jsonify({"error": "Missing required fields"}), 400

        # Check if user already exists
        if User.query.filter((User.username == data["username"]) | (User.email == data["email"])).first():
            return jsonify({"error": "User already exists"}), 409

        # Hash password
        hashed_pw = generate_password_hash(data["password"], method="pbkdf2:sha256")

        new_user = User(username=data["username"], email=data["email"], password=hashed_pw)
        db.session.add(new_user)
        db.session.commit()

        return jsonify({"message": "User created successfully"}), 201

    @app.route("/login", methods=["POST"])
    def login():
        data = request.get_json()

        if not data or not data.get("username") or not data.get("password"):
            return jsonify({"error": "Missing username or password"}), 400

        user = User.query.filter_by(username=data["username"]).first()

        if not user or not check_password_hash(user.password, data["password"]):
            return jsonify({"error": "Invalid credentials"}), 401

        # Generate JWT token
        token = jwt.encode(
            {
                "user_id": user.id,
                "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=2)
            },
            app.config["SECRET_KEY"],
            algorithm="HS256"
        )

        return jsonify({"token": token})

    @app.route("/profile", methods=["GET"])
    @token_required
    def profile(current_user):
        return jsonify({
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email
        })

    return app


# Run the app
if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
