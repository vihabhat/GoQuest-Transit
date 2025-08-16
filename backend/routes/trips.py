from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from models.trip_model import Trip

trips_bp = Blueprint("trips", __name__)

@trips_bp.post("")
@jwt_required()
def create_trip():
    uid = get_jwt_identity()
    data = request.get_json() or {}
    destinations = data.get("destinations")  # expect JSON string or array from frontend
    estimated_cost = data.get("estimated_cost")

    if not destinations:
        return {"error": "destinations required"}, 400

    # store destinations as text for MVP (frontend can JSON.stringify)
    if isinstance(destinations, (list, dict)):
        import json
        destinations = json.dumps(destinations)

    trip = Trip(user_id=uid, destinations=destinations, estimated_cost=estimated_cost)
    db.session.add(trip)
    db.session.commit()

    return {"message": "trip created", "trip_id": trip.id}

@trips_bp.get("")
@jwt_required()
def my_trips():
    uid = get_jwt_identity()
    rows = Trip.query.filter_by(user_id=uid).order_by(Trip.created_at.desc()).all()
    out = []
    import json
    for t in rows:
        try:
            dest = json.loads(t.destinations)
        except Exception:
            dest = t.destinations
        out.append({
            "id": t.id,
            "destinations": dest,
            "estimated_cost": t.estimated_cost,
            "created_at": t.created_at.isoformat(),
        })
    return {"trips": out}