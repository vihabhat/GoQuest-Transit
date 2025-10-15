# api.py
from flask import Blueprint, request, jsonify
import google.generativeai as genai

api_bp = Blueprint('api', __name__)

@api_bp.route('/api/ai_trip', methods=['POST'])
def ai_trip():
    # Your Google AI code here
    ...
