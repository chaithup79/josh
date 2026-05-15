# NammaRoad PRD

## Vision
Mobile-first civic-tech app for Bengaluru citizens to report potholes to BBMP — one-hand snap → GPS pin → submit. BBMP staff triage, assign, and close out repairs with after-photos. Real-time map + analytics keep both sides accountable.

## Stack
- **Frontend**: Expo (React Native) + expo-router, expo-image-picker, expo-location, phosphor-react-native, expo-linear-gradient, AsyncStorage
- **Backend**: FastAPI + Motor (MongoDB)
- **Photos**: stored as base64 in MongoDB (MVP)
- **Maps**: custom Bengaluru "map canvas" with status-color pins positioned by lat/lng within Bengaluru bounding box (no native map dependency — works in preview)

## Roles
- `citizen` — report, upvote, track own reports
- `engineer` — same as admin (field staff)
- `admin` — verify → assign → work_started → fixed, upload after-photo

## Screens
| Route | Purpose |
|---|---|
| `/` (splash) | Auth gate + idempotent seed |
| `/login` | Phone + name + role chips, demo shortcuts |
| `/(tabs)/home` | Live map + status/zone filters + Nearby list + FAB |
| `/(tabs)/report` | Camera/Gallery + GPS detect + zone + severity + road/landmark/desc |
| `/(tabs)/my-reports` | Citizen: own reports. BBMP: all reports queue |
| `/(tabs)/profile` | Identity card + 5-status breakdown + zone analytics + admin actions |
| `/report/[id]` | Hero photo + status timeline + upvote + admin update CTA |
| `/admin/update/[id]` | Status options (verified→fixed) + comment + after-photo |

## Status Pipeline & Colors
1. **Reported** (red `#DC2626`) — citizen filed
2. **Verified** (orange `#EA580C`) — BBMP confirmed
3. **Assigned** (yellow `#EAB308`) — contractor/engineer
4. **In Progress** (blue `#2563EB`) — `work_started`
5. **Fixed** (green `#16A34A`) — closed with after-photo

## Key APIs (all `/api`)
- `POST /auth/login` → user (name, phone, role)
- `GET /auth/me`
- `POST /potholes` (auth) — duplicate detection within ~20m
- `GET /potholes?status=&zone=&mine=`
- `GET /potholes/{id}`
- `PATCH /potholes/{id}/status` (staff only) — logs status_updates
- `POST /potholes/{id}/upvote` (auth, idempotent per user)
- `GET /potholes/{id}/status-history`
- `GET /analytics` — total/fixed/pending, by_status, zone_stats
- `POST /seed` — demo data + 3 demo users

## Smart Features (MVP)
- Duplicate detection within ~20m for unfixed reports (`is_duplicate_of`)
- Upvote w/ once-per-user idempotency
- Status timeline w/ author + comment

## Business angle
**Civic accountability is the product**. Public-facing zone fix-rate analytics put gentle pressure on each ward office — turns reports into a scoreboard. Future: SLA escalation (7-day rule), citizen reward points for verified reports, BBMP API webhook to municipal CMS.
