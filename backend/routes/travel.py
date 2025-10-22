from flask import Blueprint, request, jsonify
from sqlalchemy import func
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models.transport_mode import TransportMode
from models.local_route_feedback import LocalRouteFeedback

travel_bp = Blueprint("travel", __name__)


def _normalize(value, min_val, max_val):
    if value is None:
        return 0.5
    if max_val == min_val:
        return 0.5
    clamped = max(min(value, max_val), min_val)
    return (clamped - min_val) / (max_val - min_val)


@travel_bp.get("/options")
def travel_options():
    origin = (request.args.get("origin") or "").strip()
    destination = (request.args.get("destination") or "").strip()
    if not origin or not destination:
        return jsonify({"error": "origin and destination are required"}), 400

    # Aggregate feedback per mode for this origin/destination
    agg_rows = (
        db.session.query(
            LocalRouteFeedback.mode_id.label("mode_id"),
            func.avg(LocalRouteFeedback.rating).label("avg_rating"),
            func.sum(LocalRouteFeedback.votes).label("total_votes"),
            func.count(LocalRouteFeedback.id).label("num_entries"),
        )
        .filter(LocalRouteFeedback.origin == origin, LocalRouteFeedback.destination == destination)
        .group_by(LocalRouteFeedback.mode_id)
        .all()
    )

    modes = {m.id: m for m in TransportMode.query.all()}

    # Heuristic costs/times (MVP): derive from avg_cost_per_km and a fixed distance estimate
    # In a real app, integrate with a routing API (e.g., Google Directions) for distance/time.
    distance_km = float(request.args.get("distance_km", 8.0))

    results = []
    for mode_id, avg_rating, total_votes, num_entries in agg_rows:
        mode = modes.get(mode_id)
        if not mode:
            continue
        est_cost = (mode.avg_cost_per_km or 0.8) * distance_km
        # rough duration minutes by mode
        if (mode.name or "").lower() in ["walk", "walking"]:
            est_minutes = distance_km / 4.5 * 60.0
        elif (mode.name or "").lower() in ["bike", "bicycle"]:
            est_minutes = distance_km / 15.0 * 60.0
        elif (mode.name or "").lower() in ["metro", "train"]:
            est_minutes = distance_km / 30.0 * 60.0
        elif (mode.name or "").lower() in ["bus"]:
            est_minutes = distance_km / 20.0 * 60.0
        else:
            est_minutes = distance_km / 25.0 * 60.0

        co2 = (mode.co2_per_km or 0.05) * distance_km
        safety = mode.safety_score_base or 0.6

        results.append(
            {
                "mode": mode.to_dict(),
                "avg_rating": float(avg_rating or 0.0),
                "total_votes": int(total_votes or 0),
                "num_entries": int(num_entries or 0),
                "estimated_cost_usd": round(est_cost, 2),
                "estimated_duration_minutes": round(est_minutes, 1),
                "estimated_co2_kg": round(co2, 2),
                "safety_score": round(safety, 2),
            }
        )

    if not results:
        # If no local feedback, return a baseline with all modes
        baseline = []
        for mode in modes.values():
            est_cost = (mode.avg_cost_per_km or 0.8) * distance_km
            if (mode.name or "").lower() in ["walk", "walking"]:
                est_minutes = distance_km / 4.5 * 60.0
            elif (mode.name or "").lower() in ["bike", "bicycle"]:
                est_minutes = distance_km / 15.0 * 60.0
            elif (mode.name or "").lower() in ["metro", "train"]:
                est_minutes = distance_km / 30.0 * 60.0
            elif (mode.name or "").lower() in ["bus"]:
                est_minutes = distance_km / 20.0 * 60.0
            else:
                est_minutes = distance_km / 25.0 * 60.0
            co2 = (mode.co2_per_km or 0.05) * distance_km
            safety = mode.safety_score_base or 0.6
            baseline.append(
                {
                    "mode": mode.to_dict(),
                    "avg_rating": 0.0,
                    "total_votes": 0,
                    "num_entries": 0,
                    "estimated_cost_usd": round(est_cost, 2),
                    "estimated_duration_minutes": round(est_minutes, 1),
                    "estimated_co2_kg": round(co2, 2),
                    "safety_score": round(safety, 2),
                }
            )
        results = baseline

    # Rank results via weighted scoring
    # Normalize by ranges computed from results
    cost_vals = [r["estimated_cost_usd"] for r in results]
    time_vals = [r["estimated_duration_minutes"] for r in results]
    co2_vals = [r["estimated_co2_kg"] for r in results]
    feedback_vals = [r["avg_rating"] for r in results]
    safety_vals = [r["safety_score"] for r in results]

    min_cost, max_cost = min(cost_vals), max(cost_vals)
    min_time, max_time = min(time_vals), max(time_vals)
    min_co2, max_co2 = min(co2_vals), max(co2_vals)
    min_fb, max_fb = min(feedback_vals), max(feedback_vals)
    min_safe, max_safe = min(safety_vals), max(safety_vals)

    w_cost, w_time, w_fb, w_safe, w_green = 0.25, 0.20, 0.30, 0.15, 0.10

    for r in results:
        cost_norm = _normalize(r["estimated_cost_usd"], min_cost, max_cost)
        time_norm = _normalize(r["estimated_duration_minutes"], min_time, max_time)
        co2_norm = _normalize(r["estimated_co2_kg"], min_co2, max_co2)
        fb_norm = _normalize(r["avg_rating"], min_fb, max_fb)
        safe_norm = _normalize(r["safety_score"], min_safe, max_safe)
        r["score"] = round(
            w_cost * (1 - cost_norm)
            + w_time * (1 - time_norm)
            + w_fb * fb_norm
            + w_safe * safe_norm
            + w_green * (1 - co2_norm),
            4,
        )

    results.sort(key=lambda x: x["score"], reverse=True)
    return jsonify({"origin": origin, "destination": destination, "distance_km": distance_km, "options": results}), 200


@travel_bp.post("/feedback")
@jwt_required()
def submit_travel_feedback():
    uid = get_jwt_identity()  # currently unused; could tie to user history/anti-spam in future
    data = request.get_json() or {}
    origin = (data.get("origin") or "").strip()
    destination = (data.get("destination") or "").strip()
    mode_id = data.get("mode_id")
    rating = data.get("rating")
    comments = (data.get("comments") or "").strip()

    if not origin or not destination:
        return {"error": "origin and destination are required"}, 400
    try:
        rating = int(rating)
    except Exception:
        return {"error": "rating must be an integer 1-5"}, 400
    if rating < 1 or rating > 5:
        return {"error": "rating must be 1-5"}, 400
    if not isinstance(mode_id, int):
        return {"error": "mode_id must be an integer"}, 400

    mode = TransportMode.query.get(mode_id)
    if not mode:
        return {"error": "transport mode not found"}, 404

    entry = LocalRouteFeedback(
        origin=origin,
        destination=destination,
        mode_id=mode_id,
        rating=rating,
        comments=comments,
        votes=1,
    )
    db.session.add(entry)
    db.session.commit()

    return {"message": "feedback recorded", "id": entry.id}, 201

