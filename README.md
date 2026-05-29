# StreamSync — Multistream Platform

A full-stack web platform that streams pre-recorded videos live to 10 platforms simultaneously using FFmpeg, built for Indian creators and global audiences.

**Built by:** Tanushree Kalla - Full Stack Developer
**Organization:** Purple Merit , Bengaluru  
**Stack:** React, Node.js, Express, MongoDB, FFmpeg, Socket.io

---

## Supported Platforms

| Platform | Type | Key Type | Max Accounts | Works in India |
|---|---|---|---|---|
| YouTube | Full API + RTMP | Permanent | 15 per user | ✅ |
| Twitch | Full API + RTMP | Permanent | 15 per user | ✅ |
| Facebook | RTMP | Permanent | 15 per user | ✅ |
| Kick | RTMP (Custom URL) | Permanent | 15 per user | ✅ |
| Rumble | RTMP | Permanent (Beta) | 15 per user | ✅ |
| Telegram | RTMP | Permanent | 15 per user | ✅ |
| X (Twitter) | RTMP | Permanent | 15 per user | ✅ |
| Instagram | RTMP (Custom URL) | Session | 15 per user | ✅ |
| TikTok | RTMP | Session | 15 per user | ❌ Banned in India |
| BIGO LIVE | RTMP | Session | 15 per user | ❌ Not available in India |

---

## Multi-Account Support

StreamSync supports **multiple streaming accounts per platform**. Each user can save up to **15 labeled accounts** on every supported platform (e.g. "Main Channel", "Gaming Channel", "Brand Account").

### How it works

1. **Stream Keys page** — Add, label, and manage accounts per platform. Each account stores its own stream key (and RTMP URL where required for Kick/Instagram).
2. **Go Live page** — Select any combination of saved accounts across platforms as checkboxes. You can stream to two YouTube channels and one Twitch account in a single session, for example.
3. **Stream history** — Each session records which specific account (`accountId` + label) was used per platform.
4. **Account limit** — Maximum 15 accounts per platform per user. The UI shows a counter like `YouTube (3/15)`.

### Upgrading an existing database

If you deployed StreamSync before multi-account support, run the one-time migration after pulling the latest code:

```bash
cd backend
npm run migrate
```

This converts old single-object platform keys to arrays, backfills `accountId` on OAuth records, and updates MongoDB indexes.

---

## Features

- Upload pre-recorded videos (MP4, MOV, AVI, MKV up to 2GB)
- Multistream to 10 platforms simultaneously with one click
- **Multi-account support — up to 15 labeled accounts per platform**
- Save stream keys with custom labels — select any account combo on Go Live
- Real-time stream timer and **per-account** live indicators
- YouTube and Twitch OAuth for live stats (viewers, likes, chat)
- Video preview modal with HTML5 player
- Stream history with duration tracking and account-level detail
- Platform monetization guide for creators
- Admin dashboard with platform popularity charts
- Role-based access — separate user and admin dashboards
- Permanent platform analytics that never decrease on deletion
- Stream key management page with show/hide, add, and delete per account

---

## Project Structure

```
multistream-app/
├── backend/
│   ├── src/
│   │   ├── config/          # DB, FFmpeg, Passport, Platform configs
│   │   ├── controllers/     # Auth, Video, Stream, Admin, LiveStats
│   │   ├── middleware/      # Auth, Admin, Upload, Error handlers
│   │   ├── models/          # User, Video, Stream, StreamHistory, PlatformStats, LiveStats
│   │   ├── routes/          # All API routes
│   │   ├── scripts/         # DB migrations (migrate-platforms.js)
│   │   └── services/        # FFmpeg, Stream Manager, Platform services
│   ├── uploads/             # User video uploads (gitignored)
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/      # Navbar, Sidebar, VideoModal, etc.
│   │   ├── context/         # AuthContext
│   │   ├── pages/
│   │   │   ├── admin/       # Admin Dashboard, Manage Users/Videos/Streams, Platform Popularity
│   │   │   ├── auth/        # Login, Register
│   │   │   └── user/        # Dashboard, MyVideos, Stream, History, StreamKeys, LiveStats
│   │   └── utils/           # Axios config
│   └── index.html
└── README.md
```

---

## Tech Stack

**Frontend:** React 18, Vite, Tailwind CSS, Socket.io-client, Lucide React

**Backend:** Node.js, Express, MongoDB Atlas, Mongoose, FFmpeg (fluent-ffmpeg), Socket.io, JWT, Passport.js, Multer, bcryptjs

**APIs:** YouTube Data API v3, Twitch API, Google OAuth 2.0

---

## Environment Variables

### Backend `.env`
```
PORT=5020
CLIENT_URL=http://localhost:5173
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
TWITCH_CLIENT_ID=your_twitch_client_id
TWITCH_CLIENT_SECRET=your_twitch_client_secret
```

### Frontend `.env`
```
VITE_API_URL=http://localhost:5020/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

---

## Setup & Run Locally

```bash
# Clone the repo
git clone https://github.com/tanukalla09/streamsync-multistream.git
cd streamsync-multistream

# Backend setup
cd backend
npm install

# One-time migration (required if upgrading from single-account schema)
npm run migrate

npm run dev

# Frontend setup (open new terminal)
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`  
Backend runs on `http://localhost:5020`

---

## How It Works

1. User registers and logs in to StreamSync
2. Uploads a pre-recorded video (MP4, MOV, AVI, MKV)
3. Saves stream keys on the Stream Keys page — up to 15 labeled accounts per platform
4. Goes to Go Live page → selects video + accounts (any combination across platforms) → clicks Start Multistream
5. FFmpeg reads the video file and pushes RTMP stream to all selected accounts simultaneously using tee muxer
6. Real-time stream progress shown via Socket.io WebSockets, with per-account live badges
7. Stream stops on all destinations simultaneously when Stop is clicked
8. Stream history saved automatically with duration, platform, and account details
9. Platform popularity analytics updated permanently in database

---

## Platform Notes

- **YouTube** — Requires 24 hour channel verification before first stream
- **Facebook** — Account must be at least 60 days old
- **X (Twitter)** — Requires Premium subscription to go live
- **Kick** — Requires both Stream Key and custom Stream URL from dashboard
- **Rumble** — Static key (Beta) — may need refresh after Rumble platform updates
- **Telegram** — Must own a Telegram channel (not a group) to go live
- **Instagram** — Session key — must copy fresh key and Stream URL before each stream
- **TikTok** — Banned in India since June 2020
- **BIGO LIVE** — Not available in India
- **Twitch** — Stream key available immediately after account creation, no waiting period

---

## Admin Features

- View total users, videos, streams, storage used and live sessions
- Platform popularity bar chart — shows which platforms are streamed most
- Stream keys adoption chart — shows how many accounts users saved per platform
- Recent registrations and recent uploads
- Manage users — view, delete
- Manage videos — view, preview, delete
- Manage streams — monitor live and past streams, delete records

---

## User Features

- Personal dashboard with stats and recent streams
- Upload and manage videos with click-to-preview modal
- Manage multiple labeled stream key accounts per platform (up to 15 each)
- Stream to any combination of saved accounts with one click
- Real-time live timer and per-account status indicators
- Stream history with delete option
- Platform monetization guide — how each platform pays creators
- Streaming tips for better engagement

---

## License

Private — Built for Purple Merit, Bengaluru © 2026
