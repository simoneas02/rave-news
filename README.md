# Rave News

A community platform for rave and electronic music culture: events, line-ups, releases, and underground news, all in one place.

## Features

- **User accounts** — register, activate via email, and authenticate with hashed passwords
- **Session management** — secure login/logout flow backed by the database
- **Live status page** — real-time monitoring of the API and database health, auto-refreshed every 2 seconds
- **Database migrations** — versioned schema changes with node-pg-migrate, no manual SQL
- **REST API** — clean `v1` routes for users, sessions, activations, and system status

## Stack

- Next.js + React
- PostgreSQL (via Neon) + pg
- Nodemailer and Resend for transactional email
- CSS Modules
- Jest for testing

## Running locally

```bash
npm install
docker compose -f infra/compose.yaml up -d  # starts PostgreSQL
npm run dev
```

Migrations run automatically on startup. The status page at `/status` confirms everything is healthy.
