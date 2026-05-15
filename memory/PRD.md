# NammaRoad PRD

## Vision
Mobile-first civic-tech app for Bengaluru citizens to report potholes to BBMP — one-hand snap → GPS pin → submit. BBMP staff triage, assign, and close out repairs with after-photos. Real-time map + analytics keep both sides accountable.

## Stack
- **Frontend**: Expo (React Native) + expo-router, expo-image-picker, expo-location, phosphor-react-native, expo-linear-gradient, AsyncStorage
- **Backend**: FastAPI + SQLAlchemy 2.0 async
- **Database**: **MySQL / MariaDB** (`mysql+aiomysql://nammaroad:nammaroad@127.0.0.1:3306/nammaroad`)
  - Tables auto-created on startup via `Base.metadata.create_all`
  - Data dir: `/app/data/mysql`, managed by supervisor (`/etc/supervisor/conf.d/mysql.conf`)
- **Photos**: stored as base64 in MySQL TEXT columns (MVP)
- **Maps**: custom Bengaluru "map canvas" with status-color pins (no native maps lib — works in preview)
- **Live updates**: WebSocket `/api/ws` broadcasts `pothole_created`, `status_updated`, `upvoted`

## Security
- **BBMP staff invite code** required at login for `admin` / `engineer`. Stored in backend `.env` as `BBMP_INVITE_CODE` (default `BBMP-2026`). Citizens unaffected.

## Schema (MySQL)
| Table | Purpose |
|---|---|
| `users` | id (PK), name, phone (unique), role, token (unique), created_at |
| `potholes` | id (PK), reported_by, photo_base64 (TEXT), after_photo_base64 (TEXT), lat/lng (indexed), zone (indexed), road_name, landmark, severity, status (indexed), upvotes, upvoted_by (JSON-encoded text), assigned_to, is_duplicate_of, timestamps |
| `status_updates` | id (PK), pothole_id (indexed), updated_by, new_status, old_status, comment, after_photo_base64, timestamp |

## Roles
- `citizen` — report, upvote, track own reports
- `engineer` — same as admin (field staff)
- `admin` — verify → assign → work_started → fixed, upload after-photo

## Screens
| Route | Purpose |
|---|---|
| `/` (splash) | Auth gate (no auto-seed — DB starts empty) |
| `/login` | Phone + name + role chips; invite code shown for staff |
| `/(tabs)/home` | Live map + status/zone filters + Nearby list + FAB + LIVE indicator |
| `/(tabs)/report` | Camera/Gallery + GPS detect + zone + severity + road/landmark/desc |
| `/(tabs)/my-reports` | Citizen: own reports. BBMP: all reports queue |
| `/(tabs)/profile` | Identity card + 5-status breakdown + zone analytics + admin actions |
| `/report/[id]` | Hero photo + status timeline + upvote + admin update CTA |
| `/admin/update/[id]` | Status options (verified/assigned/work_started/fixed) + comment + after-photo |

## Status Pipeline & Colors
1. **Reported** (red `#DC2626`) — citizen filed
2. **Verified** (orange `#EA580C`) — BBMP confirmed
3. **Assigned** (yellow `#EAB308`) — contractor/engineer
4. **In Progress** (blue `#2563EB`) — `work_started`
5. **Fixed** (green `#16A34A`) — closed with after-photo

## Key APIs (all `/api`)
- `POST /auth/login` — name+phone+role; `invite_code` required for staff
- `GET /auth/me`
- `POST /potholes` (auth) — duplicate detection within ~20m
- `GET /potholes?status=&zone=&mine=`
- `GET /potholes/{id}`
- `PATCH /potholes/{id}/status` (staff only)
- `POST /potholes/{id}/upvote` (auth, idempotent per user)
- `GET /potholes/{id}/status-history`
- `GET /analytics`
- `POST /seed` — **manual reset** (creates demo users + 8 sample potholes; wipes existing data)
- `WS /api/ws` — live event stream

## Business angle
**Civic accountability is the product**. Public-facing zone fix-rate analytics put gentle pressure on each ward office. Future: SLA escalation (7-day rule), citizen reward points for verified reports, BBMP API webhook to municipal CMS, MySQL replication to a read-replica for analytics dashboards.
