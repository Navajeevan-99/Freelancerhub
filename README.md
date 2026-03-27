# FreelancerHub (MERN Stack)

Full Freelancer Marketplace Web Application using MongoDB, Express, React, and Node.js.

## Implemented Requirements

- Role-based authentication for `client` and `freelancer`
- Clients can post jobs with skills, budget, and deadlines
- Freelancers can browse/filter jobs and submit proposals
- Clients can review proposals and accept one proposal
- Accepted proposal creates project workspace
- Project page with status/progress updates
- Direct project messaging between client and freelancer
- Review/rating system for both sides (any participant can review)
- Freelancer leaderboard by rating + completed projects
- Client invitation flow from leaderboard to active job
- Notifications for proposals, messages, invites, and project updates
- Dashboard metrics for active/completed projects and pending proposals
- Basic payment placeholder via `paymentStatus` in projects (`pending`/`paid`)

## Project Structure

- `server/` - Express + MongoDB API
- `client/` - React frontend (Vite)

## Setup

1. Install dependencies:
   - `npm install`
   - `npm install --prefix server`
   - `npm install --prefix client`
2. Environment files:
   - Copy `server/.env.example` to `server/.env`
   - Copy `client/.env.example` to `client/.env`
3. Start MongoDB locally or provide MongoDB Atlas URI in `server/.env`

## Run

- Start full stack (frontend + backend): `npm run dev`
- Backend only: `npm run dev --prefix server`
- Frontend only: `npm run dev --prefix client`

## API Overview

- Auth:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
- Jobs/Proposals/Projects:
  - `GET /api/jobs`
  - `POST /api/jobs`
  - `POST /api/jobs/:jobId/proposals`
  - `GET /api/proposals/client`
  - `PUT /api/proposals/:proposalId/accept`
  - `GET /api/projects`
  - `PUT /api/projects/:projectId`
  - `GET /api/projects/:projectId/messages`
  - `POST /api/projects/:projectId/messages`
  - `POST /api/projects/:projectId/reviews`
  - `GET /api/leaderboard`
  - `POST /api/jobs/:jobId/invite`
  - `GET /api/notifications`
  - `GET /api/dashboard`

## Notes / Limitations

- Real payment gateway is not connected yet; currently modeled with project payment status fields.
- Real-time messaging/notifications (WebSockets) is not included; current implementation is REST polling.
- Production hardening (validation layer, rate limiting, unit/integration tests) can be added next.
