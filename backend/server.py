from fastapi import FastAPI, APIRouter, HTTPException, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import secrets
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="NammaRoad API")
api_router = APIRouter(prefix="/api")

# ===================== MODELS =====================

ZONES = [
    "East Zone", "West Zone", "South Zone", "Mahadevapura Zone",
    "Bommanahalli Zone", "RR Nagar Zone", "Dasarahalli Zone", "Yelahanka Zone"
]

class LoginRequest(BaseModel):
    name: str
    phone: str
    role: str = "citizen"  # citizen | engineer | admin

class User(BaseModel):
    id: str
    name: str
    phone: str
    role: str
    token: str
    created_at: str

class PotholeCreate(BaseModel):
    photo_base64: str  # data URI or raw base64
    latitude: float
    longitude: float
    address: Optional[str] = ""
    zone: str
    ward_name: Optional[str] = ""
    road_name: Optional[str] = ""
    landmark: Optional[str] = ""
    severity: str = "medium"   # low | medium | high | critical
    description: Optional[str] = ""

class StatusUpdateRequest(BaseModel):
    new_status: str  # reported | verified | assigned | work_started | fixed
    comment: Optional[str] = ""
    after_photo_base64: Optional[str] = None

# ===================== HELPERS =====================

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

async def current_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing auth token")
    token = authorization.replace("Bearer ", "").strip()
    user = await db.users.find_one({"token": token}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user

def clean(doc: dict) -> dict:
    if doc and "_id" in doc:
        doc.pop("_id", None)
    return doc

# ===================== AUTH =====================

@api_router.post("/auth/login")
async def login(payload: LoginRequest):
    role = payload.role if payload.role in ("citizen", "engineer", "admin") else "citizen"
    existing = await db.users.find_one({"phone": payload.phone}, {"_id": 0})
    if existing:
        # Update name/role if changed
        await db.users.update_one(
            {"phone": payload.phone},
            {"$set": {"name": payload.name, "role": role}}
        )
        existing["name"] = payload.name
        existing["role"] = role
        return existing

    user = {
        "id": str(uuid.uuid4()),
        "name": payload.name,
        "phone": payload.phone,
        "role": role,
        "token": secrets.token_urlsafe(24),
        "created_at": now_iso(),
    }
    await db.users.insert_one(user.copy())
    return clean(user)

@api_router.get("/auth/me")
async def me(authorization: Optional[str] = Header(None)):
    return await current_user(authorization)

# ===================== POTHOLES =====================

@api_router.post("/potholes")
async def create_pothole(payload: PotholeCreate, authorization: Optional[str] = Header(None)):
    user = await current_user(authorization)

    # Duplicate detection within ~20 meters
    nearby = await db.potholes.find({
        "latitude": {"$gte": payload.latitude - 0.0002, "$lte": payload.latitude + 0.0002},
        "longitude": {"$gte": payload.longitude - 0.0002, "$lte": payload.longitude + 0.0002},
        "status": {"$ne": "fixed"},
    }, {"_id": 0}).to_list(5)

    pid = str(uuid.uuid4())
    doc = {
        "id": pid,
        "reported_by": user["id"],
        "reporter_name": user["name"],
        "photo_base64": payload.photo_base64,
        "after_photo_base64": None,
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "address": payload.address or "",
        "zone": payload.zone if payload.zone in ZONES else "East Zone",
        "ward_name": payload.ward_name or "",
        "road_name": payload.road_name or "",
        "landmark": payload.landmark or "",
        "severity": payload.severity if payload.severity in ("low", "medium", "high", "critical") else "medium",
        "description": payload.description or "",
        "status": "reported",
        "upvotes": 1,
        "upvoted_by": [user["id"]],
        "assigned_to": None,
        "created_at": now_iso(),
        "updated_at": now_iso(),
        "is_duplicate_of": nearby[0]["id"] if nearby else None,
    }
    await db.potholes.insert_one(doc.copy())

    # First status log
    await db.status_updates.insert_one({
        "id": str(uuid.uuid4()),
        "pothole_id": pid,
        "updated_by": user["id"],
        "updated_by_name": user["name"],
        "old_status": None,
        "new_status": "reported",
        "comment": "Pothole reported by citizen",
        "after_photo_base64": None,
        "timestamp": now_iso(),
    })

    return clean(doc)

@api_router.get("/potholes")
async def list_potholes(
    status: Optional[str] = None,
    zone: Optional[str] = None,
    mine: Optional[bool] = False,
    authorization: Optional[str] = Header(None),
):
    q: dict = {}
    if status and status != "all":
        q["status"] = status
    if zone and zone != "all":
        q["zone"] = zone
    if mine:
        user = await current_user(authorization)
        q["reported_by"] = user["id"]

    docs = await db.potholes.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)
    # Strip large photos in list view to keep responses small
    for d in docs:
        if d.get("photo_base64") and len(d["photo_base64"]) > 400:
            d["photo_thumbnail"] = d["photo_base64"]
        # keep photo as is - frontend handles
    return docs

