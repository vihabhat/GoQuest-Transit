from flask import Blueprint, jsonify, request
from models.user_model import User
from extensions import db

user_bp = Blueprint("user", __name__)

@user_bp.route("/", methods=["GET"])
def get_users():
    users = User.query.all()
    return jsonify([{"id": u.id, "username": u.username, "email": u.email} for u in users])

@user_bp.route("/", methods=["POST"])
def create_user():
    data = request.json
    new_user = User(username=data["username"], email=data["email"], password=data["password"])
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "User created!"}), 201
@user_bp.route("/signup", methods=["POST"])
def signup():
    return {"message": "Signup works!"}