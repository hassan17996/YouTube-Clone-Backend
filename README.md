# YouTube Clone Backend

A RESTful backend for a YouTube-style video sharing platform.

**Stack:** Node.js, Express 5, TypeScript, Sequelize ORM, PostgreSQL, JWT, Multer, Nodemailer.

## Features

- **Auth:** signup, email verification via OTP (5-minute expiry, stored hashed), login, JWT sessions, password reset via OTP
- **Videos:** upload video and thumbnail locally (size and MIME validation), CRUD (creator only), view tracking, trending, subscribed feed
- **Comments:** add, read by video or ID, update (author only), delete (author or video creator)
- **Reactions:** like/dislike toggle, switch or remove; reactions feed the trending score
- **Subscriptions:** subscribe, unsubscribe, list, subscribed-channels feed
- **Search:** videos by title or description, channels by username, with pagination, sorting and filters
- **Profile:** update username, bio and avatar; delete account
- **Security:** verified-only write actions, input validation and sanitization, rate limiting, Helmet, secrets in environment variables
- **Transactions:** Sequelize transactions on signup, verification, password reset, video upload and update/delete, comments, reactions and subscriptions

## Requirements

- Node.js 20 or newer
- PostgreSQL 14 or newer
- An SMTP account for OTP emails (Mailtrap for development, or Gmail with an app password)

## Setup

```bash
git clone <your-repo-url>
cd youtube-clone-backend
npm install
cp .env.example .env      # then fill in the values
```

1. Create the database (quote the name if it contains capitals or hyphens):
   ```bash
   createdb "Youtube-Clone"
   ```
2. Run the migrations:
   ```bash
   npm run db:migrate
   ```
3. Start the server:
   ```bash
   npm run dev               # development, auto-restarts on changes
   # or
   npm run build && npm start  # production
   ```
4. Check it works: `GET http://localhost:3000/health` returns `{ "status": "ok" }`.

Always start the server from the project root, because `uploads/` is resolved relative to it.

## Environment variables

See `.env.example` for the full list.

| Variable                                                                                | Description                                                           |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `APP_PORT`                                                                              | Port the API listens on (default 3000)                                |
| `DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_HOST`, `DATABASE_PORT` | PostgreSQL connection                                                 |
| `JWT_SECRET`                                                                            | At least 32 random characters. The server refuses to start without it |
| `JWT_EXPIRES_IN`                                                                        | Token lifetime, e.g. `7d`                                             |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`                         | Email settings for OTPs                                               |
| `CORS_ORIGIN`                                                                           | Comma-separated allowed origins                                       |
| `TRUST_PROXY`                                                                           | `true` only behind a reverse proxy                                    |

## Scripts

| Script                        | What it does                  |
| ----------------------------- | ----------------------------- |
| `npm run dev`                 | Run with `tsx watch`          |
| `npm run build`               | Compile TypeScript to `dist/` |
| `npm start`                   | Run the compiled app          |
| `npm run db:migrate`          | Apply migrations              |
| `npm run db:migrate:undo`     | Undo the last migration       |
| `npm run db:migrate:undo:all` | Undo all migrations           |

Migrations are written for Sequelize CLI. Because the project uses `"type": "module"`, the CLI files (`.sequelizerc`, `config/config.cjs`, `migrations/*.cjs`) use CommonJS with the `.cjs` extension. The app code in `src/` is ESM.

## Project structure

```
config/config.cjs        Sequelize CLI database config
migrations/              Sequelize migrations (.cjs)
src/
  app.ts                 Express app and startup
  controllers/           Request handlers
  middlewares/           auth, validation, uploads, rate limiters
  models/                Sequelize models and associations
  routes/                Route definitions
  types/                 Express type extensions
  utils/                 db, mailer, otp, files, pagination, errors
uploads/                 Uploaded files (not committed)
```

## Authentication flow

1. `POST /api/auth/signup` creates an unverified user and emails an OTP.
2. `POST /api/auth/verify-otp` verifies the code (valid for 5 minutes, single use).
3. `POST /api/auth/login` returns a JWT. Unverified users get 403.
4. Send `Authorization: Bearer <token>` on protected routes.

All POST, PUT and DELETE routes (except the public auth routes) require a valid token and a verified account.

## API overview

Full examples are in the Postman collection (`YouTube-Clone-Backend.postman_collection.json`). Import it, run **Auth > Login** first, and the token is saved automatically.

| Area          | Endpoints                                                                                                                                                               |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth          | `POST /api/auth/signup`, `verify-otp`, `resend-otp`, `login`, `forgot-password`, `reset-password`                                                                       |
| Users         | `GET /api/users/me`, `GET /api/users/:id`, `PUT /api/users/me`, `PUT /api/users/me/avatar`, `DELETE /api/users/me`                                                      |
| Videos        | `GET /api/videos`, `GET /api/videos/trending`, `GET /api/videos/subscribed`, `GET /api/videos/:id`, `POST /api/videos`, `PUT /api/videos/:id`, `DELETE /api/videos/:id` |
| Comments      | `GET` and `POST /api/videos/:videoId/comments`, `GET`, `PUT` and `DELETE /api/comments/:id`                                                                             |
| Reactions     | `POST /api/videos/:videoId/reactions` (toggle), `DELETE` (remove), `GET .../reactions/me`                                                                               |
| Subscriptions | `GET /api/subscriptions`, `POST` and `DELETE /api/subscriptions/:channelId`, `GET .../status`                                                                           |
| Search        | `GET /api/search/videos`, `GET /api/search/channels`                                                                                                                    |

List endpoints accept `page` and `limit` (max 50) and return `total` and `totalPages`.

### Trending

Trending score = `views + 5 × likes − 2 × dislikes`. Use `?sort=views` or `?sort=likes` on `/api/videos/trending` for the most-viewed or most-liked variants.

### Uploads

| Field                 | Types           | Max size |
| --------------------- | --------------- | -------- |
| `video`               | mp4, webm, mov  | 100 MB   |
| `thumbnail`, `avatar` | jpeg, png, webp | 2 MB     |

Files are stored under `uploads/` and served at `/uploads/...` with random file names.

## Database

The ERD is `DB Design.png` (open it at [dbdiagram.io](https://dbdiagram.io)).

Tables: `users`, `videos`, `comments`, `reactions`, `subscriptions`, `otps`. Foreign keys use `ON DELETE CASCADE`. `reactions` is unique on `(user_id, video_id)` and `subscriptions` on `(subscriber_id, channel_id)`.

## Design decisions and limitations

- A single JWT is used for sessions (no refresh tokens). Tokens stay valid until they expire, and logout is client-side.
- OTPs are bcrypt-hashed, single use, and rate limited per email.
- MIME types are checked from the request header, not the file's real bytes.
- Every video GET counts as a view, with no per-user deduplication.
- Unverified accounts are not cleaned up automatically.
