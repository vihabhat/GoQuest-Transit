from flask import Flask, request, jsonify
import requests
from flask_cors import CORS
import google.generativeai as genai
from dotenv import load_dotenv

# ------------------------
# Load env and configure AI
# ------------------------
load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise EnvironmentError("No GOOGLE_API_KEY found. Please set it in .env")
genai.configure(api_key=GOOGLE_API_KEY)

# ------------------------
# Local imports
# ------------------------
from extensions import db, migrate, bcrypt
from models.user_model import User
from routes.destination_routes import destinations_bp
from routes.auth import auth_bp
from routes.api import api_bp  # optional, can keep or remove old AI API

# ------------------------
# Create Flask app
# ------------------------
def create_app():
    app = Flask(__name__)

    # --- CORS ---
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
        "postgresql+psycopg2://gowthami:gowth%40123@localhost:5432/goquest_db"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "supersecretkey")

    # --- Initialize extensions ---
    db.init_app(app)
    migrate.init_app(app, db)
    bcrypt.init_app(app)

    with app.app_context():
        db.create_all()

    # ------------------------
    # Auth helper
    # ------------------------
    def token_required(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            token = None
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

    # ------------------------
    # Basic routes
    # ------------------------
    @app.get("/")
    def home():
        return jsonify({"message": "GoQuest Transit API is running 🚀"})

    @app.post("/signup")
    def signup():
        data = request.get_json() or {}
        if not data.get("username") or not data.get("email") or not data.get("password"):
            return jsonify({"error": "Missing required fields"}), 400

        exists = User.query.filter(
            (User.username == data["username"]) | (User.email == data["email"])
        ).first()
        if exists:
            return jsonify({"error": "User already exists"}), 409

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

    # ------------------------
    # Location APIs
    # ------------------------
    @app.route('/api/update-location', methods=['POST'])
    def update_location():
        data = request.get_json()
        latitude = data.get('latitude')
        longitude = data.get('longitude')

        if latitude is None or longitude is None:
            return jsonify({"error": "Latitude and Longitude are required"}), 400

        try:
            latitude = float(latitude)
            longitude = float(longitude)
        except ValueError:
            return jsonify({"error": "Invalid Latitude or Longitude value"}), 400

        return jsonify({"status": "success"}), 200

    @app.route('/api/nearby-places', methods=['GET'])
    def get_nearby_places_api():
        lat_str = request.args.get('lat')
        lon_str = request.args.get('lon')
        distance_str = request.args.get('distance', '5')

        if lat_str is None or lon_str is None:
            return jsonify({"error": "Latitude and Longitude are required"}), 400

        try:
            lat = float(lat_str)
            lon = float(lon_str)
            max_distance = float(distance_str)
        except ValueError:
            return jsonify({"error": "Invalid Latitude, Longitude or Distance value"}), 400

        nearby_places = [
            {"id": 1, "name": "Place A", "lat": lat + 0.01, "lon": lon + 0.01, "distance": 10},
            {"id": 2, "name": "Place B", "lat": lat + 0.02, "lon": lon + 0.02, "distance": 15}
        ]

        return jsonify(nearby_places)

    # ------------------------
    # AI Trip Planner
    # ------------------------
    @app.route('/api/ai_trip', methods=['POST'])
    def ai_trip():
        data = request.get_json()
        user_input = data.get('query', '')

        if not user_input:
            return jsonify({"error": "Query is required"}), 400

        try:
            # Use a working Gemini model
            model = genai.GenerativeModel("models/gemini-2.5-flash")
            response = model.generate_content(user_input)
            return jsonify({"response": response.text})
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    # ------------------------
    # Test endpoint
    # ------------------------
    @app.route('/test', methods=['GET'])
    def test():
        return jsonify({"message": "Backend is working!"})

    # ------------------------
    # Register blueprints
    # ------------------------
    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(destinations_bp, url_prefix="/destinations")
    app.register_blueprint(api_bp, url_prefix="/api")  # optional

    # Debug: print all routes
    with app.app_context():
        print("\n--- Registered Routes ---")
        for rule in app.url_map.iter_rules():
            print(f"{rule.endpoint}: {rule}")
        print("--------------------------\n")

    response = requests.get(url)
    data = response.json()
    print(data)

# ------------------------
if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)
