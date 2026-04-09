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

A personal portfolio website built with a HUD/Iron-Man-inspired dark theme — featuring a 3D Spline scene, shader-powered boot screen, scroll-driven animations, and a fully functional contact form with a hardened backend API.

**Live at:** [goelumang.com](https://goelumang.com)

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML5, Vanilla CSS, JavaScript (ES Modules) |
| **Styling** | Tailwind CSS v4, custom CSS (glassmorphism, HUD effects) |
| **3D Scene** | [Spline](https://spline.design) runtime via ESM import |
| **Fonts** | Orbitron · Space Grotesk · JetBrains Mono (Google Fonts) |
| **Backend** | Node.js, Express |
| **Email** | Nodemailer (Gmail SMTP) |
| **Deployment** | Vercel (static + serverless functions) |
| **Security** | Helmet, CORS, rate limiting, honeypot spam trap |

## Project Structure

```
personal_portfolio/
├── public/                  # Static assets (deployed to Vercel)
│   ├── index.html           # Single-page portfolio
│   ├── favicon.svg
│   ├── css/
│   │   ├── styles.css       # Custom styles (HUD theme, animations)
│   │   └── tailwind.css     # Compiled Tailwind output
│   └── js/
│       ├── main.js          # Entry point (imports all modules)
│       ├── contact.js       # Contact form handler
│       ├── shaderLoader.js  # Boot screen shader
│       └── splineScene.js   # 3D scene loader
├── api/
│   └── contact.js           # Vercel serverless function (POST /api/contact)
├── server.js                # Express server (local development)
├── vercel.json              # Vercel deployment config + security headers
├── tailwind-input.css       # Tailwind source
├── tailwind.config.js       # Tailwind configuration
├── package.json
└── .env                     # Environment variables (not committed)
```

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- A Gmail account with an [App Password](https://myaccount.google.com/apppasswords) for SMTP

### Installation

```bash
git clone https://github.com/GoelUmang/Portfolio_Website.git
cd Portfolio_Website
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
PORT=3000

# Gmail SMTP (use an App Password, NOT your real password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Where contact-form emails are delivered
CONTACT_TO=your-email@gmail.com

# Production origin for CORS
ORIGIN=your_origin
```

> **Important:** Also set `ORIGIN`, `SMTP_USER`, `SMTP_PASS`, and `CONTACT_TO` in the [Vercel dashboard](https://vercel.com) → Project Settings → Environment Variables for production.

### Running Locally

```bash
# Start the Express server (serves frontend + API)
npm run dev

# In a separate terminal — watch for Tailwind changes
npm run watch:css
```

Open [http://localhost:3000](http://localhost:3000).

### Building CSS

```bash
npm run build:css
```

This compiles `tailwind-input.css` → `public/css/tailwind.css` (minified).

## Deployment

The site is deployed on **Vercel** with the following architecture:

- `public/` → served as **static files** at the CDN edge
- `api/contact.js` → deployed as a **serverless function** (`POST /api/contact`)
- `server.js` → **not used on Vercel** (only for local development)

### Deploy to Vercel

```bash
npx vercel --prod
```

Or connect the GitHub repo to Vercel for automatic deployments on push.

### Security

The production API (`api/contact.js`) includes:

- **CORS** — only allows requests from the configured origin domains
- **Rate limiting** — 5 contact submissions per IP per 15-minute window
- **Security headers** — `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, etc. (via `vercel.json`)
- **Input validation** — type checking, length limits, email format validation
- **Honeypot field** — invisible form field to catch bots
- **Body size limit** — rejects payloads larger than 10 KB

## Key Features

- 🎬 **Boot Screen** — shader-animated terminal-style loading sequence
- 🎮 **Interactive 3D Scene** — Spline-powered background with mouse tracking
- 📜 **Scroll Animations** — intersection observer-driven reveal effects
- 💼 **Experience Timeline** — animated vertical timeline with HUD styling
- 📊 **Animated Stats** — counter animations triggered on scroll
- ✉️ **Contact Form** — sends emails via Gmail SMTP with spam protection
- 📱 **Fully Responsive** — mobile-first design with adaptive nav

## License

This project is private. All rights reserved.

---

<p align="center">
  Built by <a href="https://goelumang.com">Umang Goel</a>
</p>
