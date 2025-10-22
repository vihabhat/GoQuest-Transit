from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import google.generativeai as genai
import jwt
from datetime import datetime, timedelta
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import JWTManager
import requests

# Load environment variables
load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise EnvironmentError("No GOOGLE_API_KEY found. Please set it in .env")

genai.configure(api_key=GOOGLE_API_KEY)

# Import your modules
from extensions import db, migrate, bcrypt
from models.user_model import User
from routes.destination_routes import destinations_bp
from routes.auth import auth_bp
from routes.api import api_bp

def create_app():
    app = Flask(__name__)

    # Enable CORS for all routes and all origins (replace "*" with frontend origin for security)
    CORS(app, resources={r"/*": {"origins": "*"}})

    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg2://postgres:yourpassword@localhost:5432/goquest_db"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "supersecretkey")

    db.init_app(app)
    migrate.init_app(app, db)
    bcrypt.init_app(app)
    jwt_manager = JWTManager(app)

    with app.app_context():
        db.create_all()

    def token_required(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            token = None
            if "Authorization" in request.headers:
                parts = request.headers["Authorization"].split()
                if len(parts) == 2 and parts[0].lower() == "bearer":
                    token = parts[1]
            if not token:
                return jsonify({"error": "Token missing"}), 401
            try:
                data = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
                current_user = User.query.get(data["user_id"])
            except jwt.ExpiredSignatureError:
                return jsonify({"error": "Token expired"}), 401
            except jwt.InvalidTokenError:
                return jsonify({"error": "Invalid token"}), 401
            return f(current_user, *args, **kwargs)
        return decorated

    @app.route("/")
    def home():
        return jsonify({"message": "GoQuest Transit API is running 🚀"})

    @app.route("/api/nearby_places", methods=["GET"])
    def nearby_places():
        lat = request.args.get("lat")
        lng = request.args.get("lng")
        radius = request.args.get("radius", 10000)
        place_type = request.args.get("type", "tourist_attraction")
        url = (
            f"https://maps.googleapis.com/maps/api/place/nearbysearch/json?"
            f"location={lat},{lng}&radius={radius}&type={place_type}&key={GOOGLE_API_KEY}"
        )

        response = requests.get(url)
        data = response.json()
        return jsonify(data)

    @app.route("/test")
    def test():
        return jsonify({"message": "Backend working fine!"})

    @app.route("/api/ai_trip", methods=["POST", "OPTIONS"])
    def ai_trip_preflight():
        if request.method == "OPTIONS":
            # Preflight request
            return jsonify({}), 200

        data = request.json
        # TODO: Replace with actual AI trip logic using genai
        return jsonify({"message": "Trip generated successfully", "data": data}), 200

    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(destinations_bp, url_prefix="/destinations")
    app.register_blueprint(api_bp, url_prefix="/api")
    from routes.travel import travel_bp
    app.register_blueprint(travel_bp, url_prefix="/travel")
    # Gamification endpoints
    from routes.gamification import gamification_bp
    app.register_blueprint(gamification_bp, url_prefix="/gamification")
    # Feedback endpoints
    from routes.feedback import feedback_bp
    app.register_blueprint(feedback_bp, url_prefix="/feedback")

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)
