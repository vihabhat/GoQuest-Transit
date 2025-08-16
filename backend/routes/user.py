from flask import Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user_model import User
from utils.levels import radius_for_level, badges_for_xp

user_bp = Blueprint("user", __name__)

@user_bp.get("/me")
@jwt_required()
def me():
    uid = get_jwt_identity()
    user = User.query.get_or_404(uid)
    data = user.to_dict()
    data["radius_km"] = radius_for_level(user.level)
    data["badges"] = badges_for_xp(user.xp)
    return data