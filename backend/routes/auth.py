from flask import Blueprint, request
from flask_jwt_extended import create_access_token
from app import db
from models.user_model import User

auth_bp = Blueprint("auth", __name__)

@auth_bp.post("/register")
def register():
    data = request.get_json() or {}
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    if not all([name, email, password]):
        return {"error": "name, email, password are required"}, 400

    if User.query.filter_by(email=email).first():
        return {"error": "email already registered"}, 409

    user = User(name=name, email=email)
    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=user.id)
    return {"user": user.to_dict(), "access_token": token}, 201

@auth_bp.post("/login")
def login():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")

    if not all([email, password]):
        return {"error": "email and password required"}, 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return {"error": "invalid credentials"}, 401

    token = create_access_token(identity=user.id)
    return {"user": user.to_dict(), "access_token": token}