from extensions import db


class TransportMode(db.Model):
    __tablename__ = "transport_modes"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)  # e.g., bus, metro, walk, bike, train, rideshare
    co2_per_km = db.Column(db.Float, nullable=True)
    avg_cost_per_km = db.Column(db.Float, nullable=True)
    safety_score_base = db.Column(db.Float, nullable=True)  # 0-1 baseline safety heuristic

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "co2_per_km": self.co2_per_km,
            "avg_cost_per_km": self.avg_cost_per_km,
            "safety_score_base": self.safety_score_base,
        }


