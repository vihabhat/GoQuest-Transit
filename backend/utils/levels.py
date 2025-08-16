LEVELS = [
    {"level": 1, "radius_km": 5,   "xp_required": 0},
    {"level": 2, "radius_km": 20,  "xp_required": 100},
    {"level": 3, "radius_km": 100, "xp_required": 300},
    {"level": 4, "radius_km": 500, "xp_required": 700},
    {"level": 5, "radius_km": 2000, "xp_required": 1500},
]

BADGES = {
    "local_explorer": {"title": "Local Explorer", "xp_min": 50},
    "weekend_wanderer": {"title": "Weekend Wanderer", "xp_min": 300},
    "globetrotter": {"title": "Globetrotter", "xp_min": 1500},
}

def level_for_xp(xp: int) -> int:
    current = 1
    for row in LEVELS:
        if xp >= row["xp_required"]:
            current = row["level"]
        else:
            break
    return current

def radius_for_level(level: int) -> int:
    for row in LEVELS:
        if row["level"] == level:
            return row["radius_km"]
    return LEVELS[0]["radius_km"]

def badges_for_xp(xp: int):
    unlocked = []
    for key, meta in BADGES.items():
        if xp >= meta["xp_min"]:
            unlocked.append({"key": key, **meta})
    return unlocked