from flask import Flask, request, jsonify
import requests
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

GOOGLE_API_KEY = "YOUR_GOOGLE_MAPS_API_KEY_HERE"

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
    print(data)

    return jsonify(data)

if __name__ == "__main__":
    app.run(debug=True)
