from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from models.user_model import User
from models.feedback_model import Feedback
from utils.levels import level_for_xp

feedback_bp = Blueprint("feedback", __name__)

# Simple anti-spam idea for MVP: fixed XP per valid feedback with min text length
XP_PER_FEEDBACK = 20

@feedback_bp.post("")
@jwt_required()
def submit_feedback():
    uid = get_jwt_identity()
    data = request.get_json() or {}

    rating = int(data.get("rating", 0))
    comments = (data.get("comments") or "").strip()
    trip_id = data.get("trip_id")

    if rating < 1 or rating > 5:
        return {"error": "rating must be 1-5"}, 400

    xp_reward = XP_PER_FEEDBACK if len(comments) >= 10 else 5

    fb = Feedback(user_id=uid, trip_id=trip_id, rating=rating, comments=comments, xp_reward=xp_reward)
    db.session.add(fb)

    # Update user XP / level
    user = User.query.get(uid)
    user.xp += xp_reward
    user.level = level_for_xp(user.xp)

    db.session.commit()

    return {"message": "feedback submitted", "xp_awarded": xp_reward, "new_xp": user.xp, "level": user.level}