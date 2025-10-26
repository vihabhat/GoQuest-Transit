from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import json
import google.generativeai as genai
import jwt
from datetime import datetime, timedelta
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import JWTManager
import requests
import traceback
from urllib.parse import unquote

# Load environment variables
load_dotenv()

# API Key for Maps/Places (unrestricted or with Places API enabled)
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
if not GOOGLE_MAPS_API_KEY:
    raise EnvironmentError("No GOOGLE_MAPS_API_KEY found. Please set it in .env")

# API Key for Gemini/Chatbot (restricted to Generative Language API)
GOOGLE_GEMINI_API_KEY = os.getenv("GOOGLE_GEMINI_API_KEY")
if not GOOGLE_GEMINI_API_KEY:
    raise EnvironmentError("No GOOGLE_GEMINI_API_KEY found. Please set it in .env")

genai.configure(api_key=GOOGLE_GEMINI_API_KEY)

OLLAMA_API_URL = "http://localhost:11434/api/generate"

# Import your modules
from extensions import db, migrate, bcrypt
from models.user_model import User
from routes.destination_routes import destinations_bp
from routes.auth import auth_bp
from routes.api import api_bp

def create_app():
    app = Flask(__name__)

    # Enable CORS for all routes and all origins
    CORS(app, resources={
        r"/*": {
            "origins": "*",
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })

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

    @app.route("/api/last_mile", methods=["GET"])
    def last_mile():
        """
        Last-mile route API
        Inputs via query params:
            start_lat, start_lng: user's current location
            destination: string, destination address
        Output:
            JSON with dynamic multi-modal route segments (walk, transit, e-scooter)
            with encoded polylines for exact route paths
        """
        try:
            # Get and validate parameters
            start_lat_str = request.args.get("start_lat")
            start_lng_str = request.args.get("start_lng")
            destination = request.args.get("destination")

            print(f"\n=== Last Mile Request ===")
            print(f"Raw destination: {repr(destination)}")
            print(f"Start lat: {start_lat_str}")
            print(f"Start lng: {start_lng_str}")

            # Validate required parameters
            if not start_lat_str or not start_lng_str:
                return jsonify({"error": "start_lat and start_lng are required"}), 400
            
            if not destination:
                return jsonify({"error": "destination is required"}), 400

            # Parse coordinates
            try:
                start_lat = float(start_lat_str)
                start_lng = float(start_lng_str)
            except ValueError as e:
                return jsonify({"error": f"Invalid coordinates: {str(e)}"}), 400

            # Decode destination (handles URL encoding)
            destination = unquote(destination)
            print(f"Decoded destination: {repr(destination)}")

            # Step 1: Geocode the destination
            geocode_url = "https://maps.googleapis.com/maps/api/geocode/json"
            geo_params = {"address": destination, "key": GOOGLE_MAPS_API_KEY}
            
            print(f"Geocoding destination: {destination}")
            geo_resp = requests.get(geocode_url, params=geo_params, timeout=10)
            geo_data = geo_resp.json()
            
            print(f"Geocoding status: {geo_data.get('status')}")
            
            if geo_data.get("status") != "OK":
                error_msg = geo_data.get("error_message", "Unknown error")
                print(f"Geocoding failed: {error_msg}")
                return jsonify({
                    "error": f"Could not find location '{destination}'",
                    "details": error_msg,
                    "status": geo_data.get("status")
                }), 400

            dest_loc = geo_data["results"][0]["geometry"]["location"]
            dest_lat, dest_lng = dest_loc["lat"], dest_loc["lng"]
            formatted_address = geo_data["results"][0]["formatted_address"]
            
            print(f"Destination coordinates: {dest_lat}, {dest_lng}")
            print(f"Formatted address: {formatted_address}")

            # Step 2: Helper to get Google Directions for each leg
            def get_directions(start_lat, start_lng, end_lat, end_lng, mode):
                url = "https://maps.googleapis.com/maps/api/directions/json"
                params = {
                    "origin": f"{start_lat},{start_lng}",
                    "destination": f"{end_lat},{end_lng}",
                    "mode": mode,
                    "key": GOOGLE_MAPS_API_KEY
                }
                
                print(f"Getting {mode} directions...")
                resp = requests.get(url, params=params, timeout=10)
                data = resp.json()
                
                if data.get("status") != "OK" or not data.get("routes"):
                    print(f"{mode} directions failed: {data.get('status')}")
                    return None
                
                route = data["routes"][0]
                leg = route["legs"][0]
                
                # Get the overview polyline (entire route path)
                overview_polyline = route.get("overview_polyline", {}).get("points", "")
                
                # Also get individual step polylines for more detail
                step_polylines = []
                for step in leg.get("steps", []):
                    if "polyline" in step and "points" in step["polyline"]:
                        step_polylines.append(step["polyline"]["points"])
                
                return {
                    "mode": mode.capitalize() if mode != "transit" else "Metro/Bus",
                    "details": leg["steps"][0]["html_instructions"] if leg.get("steps") else f"{mode} from start to destination",
                    "duration": leg["duration"]["text"],
                    "distance": leg["distance"]["text"],
                    "start_lat": leg["start_location"]["lat"],
                    "start_lng": leg["start_location"]["lng"],
                    "end_lat": leg["end_location"]["lat"],
                    "end_lng": leg["end_location"]["lng"],
                    "polyline": overview_polyline,  # Encoded polyline for the entire route
                    "step_polylines": step_polylines  # Individual step polylines
                }

            routes = []

            # Leg 1: Walking route
            walk_leg = get_directions(start_lat, start_lng, dest_lat, dest_lng, mode="walking")
            if walk_leg:
                walk_leg["mode"] = "Walk"
                walk_leg["details"] = f"Walk from your location to {destination}"
                routes.append(walk_leg)
                print(f"✓ Walking route added: {walk_leg['duration']}, {walk_leg['distance']}")

            # Leg 2: Transit (metro/bus) segment
            transit_leg = get_directions(start_lat, start_lng, dest_lat, dest_lng, mode="transit")
            if transit_leg:
                transit_leg["mode"] = "Metro/Bus"
                transit_leg["details"] = f"Take public transit to reach near {destination}"
                routes.append(transit_leg)
                print(f"✓ Transit route added: {transit_leg['duration']}, {transit_leg['distance']}")

            # Leg 3: Bicycling route (as proxy for e-scooter)
            # Use bicycling mode for better e-scooter route planning
            scooter_leg = get_directions(start_lat, start_lng, dest_lat, dest_lng, mode="bicycling")
            if scooter_leg:
                scooter_leg["mode"] = "E-Scooter"
                scooter_leg["details"] = f"Last mile via e-scooter to {destination}"
                routes.append(scooter_leg)
                print(f"✓ E-scooter route added: {scooter_leg['duration']}, {scooter_leg['distance']}")

            # Leg 4: Auto/Cab (using driving mode)
            cab_leg = get_directions(start_lat, start_lng, dest_lat, dest_lng, mode="driving")
            if cab_leg:
                cab_leg["mode"] = "Auto/Cab"
                cab_leg["details"] = f"Take an auto or cab to {destination}"
                routes.append(cab_leg)
                print(f"✓ Auto/Cab route added: {cab_leg['duration']}, {cab_leg['distance']}")

            print(f"Total routes returned: {len(routes)}")
            
            if not routes:
                return jsonify({
                    "error": "Could not find any routes to destination",
                    "routes": []
                }), 200

            return jsonify({
                "routes": routes,
                "destination": formatted_address
            }), 200

        except requests.exceptions.Timeout:
            print("Request timeout")
            return jsonify({"error": "Request timeout - Google Maps API not responding"}), 504
        
        except requests.exceptions.RequestException as e:
            print(f"Request error: {str(e)}")
            return jsonify({"error": f"Network error: {str(e)}"}), 503
        
        except Exception as e:
            print(f"Unexpected error: {str(e)}")
            traceback.print_exc()
            return jsonify({"error": f"Internal server error: {str(e)}"}), 500
    @app.route("/api/nearby_places", methods=["GET", "OPTIONS"])
    def nearby_places():
        # Handle CORS preflight
        if request.method == "OPTIONS":
            return jsonify({"status": "OK"}), 200

        try:
            lat = request.args.get("lat")
            lng = request.args.get("lng")
            radius = request.args.get("radius", 10000)

            print(f"\n=== Nearby Places Request ===")
            print(f"Latitude: {lat}")
            print(f"Longitude: {lng}")
            print(f"Radius: {radius}")

            if not lat or not lng:
                print("Error: Missing latitude or longitude")
                return jsonify({"error": "Latitude and longitude are required."}), 400

            # Validate coordinates
            try:
                lat_float = float(lat)
                lng_float = float(lng)
                if not (-90 <= lat_float <= 90) or not (-180 <= lng_float <= 180):
                    raise ValueError("Invalid coordinate range")
            except ValueError as e:
                print(f"Error: Invalid coordinates - {e}")
                return jsonify({"error": "Invalid latitude or longitude values."}), 400

            # Try multiple search strategies to find places
            results = []
            all_results = []
            search_types = [
                ("tourist_attraction", "tourist attractions"),
                ("museum", "museums"),
                ("park", "parks"),
                ("art_gallery", "art galleries"),
                ("zoo", "zoos"),
                ("amusement_park", "amusement parks"),
                ("aquarium", "aquariums"),
                ("shopping_mall", "shopping malls"),
                ("restaurant", "restaurants"),
                ("cafe", "cafes"),
                ("store", "stores"),
                ("", "all places")
            ]
            
            # Try each type and collect all results
            for place_type, type_name in search_types:
                print(f"Trying {type_name}...")
                type_results = search_places(lat, lng, radius, place_type)
                if type_results:
                    print(f"✓ Found {len(type_results)} {type_name}")
                    # Add to all_results, avoid duplicates by place_id
                    existing_ids = {r.get('place_id') for r in all_results}
                    for result in type_results:
                        if result.get('place_id') not in existing_ids:
                            all_results.append(result)
                    
                    # If we have enough results, stop searching
                    if len(all_results) >= 20:
                        break
                else:
                    print(f"✗ No {type_name} found")
            
            results = all_results
            print(f"\n=== TOTAL RESULTS: {len(results)} ===")
            
            if not results:
                print("No places found after all searches")
                return jsonify({"results": []}), 200
            
            # Limit to 9 places
            limited_results = results[:9]
            print(f"Returning {len(limited_results)} places")

            return jsonify({"results": limited_results}), 200

        except Exception as e:
            print(f"Error: Unexpected exception - {str(e)}")
            import traceback
            traceback.print_exc()
            return jsonify({"error": f"Internal server error: {str(e)}"}), 500

    def search_places(lat, lng, radius, place_type):
        """Helper function to search places using Google Places API"""
        try:
            # Use Nearby Search API with multiple types
            url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
            
            params = {
                "location": f"{lat},{lng}",
                "radius": radius,
                "key": GOOGLE_MAPS_API_KEY
            }
            
            # Add type if specified
            if place_type:
                params["type"] = place_type

            print(f"Searching nearby places with type: {place_type or 'all'}")
            
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code != 200:
                print(f"API Error: {response.status_code} - {response.text}")
                return []

            data = response.json()
            
            if data.get("status") == "OK":
                results = data.get("results", [])
                print(f"Found {len(results)} results")
                return results
            elif data.get("status") == "ZERO_RESULTS":
                print("No results found")
                return []
            elif data.get("status") == "REQUEST_DENIED":
                print(f"Request denied: {data.get('error_message')}")
                # This means the old API is also blocked, need to enable it
                return []
            else:
                print(f"API Status: {data.get('status')} - {data.get('error_message', 'No error message')}")
                return []
                
        except Exception as e:
            print(f"Search error: {str(e)}")
            return []

    @app.route("/test")
    def test():
        return jsonify({
            "message": "Backend working fine!",
            "google_maps_api_key_configured": bool(GOOGLE_MAPS_API_KEY),
            "google_gemini_api_key_configured": bool(GOOGLE_GEMINI_API_KEY),
            "timestamp": datetime.now().isoformat()
        })

    @app.route("/test_places_api")
    def test_places_api():
        """Test if Places API is working"""
        try:
            # Test with a known location (Bangalore)
            test_lat = 12.9716
            test_lng = 77.5946
            
            url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
            params = {
                "location": f"{test_lat},{test_lng}",
                "radius": 5000,
                "type": "restaurant",
                "key": GOOGLE_MAPS_API_KEY
            }
            
            response = requests.get(url, params=params, timeout=10)
            data = response.json()
            
            return jsonify({
                "status": response.status_code,
                "api_status": data.get("status"),
                "error_message": data.get("error_message"),
                "results_count": len(data.get("results", [])),
                "first_result": data.get("results", [{}])[0].get("name") if data.get("results") else None,
                "raw_response": data
            })
        except Exception as e:
            return jsonify({
                "error": str(e),
                "traceback": traceback.format_exc()
            }), 500

    @app.route("/auth/signup", methods=["POST"])
    def signup():
        data = request.get_json()
        return jsonify({"message": "Signup successful"}), 201

    @app.route('/api/chat', methods=['POST', 'OPTIONS'])
    def chat():
        if request.method == 'OPTIONS':
            response = jsonify({'status': 'OK'})
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS")
            response.headers.add("Access-Control-Allow-Headers", "Content-Type")
            return response, 200

        try:
            data = request.get_json()
            user_input = data.get('input', '')
            model = genai.GenerativeModel("gemini-2.5-flash")
            result = model.generate_content(user_input)
            return jsonify({"response": result.text}), 200
        except Exception as e:
            print(f"Chat error: {str(e)}")
            return jsonify({"error": str(e)}), 500

    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(destinations_bp, url_prefix="/destinations")
    app.register_blueprint(api_bp, url_prefix="/api")
    
    from routes.travel import travel_bp
    app.register_blueprint(travel_bp, url_prefix="/travel")
    
    from routes.gamification import gamification_bp
    app.register_blueprint(gamification_bp, url_prefix="/gamification")
    
    from routes.feedback import feedback_bp
    app.register_blueprint(feedback_bp, url_prefix="/feedback")

    return app

if __name__ == "__main__":
    app = create_app()
    print("\n" + "="*50)
    print("🚀 GoQuest Backend Starting...")
    print(f"📍 Server: http://127.0.0.1:5000")
    print(f"🗺️  Google Maps API Key: {'✓ Configured' if GOOGLE_MAPS_API_KEY else '✗ Missing'}")
    print(f"🤖 Google Gemini API Key: {'✓ Configured' if GOOGLE_GEMINI_API_KEY else '✗ Missing'}")
    print(f"🔍 Using Places Text Search API")
    print("="*50 + "\n")
    app.run(debug=True, port=5000)