@api_router.get("/potholes/{pid}")
async def get_pothole(pid: str):
    doc = await db.potholes.find_one({"id": pid}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    return doc

@api_router.patch("/potholes/{pid}/status")
async def update_status(pid: str, payload: StatusUpdateRequest, authorization: Optional[str] = Header(None)):
    user = await current_user(authorization)
    if user["role"] not in ("admin", "engineer"):
        raise HTTPException(status_code=403, detail="Only BBMP staff can update status")

    valid_statuses = ["reported", "verified", "assigned", "work_started", "fixed"]
    if payload.new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")

    doc = await db.potholes.find_one({"id": pid}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")

    old_status = doc["status"]
    update_fields = {"status": payload.new_status, "updated_at": now_iso()}
    if payload.after_photo_base64:
        update_fields["after_photo_base64"] = payload.after_photo_base64
    if payload.new_status == "assigned":
        update_fields["assigned_to"] = user["id"]

    await db.potholes.update_one({"id": pid}, {"$set": update_fields})

    await db.status_updates.insert_one({
        "id": str(uuid.uuid4()),
        "pothole_id": pid,
        "updated_by": user["id"],
        "updated_by_name": user["name"],
        "old_status": old_status,
        "new_status": payload.new_status,
        "comment": payload.comment or "",
        "after_photo_base64": payload.after_photo_base64,
        "timestamp": now_iso(),
    })

    updated = await db.potholes.find_one({"id": pid}, {"_id": 0})
    return clean(updated)

@api_router.get("/potholes/{pid}/status-history")
async def status_history(pid: str):
    docs = await db.status_updates.find({"pothole_id": pid}, {"_id": 0}).sort("timestamp", 1).to_list(200)
    return docs

@api_router.post("/potholes/{pid}/upvote")
async def upvote(pid: str, authorization: Optional[str] = Header(None)):
    user = await current_user(authorization)
    doc = await db.potholes.find_one({"id": pid}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    if user["id"] in doc.get("upvoted_by", []):
        return {"upvotes": doc.get("upvotes", 1), "already": True}
    await db.potholes.update_one(
        {"id": pid},
        {"$inc": {"upvotes": 1}, "$push": {"upvoted_by": user["id"]}}
    )
    updated = await db.potholes.find_one({"id": pid}, {"_id": 0})
    return {"upvotes": updated.get("upvotes", 1), "already": False}

# ===================== ANALYTICS =====================

@api_router.get("/analytics")
async def analytics():
    total = await db.potholes.count_documents({})
    fixed = await db.potholes.count_documents({"status": "fixed"})
    pending = await db.potholes.count_documents({"status": {"$in": ["reported", "verified", "assigned", "work_started"]}})

    zone_stats = []
    for zone in ZONES:
        cnt = await db.potholes.count_documents({"zone": zone})
        fxd = await db.potholes.count_documents({"zone": zone, "status": "fixed"})
        zone_stats.append({"zone": zone, "total": cnt, "fixed": fxd, "pending": cnt - fxd})

    by_status = {}
    for s in ["reported", "verified", "assigned", "work_started", "fixed"]:
        by_status[s] = await db.potholes.count_documents({"status": s})

    return {
        "total": total,
        "fixed": fixed,
        "pending": pending,
        "fix_rate": round((fixed / total * 100), 1) if total else 0,
        "by_status": by_status,
        "zone_stats": zone_stats,
    }

# ===================== SEED =====================

@api_router.post("/seed")
async def seed():
    # Reset
    await db.users.delete_many({})
    await db.potholes.delete_many({})
    await db.status_updates.delete_many({})

    # Tiny 1x1 transparent png base64 placeholder
    placeholder = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="

    admin = {
        "id": str(uuid.uuid4()),
        "name": "BBMP Admin",
        "phone": "9000000001",
        "role": "admin",
        "token": "bbmp-admin-token",
        "created_at": now_iso(),
    }
    engineer = {
        "id": str(uuid.uuid4()),
        "name": "Suresh Kumar",
        "phone": "9000000002",
        "role": "engineer",
        "token": "engineer-token",
        "created_at": now_iso(),
    }
    citizen = {
        "id": str(uuid.uuid4()),
        "name": "Priya Sharma",
        "phone": "9000000003",
        "role": "citizen",
        "token": "citizen-token",
        "created_at": now_iso(),
    }
    await db.users.insert_many([admin.copy(), engineer.copy(), citizen.copy()])

    samples = [
        {"lat": 12.9716, "lng": 77.5946, "zone": "South Zone", "road": "MG Road", "landmark": "Trinity Metro", "ward": "Shantala Nagar", "severity": "high", "status": "reported"},
        {"lat": 12.9352, "lng": 77.6245, "zone": "South Zone", "road": "Koramangala 80 Ft Rd", "landmark": "Forum Mall", "ward": "Koramangala", "severity": "critical", "status": "verified"},
        {"lat": 12.9784, "lng": 77.6408, "zone": "Mahadevapura Zone", "road": "Old Airport Road", "landmark": "Domlur Flyover", "ward": "Domlur", "severity": "medium", "status": "assigned"},
        {"lat": 13.0359, "lng": 77.5970, "zone": "Yelahanka Zone", "road": "Bellary Road", "landmark": "Hebbal Flyover", "ward": "Hebbal", "severity": "high", "status": "work_started"},
        {"lat": 12.9141, "lng": 77.6101, "zone": "Bommanahalli Zone", "road": "Bannerghatta Road", "landmark": "IIM Bangalore", "ward": "BTM Layout", "severity": "low", "status": "fixed"},
        {"lat": 12.9911, "lng": 77.5538, "zone": "West Zone", "road": "Magadi Road", "landmark": "Vijayanagar Metro", "ward": "Vijayanagar", "severity": "medium", "status": "reported"},
        {"lat": 12.9698, "lng": 77.7500, "zone": "Mahadevapura Zone", "road": "Whitefield Main Rd", "landmark": "Forum Shantiniketan", "ward": "Whitefield", "severity": "critical", "status": "reported"},
        {"lat": 13.0096, "lng": 77.6606, "zone": "East Zone", "road": "100 Feet Road", "landmark": "Indiranagar Metro", "ward": "Indiranagar", "severity": "high", "status": "verified"},
    ]
    for s in samples:
        pid = str(uuid.uuid4())
        doc = {
            "id": pid,
            "reported_by": citizen["id"],
            "reporter_name": citizen["name"],
            "photo_base64": placeholder,
            "after_photo_base64": placeholder if s["status"] == "fixed" else None,
            "latitude": s["lat"],
            "longitude": s["lng"],
            "address": f"{s['road']}, near {s['landmark']}",
            "zone": s["zone"],
            "ward_name": s["ward"],
            "road_name": s["road"],
            "landmark": s["landmark"],
            "severity": s["severity"],
            "description": f"Large pothole near {s['landmark']}",
            "status": s["status"],
            "upvotes": 3 + (hash(pid) % 12),
            "upvoted_by": [citizen["id"]],
            "assigned_to": engineer["id"] if s["status"] in ("assigned", "work_started", "fixed") else None,
            "created_at": now_iso(),
            "updated_at": now_iso(),
            "is_duplicate_of": None,
        }
        await db.potholes.insert_one(doc.copy())
        await db.status_updates.insert_one({
            "id": str(uuid.uuid4()),
            "pothole_id": pid,
            "updated_by": citizen["id"],
            "updated_by_name": citizen["name"],
            "old_status": None,
            "new_status": "reported",
            "comment": "Pothole reported",
            "after_photo_base64": None,
            "timestamp": now_iso(),
        })

    return {
        "ok": True,
        "users": {"admin": clean(admin), "engineer": clean(engineer), "citizen": clean(citizen)},
        "potholes_count": len(samples),
    }

@api_router.get("/")
async def root():
    return {"message": "NammaRoad API", "version": "1.0"}

# ===================== APP SETUP =====================

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
