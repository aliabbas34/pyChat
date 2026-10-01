# pyChat

A minimal one-to-one chat app built with Django, Django Channels, PostgreSQL, Redis and React (TypeScript).

## Features

- Sign up / log in (JWT)
- Search users by name or username, view profiles
- Friend requests: send, accept, reject, cancel; unfriend
- Chat list sorted by latest message, with unread counts and online status
- Real-time chat over WebSockets: typing indicator, read receipts, paginated history
- Edit profile and change password

## Tech

| Layer | Stack |
|---|---|
| Backend | Django, Django REST Framework, SimpleJWT, Django Channels |
| Data | PostgreSQL, Redis (channel layer + presence) |
| Frontend | React, TypeScript, Vite, React Router |

## Running

```bash
cp .env.example .env
docker compose up --build
```

- Frontend: http://localhost:5173
- API: http://localhost:8000/api/

Run the backend tests:

```bash
docker compose exec backend pytest
```

## Project layout

```
backend/
  accounts/   user model, signup, profile, search
  friends/    friend requests and friendships
  chat/       messages, chat list, WebSocket consumer, presence
frontend/src/
  api/        typed REST client
  context/    auth state and the shared WebSocket
  pages/      one component per route
```
