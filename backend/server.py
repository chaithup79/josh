from fastapi import FastAPI, APIRouter, HTTPException, Header, WebSocket, WebSocketDisconnect
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import String, Float, Integer, Text, DateTime, Boolean, select, func, JSON
import os
import json
import asyncio
import logging
import secrets
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional, Set
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

DATABASE_URL = os.environ["DATABASE_URL"]
engine = create_async_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=3600)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

app = FastAPI(title="NammaRoad API")
api_router = APIRouter(prefix="/api")

ZONES = [
    "East Zone", "West Zone", "South Zone", "Mahadevapura Zone",
    "Bommanahalli Zone", "RR Nagar Zone", "Dasarahalli Zone", "Yelahanka Zone"
]

# ===================== MODELS =====================

class Base(DeclarativeBase):
    pass

class UserDB(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    phone: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    role: Mapped[str] = mapped_column(String(20), default="citizen")
    token: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    created_at: Mapped[str] = mapped_column(String(40))

class PotholeDB(Base):
    __tablename__ = "potholes"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    reported_by: Mapped[str] = mapped_column(String(36), index=True)
    reporter_name: Mapped[str] = mapped_column(String(120))
    photo_base64: Mapped[str] = mapped_column(Text)
    after_photo_base64: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    latitude: Mapped[float] = mapped_column(Float, index=True)
    longitude: Mapped[float] = mapped_column(Float, index=True)
    address: Mapped[str] = mapped_column(String(255), default="")
    zone: Mapped[str] = mapped_column(String(60), index=True)
    ward_name: Mapped[str] = mapped_column(String(120), default="")
    road_name: Mapped[str] = mapped_column(String(160), default="")
    landmark: Mapped[str] = mapped_column(String(160), default="")
    severity: Mapped[str] = mapped_column(String(20), default="medium")
    description: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(30), default="reported", index=True)
    upvotes: Mapped[int] = mapped_column(Integer, default=1)
    upvoted_by: Mapped[str] = mapped_column(Text, default="[]")  # JSON-encoded list
    assigned_to: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    created_at: Mapped[str] = mapped_column(String(40), index=True)
    updated_at: Mapped[str] = mapped_column(String(40))
    is_duplicate_of: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)

class StatusUpdateDB(Base):
    __tablename__ = "status_updates"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    pothole_id: Mapped[str] = mapped_column(String(36), index=True)
    updated_by: Mapped[str] = mapped_column(String(36))
    updated_by_name: Mapped[str] = mapped_column(String(120))
    old_status: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    new_status: Mapped[str] = mapped_column(String(30))
    comment: Mapped[str] = mapped_column(Text, default="")
    after_photo_base64: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    timestamp: Mapped[str] = mapped_column(String(40), index=True)

# ===================== SCHEMAS =====================

class LoginRequest(BaseModel):
    name: str
    phone: str
    role: str = "citizen"
    invite_code: Optional[str] = None

class PotholeCreate(BaseModel):
    photo_base64: str
    latitude: float
    longitude: float
    address: Optional[str] = ""
    zone: str
    ward_name: Optional[str] = ""
    road_name: Optional[str] = ""
    landmark: Optional[str] = ""
    severity: str = "medium"
    description: Optional[str] = ""

class StatusUpdateRequest(BaseModel):
    new_status: str
    comment: Optional[str] = ""
    after_photo_base64: Optional[str] = None

# ===================== HELPERS =====================

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def user_to_dict(u: UserDB) -> dict:
    return {
        "id": u.id, "name": u.name, "phone": u.phone, "role": u.role,
        "token": u.token, "created_at": u.created_at,
    }

def pothole_to_dict(p: PotholeDB) -> dict:
    try:
        upvoted_by = json.loads(p.upvoted_by or "[]")
    except Exception:
        upvoted_by = []
    return {
        "id": p.id, "reported_by": p.reported_by, "reporter_name": p.reporter_name,
        "photo_base64": p.photo_base64, "after_photo_base64": p.after_photo_base64,
        "latitude": p.latitude, "longitude": p.longitude, "address": p.address,
        "zone": p.zone, "ward_name": p.ward_name, "road_name": p.road_name,
        "landmark": p.landmark, "severity": p.severity, "description": p.description,
        "status": p.status, "upvotes": p.upvotes, "upvoted_by": upvoted_by,
        "assigned_to": p.assigned_to, "created_at": p.created_at,
        "updated_at": p.updated_at, "is_duplicate_of": p.is_duplicate_of,
    }

