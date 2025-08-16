from datetime import datetime
from app import db

class Trip(db.Model):
    __tablename__ = "trips"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    # JSON string of destinations (simple for MVP); switch to JSONB on Postgres if needed
    destinations = db.Column(db.Text, nullable=False)
    estimated_cost = db.Column(db.Float, nullable=True)
    start_date = db.Column(db.DateTime, nullable=True)
    end_date = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)