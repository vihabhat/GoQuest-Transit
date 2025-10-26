from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from extensions import db
from models.user_model import User  # Assuming the model is now in models/user_model.py

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.json
    username = data.get("username")
    password = data.get("password")
    
    # Extracting optional fields from the Signup form data
    email = data.get("email")
    phone = data.get("phone")
    dob = data.get("dob")
    address = data.get("address")

    if not username or not password:
        return jsonify({"msg": "Missing username or password"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"msg": "User already exists"}), 400

    hashed_pw = generate_password_hash(password)
    new_user = User(
        username=username, 
        password=hashed_pw,
        email=email,  # Storing optional fields on creation
        phone=phone,
        dob=dob,
        address=address
    )
    
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"msg": "Signup successful"}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    user = User.query.filter_by(username=username).first()
    if not user or not check_password_hash(user.password, password):
        # Changed the key from 'msg' to 'error' to match the frontend error handling
        return jsonify({"error": "Invalid username or password"}), 401

    # The access_token payload should contain a unique identifier, like the username
    access_token = create_access_token(identity=user.username)
    # Changed the key from 'access_token' to 'token' to match the frontend
    return jsonify({"token": access_token}), 200


@auth_bp.route("/profile", methods=["GET", "PUT"])
@jwt_required()
def profile():
    # Get the identity (username) from the JWT token
    current_username = get_jwt_identity()
    user = User.query.filter_by(username=current_username).first()

    if not user:
        return jsonify({"error": "User not found"}), 404

    if request.method == "GET":
        # Return current user data
        return jsonify({
            "username": user.username,
            "email": user.email,
            "phone": user.phone,
            "dob": user.dob,
            "address": user.address,
            "member_status": "Active Member" # Mock status for display
        }), 200

    elif request.method == "PUT":
        data = request.json
        
        # Update fields only if they are present in the request
        user.username = data.get("username", user.username)
        user.email = data.get("email", user.email)
        user.phone = data.get("phone", user.phone)
        user.dob = data.get("dob", user.dob)
        user.address = data.get("address", user.address)
        
        db.session.commit()

        # Return the updated data
        return jsonify({
            "username": user.username,
            "email": user.email,
            "phone": user.phone,
            "dob": user.dob,
            "address": user.address,
            "member_status": "Active Member"
        }), 200

# The protected route is kept for completeness
@auth_bp.route("/protected", methods=["GET"])
@jwt_required()
def protected():
    return jsonify({"msg": "You accessed a protected route!"}), 200