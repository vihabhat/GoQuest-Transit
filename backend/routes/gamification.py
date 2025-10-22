from flask import Blueprint

gamification_bp = Blueprint("gamification_bp", __name__)

@gamification_bp.route("/example")
def example():
    return "Hello from gamification!"
