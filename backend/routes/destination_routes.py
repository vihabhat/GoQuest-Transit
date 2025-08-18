from flask import Blueprint, request, jsonify
from extensions import db
from models import Destination

# Define the blueprint
destinations_bp = Blueprint("destinations", __name__)

# -------------------------------
# Add a new destination (POST)
# -------------------------------
@destinations_bp.route("/", methods=["POST"])
def add_destination():
    try:
        data = request.get_json()
        new_dest = Destination(
            name=data["name"],
            description=data["description"],
            location=data["location"]
        )
        db.session.add(new_dest)
        db.session.commit()
        return jsonify({"message": "Destination added successfully!"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400


# -------------------------------
# Get all destinations (GET)
# -------------------------------
@destinations_bp.route("/", methods=["GET"])
def get_destinations():
    destinations = Destination.query.all()
    results = [
        {
            "id": d.id,
            "name": d.name,
            "description": d.description,
            "location": d.location
        }
        for d in destinations
    ]
    return jsonify(results), 200


# -------------------------------
# Get a single destination by ID (GET)
# -------------------------------
@destinations_bp.route("/<int:id>", methods=["GET"])
def get_destination(id):
    dest = Destination.query.get_or_404(id)
    return jsonify({
        "id": dest.id,
        "name": dest.name,
        "description": dest.description,
        "location": dest.location
    }), 200


# -------------------------------
# Update a destination (PUT)
# -------------------------------
@destinations_bp.route("/<int:id>", methods=["PUT"])
def update_destination(id):
    dest = Destination.query.get_or_404(id)
    data = request.get_json()

    dest.name = data.get("name", dest.name)
    dest.description = data.get("description", dest.description)
    dest.location = data.get("location", dest.location)

    db.session.commit()
    return jsonify({"message": "Destination updated successfully!"}), 200


# -------------------------------
# Delete a destination (DELETE)
# -------------------------------
@destinations_bp.route("/<int:id>", methods=["DELETE"])
def delete_destination(id):
    dest = Destination.query.get_or_404(id)
    db.session.delete(dest)
    db.session.commit()
    return jsonify({"message": "Destination deleted successfully!"}), 200
