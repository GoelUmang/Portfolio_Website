<p align="center">
  <strong>UMANG GOEL</strong><br>
  <em>Software Engineer · Systems · Backend · Data</em>
</p>

<p align="center">
  <a href="https://goelumang.com">🌐 Live Site</a> ·
  <a href="https://www.linkedin.com/in/GoelUmang/">LinkedIn</a> ·
  <a href="mailto:goelumangcareers@gmail.com">Email</a> ·
  <a href="https://github.com/GoelUmang">GitHub</a>
</p>

---

## Overview

A high-performance personal portfolio website built with a dynamic, hardware-accelerated HUD/Iron-Man-inspired dark theme. It features a custom 3D WebGL Spline scene, a native fragment shader boot sequence, a live PostgreSQL visitor counter, scroll-driven animations, and a securely hardened serverless API backend.

**Live at:** [goelumang.com](https://goelumang.com)

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML5, Vanilla JS (ES Modules), Custom CSS Glassmorphism |
| **Graphics** | [Spline](https://spline.design) 3D WebGL, Three.js (Shaders), HTML5 Canvas Particles |
| **Backend API**| Node.js Serverless Functions (Vercel) |
| **Database** | PostgreSQL (Supabase) + Row Level Security |
| **Email** | Nodemailer via Gmail SMTP |
| **Infrastructure** | Vercel Edge Network |

## Project Structure

```
personal_portfolio/
├── public/                  # Static assets (deployed to Vercel Edge)
│   ├── index.html           # Single-page portfolio
│   ├── css/
│   │   └── styles.css       # Hardware-accelerated HUD theme styling
│   └── js/
│       ├── main.js          # Entry point (handles physics & scroll loops)
│       ├── splineScene.js   # 3D interactive robot runtime
│       └── shaderLoader.js  # Optimized concentric-ring Boot fragment shader
├── api/                     # Vercel Serverless Functions
│   ├── contact.js           # Secure email forwarder (POST)
│   └── views.js             # Supabase unique visitor metrics logic (GET/POST)
├── lib/
│   ├── mailer.js            # Nodemailer transport configurations
│   └── utils.js             # Shared Security headers & CORS validation
├── supabase/
│   └── migrations/          # Postgres SQL definitions (RLS bypasses, RPCs)
├── server.js                # Express local development proxy
├── vercel.json              # Vercel production routing & security headers
├── package.json
└── .env                     # Environment variables (Ignored in Git)
```

## Getting Started

### Prerequisites
- **Node.js** ≥ 18
- **npm** ≥ 9
- A Gmail account with an [App Password](https://myaccount.google.com/apppasswords)
- A [Supabase](https://supabase.com) Project

### Installation
```bash
git clone https://github.com/GoelUmang/Portfolio_Website.git
cd Portfolio_Website
npm install
```

### Environment Setup
Create a `.env` file in the project root:
```env
PORT=3000

# Gmail SMTP 
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Email Destination
CONTACT_TO=your-email@gmail.com

# Production CORS
ORIGIN=your_site_domain

# Supabase View Counters
SUPABASE_URL=your_project_url
SUPABASE_KEY=your_anon_publishable_key
```

### Database Initialization
Execute the SQL migration locally in your Supabase SQL Editor:
1. Open `supabase/migrations/20260409000000_create_views.sql`.
2. Run it in your Supabase dashboard to create the `site_views` table, attach the `Row Level Security (RLS)` policies, and generate the `get_view_metrics` RPC function.

### Running Locally
```bash
# Start the Express server (serves frontend + API)
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

## Advanced Features & Performance

### 🛡️ Hardened Security Architecture
The `/api/contact` and `/api/views` endpoints are explicitly patched against proxy-spoofing and DDoS attacks. 
- **Header Locking:** Extracts un-spoofable internal Vercel headers (`x-vercel-forwarded-for`) before falling back to local IPs.
- **Data Protection:** Implements SHA-256 IP origin hashing (prevents PII storage in Supabase) and enforces Vercel preview-branch dynamic CORS.

### ⚡ Aggressive WebGL Performance Tuning
To ensure `60 FPS` on mobile devices without burning battery life, the application implements strict JS decoupling:
- **Renderer Hand-offs:** The 2D Particle collision canvas actively deletes itself from memory the exact moment the 3D Spline Robot resolves its WebGL context to prevent dual-GPU overdraw.
- **Layout Thrashing Prevention:** All localized mouse-moves (3D tilting HUD cards, radial cursor glows, and magnetic buttons) execute strictly inside `requestAnimationFrame()` loops to eliminate DOM recalcs.
- **Shader Optimization:** The startup UI boot sequence executes a bare-metal fragment shader with MSAA disabled and forced 1x pixel-density for instantaneous loading.

## License
This project is private. All rights reserved.

---
<p align="center">
  Built by <a href="https://goelumang.com">Umang Goel</a>
</p>