def status_to_dict(s: StatusUpdateDB) -> dict:
    return {
        "id": s.id, "pothole_id": s.pothole_id, "updated_by": s.updated_by,
        "updated_by_name": s.updated_by_name, "old_status": s.old_status,
        "new_status": s.new_status, "comment": s.comment,
        "after_photo_base64": s.after_photo_base64, "timestamp": s.timestamp,
    }

async def current_user(authorization: Optional[str]) -> dict:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing auth token")
    token = authorization.replace("Bearer ", "").strip()
    async with SessionLocal() as session:
        res = await session.execute(select(UserDB).where(UserDB.token == token))
        u = res.scalar_one_or_none()
        if not u:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_to_dict(u)

# ===================== AUTH =====================

@api_router.post("/auth/login")
async def login(payload: LoginRequest):
    role = payload.role if payload.role in ("citizen", "engineer", "admin") else "citizen"
    if role in ("admin", "engineer"):
        expected = os.environ.get("BBMP_INVITE_CODE", "")
        if not payload.invite_code or payload.invite_code.strip() != expected:
            raise HTTPException(status_code=403, detail="Invalid BBMP invite code")

    async with SessionLocal() as session:
        res = await session.execute(select(UserDB).where(UserDB.phone == payload.phone))
        existing = res.scalar_one_or_none()
        if existing:
            existing.name = payload.name
            existing.role = role
            await session.commit()
            await session.refresh(existing)
            return user_to_dict(existing)

        user = UserDB(
            id=str(uuid.uuid4()),
            name=payload.name,
            phone=payload.phone,
            role=role,
            token=secrets.token_urlsafe(24),
            created_at=now_iso(),
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return user_to_dict(user)

@api_router.get("/auth/me")
async def me(authorization: Optional[str] = Header(None)):
    return await current_user(authorization)

# ===================== POTHOLES =====================

@api_router.post("/potholes")
async def create_pothole(payload: PotholeCreate, authorization: Optional[str] = Header(None)):
    user = await current_user(authorization)

    async with SessionLocal() as session:
        # Duplicate detection within ~20 meters
        dup_res = await session.execute(
            select(PotholeDB).where(
                PotholeDB.latitude >= payload.latitude - 0.0002,
                PotholeDB.latitude <= payload.latitude + 0.0002,
                PotholeDB.longitude >= payload.longitude - 0.0002,
                PotholeDB.longitude <= payload.longitude + 0.0002,
                PotholeDB.status != "fixed",
            ).limit(1)
        )
        nearby = dup_res.scalar_one_or_none()

        pid = str(uuid.uuid4())
        pothole = PotholeDB(
            id=pid,
            reported_by=user["id"],
            reporter_name=user["name"],
            photo_base64=payload.photo_base64,
            after_photo_base64=None,
            latitude=payload.latitude,
            longitude=payload.longitude,
            address=payload.address or "",
            zone=payload.zone if payload.zone in ZONES else "East Zone",
            ward_name=payload.ward_name or "",
            road_name=payload.road_name or "",
            landmark=payload.landmark or "",
            severity=payload.severity if payload.severity in ("low", "medium", "high", "critical") else "medium",
            description=payload.description or "",
            status="reported",
            upvotes=1,
            upvoted_by=json.dumps([user["id"]]),
            assigned_to=None,
            created_at=now_iso(),
            updated_at=now_iso(),
            is_duplicate_of=nearby.id if nearby else None,
        )
        session.add(pothole)

        status_log = StatusUpdateDB(
            id=str(uuid.uuid4()),
            pothole_id=pid,
            updated_by=user["id"],
            updated_by_name=user["name"],
            old_status=None,
            new_status="reported",
            comment="Pothole reported by citizen",
            after_photo_base64=None,
            timestamp=now_iso(),
        )
        session.add(status_log)
        await session.commit()
        await session.refresh(pothole)
        doc = pothole_to_dict(pothole)

    await ws_manager.broadcast({
        "type": "pothole_created",
        "pothole_id": pid,
        "zone": doc["zone"],
        "status": "reported",
        "severity": doc["severity"],
    })
    return doc

@api_router.get("/potholes")
async def list_potholes(
    status: Optional[str] = None,
    zone: Optional[str] = None,
    mine: Optional[bool] = False,
    authorization: Optional[str] = Header(None),
):
    async with SessionLocal() as session:
        q = select(PotholeDB)
        if status and status != "all":
            q = q.where(PotholeDB.status == status)
        if zone and zone != "all":
            q = q.where(PotholeDB.zone == zone)
        if mine:
            user = await current_user(authorization)
            q = q.where(PotholeDB.reported_by == user["id"])
        q = q.order_by(PotholeDB.created_at.desc()).limit(500)
        res = await session.execute(q)
        rows = res.scalars().all()
        return [pothole_to_dict(p) for p in rows]

@api_router.get("/potholes/{pid}")
async def get_pothole(pid: str):
    async with SessionLocal() as session:
        res = await session.execute(select(PotholeDB).where(PotholeDB.id == pid))
        p = res.scalar_one_or_none()
        if not p:
            raise HTTPException(status_code=404, detail="Not found")
        return pothole_to_dict(p)

@api_router.patch("/potholes/{pid}/status")
async def update_status(pid: str, payload: StatusUpdateRequest, authorization: Optional[str] = Header(None)):
    user = await current_user(authorization)
    if user["role"] not in ("admin", "engineer"):
        raise HTTPException(status_code=403, detail="Only BBMP staff can update status")

    valid = ["reported", "verified", "assigned", "work_started", "fixed"]
    if payload.new_status not in valid:
        raise HTTPException(status_code=400, detail="Invalid status")

    async with SessionLocal() as session:
        res = await session.execute(select(PotholeDB).where(PotholeDB.id == pid))
        p = res.scalar_one_or_none()
        if not p:
            raise HTTPException(status_code=404, detail="Not found")

        old_status = p.status
        p.status = payload.new_status
        p.updated_at = now_iso()
        if payload.after_photo_base64:
            p.after_photo_base64 = payload.after_photo_base64
        if payload.new_status == "assigned":
            p.assigned_to = user["id"]

        log = StatusUpdateDB(
            id=str(uuid.uuid4()),
            pothole_id=pid,
            updated_by=user["id"],
            updated_by_name=user["name"],
            old_status=old_status,
            new_status=payload.new_status,
            comment=payload.comment or "",
            after_photo_base64=payload.after_photo_base64,
            timestamp=now_iso(),
        )
        session.add(log)
        await session.commit()
        await session.refresh(p)
        doc = pothole_to_dict(p)

    await ws_manager.broadcast({
        "type": "status_updated",
        "pothole_id": pid,
        "old_status": old_status,
        "new_status": payload.new_status,
        "updated_by": user["name"],
    })
    return doc

@api_router.get("/potholes/{pid}/status-history")
async def status_history(pid: str):
    async with SessionLocal() as session:
        res = await session.execute(
            select(StatusUpdateDB).where(StatusUpdateDB.pothole_id == pid).order_by(StatusUpdateDB.timestamp.asc())
        )
        return [status_to_dict(s) for s in res.scalars().all()]

@api_router.post("/potholes/{pid}/upvote")
async def upvote(pid: str, authorization: Optional[str] = Header(None)):
    user = await current_user(authorization)
    async with SessionLocal() as session:
        res = await session.execute(select(PotholeDB).where(PotholeDB.id == pid))
        p = res.scalar_one_or_none()
        if not p:
            raise HTTPException(status_code=404, detail="Not found")
        try:
            voters = json.loads(p.upvoted_by or "[]")
        except Exception:
            voters = []
        if user["id"] in voters:
            return {"upvotes": p.upvotes, "already": True}
        voters.append(user["id"])
        p.upvoted_by = json.dumps(voters)
        p.upvotes = (p.upvotes or 0) + 1
        await session.commit()
        await session.refresh(p)
        upvotes = p.upvotes

    await ws_manager.broadcast({"type": "upvoted", "pothole_id": pid, "upvotes": upvotes})
    return {"upvotes": upvotes, "already": False}

# ===================== ANALYTICS =====================

@api_router.get("/analytics")
async def analytics():
    async with SessionLocal() as session:
        total = (await session.execute(select(func.count()).select_from(PotholeDB))).scalar_one()
        fixed = (await session.execute(select(func.count()).select_from(PotholeDB).where(PotholeDB.status == "fixed"))).scalar_one()
        pending = (await session.execute(
            select(func.count()).select_from(PotholeDB).where(PotholeDB.status.in_(["reported", "verified", "assigned", "work_started"]))
        )).scalar_one()

        zone_stats = []
        for zone in ZONES:
            cnt = (await session.execute(select(func.count()).select_from(PotholeDB).where(PotholeDB.zone == zone))).scalar_one()
            fxd = (await session.execute(select(func.count()).select_from(PotholeDB).where(PotholeDB.zone == zone, PotholeDB.status == "fixed"))).scalar_one()
            zone_stats.append({"zone": zone, "total": cnt, "fixed": fxd, "pending": cnt - fxd})

        by_status = {}
        for s in ["reported", "verified", "assigned", "work_started", "fixed"]:
            by_status[s] = (await session.execute(select(func.count()).select_from(PotholeDB).where(PotholeDB.status == s))).scalar_one()

    return {
        "total": total,
        "fixed": fixed,
        "pending": pending,
        "fix_rate": round((fixed / total * 100), 1) if total else 0,
        "by_status": by_status,
        "zone_stats": zone_stats,
    }

# ===================== SEED (manual only) =====================

@api_router.post("/seed")
async def seed():
    """Manual seed for QA. Wipes all data and recreates demo accounts + 8 sample potholes."""
    placeholder = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
    async with SessionLocal() as session:
        await session.execute(StatusUpdateDB.__table__.delete())
        await session.execute(PotholeDB.__table__.delete())
        await session.execute(UserDB.__table__.delete())
        await session.commit()

        admin = UserDB(id=str(uuid.uuid4()), name="BBMP Admin", phone="9000000001", role="admin", token="bbmp-admin-token", created_at=now_iso())
        engineer = UserDB(id=str(uuid.uuid4()), name="Suresh Kumar", phone="9000000002", role="engineer", token="engineer-token", created_at=now_iso())
        citizen = UserDB(id=str(uuid.uuid4()), name="Priya Sharma", phone="9000000003", role="citizen", token="citizen-token", created_at=now_iso())
        session.add_all([admin, engineer, citizen])

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
            p = PotholeDB(
                id=pid,
                reported_by=citizen.id,
                reporter_name=citizen.name,
                photo_base64=placeholder,
                after_photo_base64=placeholder if s["status"] == "fixed" else None,
                latitude=s["lat"],
                longitude=s["lng"],
                address=f"{s['road']}, near {s['landmark']}",
                zone=s["zone"],
                ward_name=s["ward"],
                road_name=s["road"],
                landmark=s["landmark"],
                severity=s["severity"],
                description=f"Large pothole near {s['landmark']}",
                status=s["status"],
                upvotes=3 + (hash(pid) % 12),
                upvoted_by=json.dumps([citizen.id]),
                assigned_to=engineer.id if s["status"] in ("assigned", "work_started", "fixed") else None,
                created_at=now_iso(),
                updated_at=now_iso(),
                is_duplicate_of=None,
            )
            session.add(p)
            session.add(StatusUpdateDB(
                id=str(uuid.uuid4()),
                pothole_id=pid,
                updated_by=citizen.id,
                updated_by_name=citizen.name,
                old_status=None,
                new_status="reported",
                comment="Pothole reported",
                after_photo_base64=None,
                timestamp=now_iso(),
            ))
        await session.commit()

        return {
            "ok": True,
            "users": {
                "admin": user_to_dict(admin),
                "engineer": user_to_dict(engineer),
                "citizen": user_to_dict(citizen),
            },
            "potholes_count": len(samples),
        }

@api_router.get("/")
async def root():
    return {"message": "NammaRoad API", "version": "2.0", "db": "MySQL"}

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

# ===================== STARTUP =====================

@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("MySQL tables ready")

@app.on_event("shutdown")
async def on_shutdown():
    await engine.dispose()

# ===================== WEBSOCKETS =====================

class WSManager:
    def __init__(self):
        self.active: Set[WebSocket] = set()
        self.lock = asyncio.Lock()

    async def connect(self, ws: WebSocket):
        await ws.accept()
        async with self.lock:
            self.active.add(ws)

    async def disconnect(self, ws: WebSocket):
        async with self.lock:
            self.active.discard(ws)

    async def broadcast(self, event: dict):
        msg = json.dumps(event, default=str)
        dead = []
        async with self.lock:
            conns = list(self.active)
        for ws in conns:
            try:
                await ws.send_text(msg)
            except Exception:
                dead.append(ws)
        if dead:
            async with self.lock:
                for ws in dead:
                    self.active.discard(ws)

ws_manager = WSManager()

@app.websocket("/api/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws_manager.connect(ws)
    try:
        await ws.send_text(json.dumps({"type": "hello", "message": "connected"}))
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        await ws_manager.disconnect(ws)
    except Exception:
        await ws_manager.disconnect(ws)
