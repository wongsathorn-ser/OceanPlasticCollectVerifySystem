"""Feature 5 - Fleet & boats service.

Temporary mock service for F5 development.

This service will later be replaced/updated to use the real
PostgreSQL database through SQLModel.

Owner: Natthachaimongkol Chayopathum
"""

from copy import deepcopy


# Mock boat data

MOCK_BOATS = [
    {
        "id": 1,
        "code": "HC-14",
        "name": "Harbor Cleaner",
        "capacity_kg": 1800,
        "active": True,
        "records": 96,
    },
    {
        "id": 2,
        "code": "SH-02",
        "name": "Sea Harvest",
        "capacity_kg": 2400,
        "active": True,
        "records": 71,
    },
    {
        "id": 3,
        "code": "RM-07",
        "name": "River Mouth",
        "capacity_kg": 900,
        "active": True,
        "records": 52,
    },
    {
        "id": 4,
        "code": "SL-03",
        "name": "Shoreline Team A",
        "capacity_kg": 400,
        "active": True,
        "records": 29,
    },
]

# Mock fleet data

MOCK_FLEET_SUMMARY = {
    "month": {
        "period": "month",
        "verified_kg": 64800,
        "pending_kg": 11200,
        "records": 248,
        "boats": 4,
        "pending_records": 3,
        "boats_by_verified": [
            {
                "id": 1,
                "code": "HC-14",
                "name": "Harbor Cleaner",
                "verified_kg": 31200,
            },
            {
                "id": 2,
                "code": "SH-02",
                "name": "Sea Harvest",
                "verified_kg": 18400,
            },
            {
                "id": 3,
                "code": "RM-07",
                "name": "River Mouth",
                "verified_kg": 10600,
            },
            {
                "id": 4,
                "code": "SL-03",
                "name": "Shoreline Team A",
                "verified_kg": 4600,
            },
        ],
        "material_breakdown": [
            {"material": "PET bottles", "verified_kg": 24100},
            {"material": "HDPE rigid", "verified_kg": 17300},
            {"material": "Fishing net / rope", "verified_kg": 12600},
            {"material": "LDPE film", "verified_kg": 6900},
            {"material": "Mixed", "verified_kg": 3900},
        ],
    },
    "year": {
        "period": "year",
        "verified_kg": 312400,
        "pending_kg": 24800,
        "records": 1248,
        "boats": 4,
        "pending_records": 8,
        "boats_by_verified": [
            {
                "id": 1,
                "code": "HC-14",
                "name": "Harbor Cleaner",
                "verified_kg": 142800,
            },
            {
                "id": 2,
                "code": "SH-02",
                "name": "Sea Harvest",
                "verified_kg": 91800,
            },
            {
                "id": 3,
                "code": "RM-07",
                "name": "River Mouth",
                "verified_kg": 52400,
            },
            {
                "id": 4,
                "code": "SL-03",
                "name": "Shoreline Team A",
                "verified_kg": 25400,
            },
        ],
        "material_breakdown": [
            {"material": "PET bottles", "verified_kg": 118400},
            {"material": "HDPE rigid", "verified_kg": 82400},
            {"material": "Fishing net / rope", "verified_kg": 54600},
            {"material": "LDPE film", "verified_kg": 34200},
            {"material": "Mixed", "verified_kg": 22800},
        ],
    },
}

MOCK_BOAT_PERFORMANCE = {
    1: {
        "month": {
            "id": 1,
            "code": "HC-14",
            "name": "Harbor Cleaner",
            "capacity_kg": 1800,
            "active": True,
            "verified_kg": 31200,
            "records": 96,
            "pending_kg": 1100,
            "crew": 3,

            "material_breakdown": [
                {"material": "PET bottles", "verified_kg": 11400},
                {"material": "HDPE rigid", "verified_kg": 8900},
                {"material": "Fishing net / rope", "verified_kg": 6200},
                {"material": "LDPE film", "verified_kg": 3100},
                {"material": "Mixed", "verified_kg": 1600},
            ],

            "recent_records": [
                {
                    "id": 412,
                    "record_number": "REC-0412",
                    "weight_kg": 412,
                    "material": "HDPE rigid",
                    "status": "PENDING",
                    "recorded_at": "2026-10-26T08:30:00",
                },
                {
                    "id": 398,
                    "record_number": "REC-0398",
                    "weight_kg": 540,
                    "material": "Mixed",
                    "status": "VERIFIED",
                    "recorded_at": "2026-11-02T15:20:00",
                },
                {
                    "id": 381,
                    "record_number": "REC-0381",
                    "weight_kg": 335,
                    "material": "LDPE film",
                    "status": "VERIFIED",
                    "recorded_at": "2026-10-31T14:48:00",
                },
            ],
        },

        "year": {
            "id": 1,
            "code": "HC-14",
            "name": "Harbor Cleaner",
            "capacity_kg": 1800,
            "active": True,
            "verified_kg": 142800,
            "records": 420,
            "pending_kg": 4800,
            "crew": 6,

            "material_breakdown": [
                {"material": "PET bottles", "verified_kg": 51200},
                {"material": "HDPE rigid", "verified_kg": 38600},
                {"material": "Fishing net / rope", "verified_kg": 28100},
                {"material": "LDPE film", "verified_kg": 15300},
                {"material": "Mixed", "verified_kg": 9600},
            ],

            "recent_records": [
                {
                    "id": 412,
                    "record_number": "REC-0412",
                    "weight_kg": 412,
                    "material": "HDPE rigid",
                    "status": "PENDING",
                    "recorded_at": "2026-10-26T08:30:00",
                },
                {
                    "id": 398,
                    "record_number": "REC-0398",
                    "weight_kg": 540,
                    "material": "Mixed",
                    "status": "VERIFIED",
                    "recorded_at": "2026-11-02T15:20:00",
                },
                {
                    "id": 381,
                    "record_number": "REC-0381",
                    "weight_kg": 335,
                    "material": "LDPE film",
                    "status": "VERIFIED",
                    "recorded_at": "2026-10-31T14:48:00",
                },
            ],
        },
    },
}

def get_boats():
    """Return all boats."""
    return deepcopy(MOCK_BOATS)


def create_boat(boat_data):
    """Create a new boat in the mock data."""
    next_id = max((boat["id"] for boat in MOCK_BOATS), default=0) + 1

    boat = {
        "id": next_id,
        "code": boat_data["code"],
        "name": boat_data["name"],
        "capacity_kg": boat_data["capacity_kg"],
        "active": boat_data.get("active", True),
        "records": 0,
    }

    MOCK_BOATS.append(boat)

    return deepcopy(boat)


def update_boat(boat_id, boat_data):
    """Update an existing boat in the mock data."""
    boat = next(
        (item for item in MOCK_BOATS if item["id"] == boat_id),
        None,
    )

    if boat is None:
        return None

    for field in ("code", "name", "capacity_kg", "active"):
        if field in boat_data and boat_data[field] is not None:
            boat[field] = boat_data[field]

    return deepcopy(boat)


def get_fleet_summary(period="month"):
    """Return mock fleet summary for month or year."""
    summary = MOCK_FLEET_SUMMARY.get(period)

    if summary is None:
        return None

    return deepcopy(summary)


def get_boat_performance(boat_id, period="month"):
    """Return mock performance data for one boat and period."""
    boat_data = MOCK_BOAT_PERFORMANCE.get(boat_id)

    if boat_data is None:
        return None

    performance = boat_data.get(period)

    if performance is None:
        return None

    return deepcopy(performance)
