from datetime import datetime
from extensions import db


class LocalRouteFeedback(db.Model):
    __tablename__ = "local_route_feedback"

    id = db.Column(db.Integer, primary_key=True)
    origin = db.Column(db.String(120), nullable=False)  # simple city/area string for MVP
    destination = db.Column(db.String(120), nullable=False)
    mode_id = db.Column(db.Integer, db.ForeignKey("transport_modes.id"), nullable=False)
    rating = db.Column(db.Integer, nullable=False)  # 1-5
    votes = db.Column(db.Integer, default=0)
    comments = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


