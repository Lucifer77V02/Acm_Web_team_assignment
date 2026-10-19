# ACM NITK Membership Management System

A lightweight membership portal for a college club. Admins manage members and teams; everyone else can browse the directory and see live statistics.

**Chosen task:** Project 2, Membership Management System (ACM NITK Web Team Recruitment 2026)

> **Demo login:** `TODO: admin temp / temp1234` (admin) and `TODO: viewer tp / tp1234` (read-only).
> The free hosting tier sleeps after inactivity, so the first load can take about a minute.

---

## Table of contents

1. [Features](#features)
2. [Tech stack and architecture](#tech-stack-and-architecture)
3. [Design decisions](#design-decisions)
4. [Database schema](#database-schema)
5. [Setup from scratch](#setup-from-scratch)
6. [Environment variables](#environment-variables)
7. [Roles and permissions](#roles-and-permissions)
8. [API documentation](#api-documentation)
9. [Not implemented / planned](#not-implemented--planned)
10. [Known bugs and limitations](#known-bugs-and-limitations)
11. [Deployment](#deployment)
12. [Screenshots](#screenshots)
13. [References](#references)

---

## Features

### Authentication and authorization
- Registration, login and logout (Django session authentication).
- Passwords are hashed by Django (PBKDF2) and never stored in plain text.
- Every API endpoint requires login. Anonymous requests are rejected.
- Two roles: **viewer** (read-only) and **admin** (full control).
- Permissions are enforced on the backend (`IsAdminOrReadOnly`, `IsAdminUser`). Hiding buttons in React is only a convenience.
- New sign-ups are always viewers; the server never reads an admin flag from the registration request.
- Admins can promote or demote users on the **Users & roles** page. An admin cannot demote themselves, and the last remaining admin cannot be removed.

### Member directory
- Responsive table of members with colored initial avatars, department, year, status and team badges.
- Member detail page showing profile information and all team memberships.
- Admins can add, edit and delete members.
- Duplicate emails are rejected (unique constraint). Year is validated on both client and server (1 to 4).
- Confirmation dialog before deleting.

### Search, filtering and sorting
- Search by name, email or department (also reachable from the top bar).
- Filter by status, year and team. Filters combine.
- Sort by name, year or date joined.
- Server-side pagination (6 per page), a **Clear filters** button, and an empty state.

### Teams / SIGs
- Create, edit and delete teams (admin only). Deleting a team removes its memberships.
- Team detail page lists members and their designation within that team.
- Member count shown per team.
- A member can belong to several teams, each with its own designation (the `Membership` table).
- Assign or remove team membership from the member profile.

### Dashboard
All figures come from the database through `GET /api/members/stats/`:
- Total, active and inactive member counts.
- Members by department, by year, and active vs inactive.
- Team-wise member distribution.
- Recently joined members.

### UI / UX
- Responsive layout (desktop, tablet, mobile) with a collapsible sidebar.
- Loading spinners, empty states, and error messages on forms.
- Reusable components and one consistent design system defined in `index.css` (CSS variables).

---

## Tech stack and architecture

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Router, Axios, Recharts |
| Backend | Django 6, Django REST Framework |
| Database | PostgreSQL |
| Auth | Django sessions (cookie based) |
| Production serving | Gunicorn + WhiteNoise |
| Hosting | Render (app) + Neon (PostgreSQL) |

```
Browser (React SPA)
      │  JSON over HTTP  (cookies, same origin in production)
      ▼
Django project (backend/)
  ├─ urls.py          routes /api/*, /admin/, and the React app
  └─ members/         the single Django app
       ├─ models.py        Team, Member, Membership
       ├─ serializers.py   validation + JSON shape
       ├─ views.py         ViewSets (members, teams, memberships, stats)
       ├─ auth_views.py    register / login / logout / me
       ├─ user_views.py    list users, change role (admin only)
       ├─ permissions.py   IsAdminOrReadOnly
       └─ authentication.py
      ▼
PostgreSQL
```

### Folder structure

```
.
├── manage.py
├── requirements.txt
├── build.sh                 production build script
├── .env.example
├── backend/                 Django project (settings, urls, wsgi)
├── members/                 Django app (models, views, serializers, permissions)
└── frontend/
    └── src/
        ├── api/axios.js         shared API client
        ├── context/Authcontext.jsx
        ├── components/          Layout, Navbar, AssignTeam, Icons
        └── pages/               Dashboard, Members, MemberDetail, Teams, TeamDetail, Users, Login
```

The structure follows an MVC-style separation: models (data), serializers and viewsets (controller logic), and React pages and components (view).

---

## Design decisions

**Separate `User` and `Member` models.** Django's built-in `User` handles *logging in* (credentials and role). `Member` is a *club roster record*. They are kept separate because:

- A club often has members who never log into the portal (for example alumni), and the portal may have accounts that are not on the roster.
- Authentication data (password hashes, staff flag) stays isolated from personal roster data.
- Admins can manage the roster without creating accounts.

The trade-off is that a logged-in user is not linked to their own member record, so a user cannot yet edit their own profile.

**A `Membership` join table.** Members and teams are many-to-many. Putting `designation` and `start_date` on the join table lets one person be, for example, *Lead* in one team and *Member* in another.

**Same-origin deployment.** In production Django serves both the API and the built React app, so the session cookie is first-party and no cross-site CORS configuration is needed.

**Roles map to Django's `is_staff`.** `is_staff = True` means admin. This reuses Django's own permission class (`IsAdminUser`) instead of inventing a parallel system.

---

## Database schema

```mermaid
erDiagram
    TEAM ||--o{ MEMBERSHIP : has
    MEMBER ||--o{ MEMBERSHIP : joins
    USER {
        int id PK
        string username UK
        string password "hashed"
        string email
        bool is_staff "admin flag"
    }
    MEMBER {
        int id PK
        string name
        string email UK
        string department
        int year
        string status "active | inactive"
        date date_joined
    }
    TEAM {
        int id PK
        string name UK
        text description
        datetime created_at
    }
    MEMBERSHIP {
        int id PK
        int member_id FK
        int team_id FK
        string designation
        date start_date
    }
```

`MEMBERSHIP` has a unique constraint on `(member_id, team_id)`, so a member cannot be added to the same team twice. Foreign keys use `ON DELETE CASCADE`.

---

## Setup from scratch

### Prerequisites
- Python 3.12 or newer (Django 6 requires it)
- Node.js 20 or newer and npm
- PostgreSQL 14 or newer

### 1. Clone

```bash
git clone TODO-your-repo-url
cd TODO-your-repo-folder
```

### 2. Create the database

```bash
# Linux / macOS
createdb acm_members
# or, inside psql:  CREATE DATABASE acm_members;
```

### 3. Configure environment variables

```bash
cp .env.example .env      # Windows: copy .env.example .env
```

Open `.env` and fill in your values (see [Environment variables](#environment-variables)).

### 4. Backend

```bash
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser  # this account becomes the first admin
python manage.py runserver        # http://localhost:8000
```

### 5. Frontend (new terminal)

```bash
cd frontend
npm install
npm run dev                       # http://localhost:5173
```

### 6. Use it

1. Open <http://localhost:5173> and log in with the superuser you created.
2. Create a few teams, then add members and assign them to teams.
3. Register a second account in a private window to see the read-only viewer experience.
4. Promote users from **Users & roles**.

### Running as in production (optional)

```bash
cd frontend && npm run build && cd ..
DEBUG=False python manage.py runserver   # or: gunicorn backend.wsgi
```

---

## Environment variables

Copy `.env.example` to `.env`. **Never commit `.env`.**

| Variable | Required | Example | Purpose |
|---|---|---|---|
| `SECRET_KEY` | yes | `long-random-string` | Django cryptographic signing key |
| `DEBUG` | no (default `False`) | `True` | Use `True` only locally |
| `DB_NAME` | local | `acm_members` | Database name |
| `DB_USER` | local | `postgres` | Database user |
| `DB_PASSWORD` | local | `your-db-password` | Database password |
| `DB_HOST` | local | `localhost` | Database host |
| `DB_PORT` | local | `5432` | Database port |
| `DATABASE_URL` | production | `postgresql://user:pass@host/db?sslmode=require` | Replaces the `DB_*` values when set |
| `ALLOWED_HOSTS` | production | `your-app.onrender.com` | Comma-separated hostnames |
| `CSRF_TRUSTED_ORIGINS` | production | `https://your-app.onrender.com` | Comma-separated origins |
| `DJANGO_SUPERUSER_USERNAME` / `_EMAIL` / `_PASSWORD` | production | | Creates the first admin during deploy |

---

## Roles and permissions

| Action | Anonymous | Viewer | Admin |
|---|:---:|:---:|:---:|
| Register / log in | ✅ | ✅ | ✅ |
| View dashboard, members, teams | ❌ | ✅ | ✅ |
| Create / edit / delete members | ❌ | ❌ | ✅ |
| Create / edit / delete teams | ❌ | ❌ | ✅ |
| Assign or remove team membership | ❌ | ❌ | ✅ |
| View users and change roles | ❌ | ❌ | ✅ |

Rejected requests return `403 Forbidden`.

---

## API documentation

Base path: `/api/`. All endpoints require an authenticated session. Writes require an admin. Request and response bodies are JSON.

### Auth

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/register/` | public | Create a viewer account `{username, password, email?}` |
| POST | `/auth/login/` | public | Log in `{username, password}` |
| POST | `/auth/logout/` | public | Log out |
| GET | `/auth/me/` | public | Current user, or `{user: null}` |

### Members

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/members/` | user | Paginated list (6 per page) |
| POST | `/members/` | admin | Create a member |
| GET | `/members/{id}/` | user | Member detail with memberships |
| PUT / PATCH | `/members/{id}/` | admin | Update |
| DELETE | `/members/{id}/` | admin | Delete |
| GET | `/members/stats/` | user | Dashboard statistics |

Query parameters for `GET /members/`: `search`, `status` (`active` or `inactive`), `year`, `department`, `team` (team id), `ordering` (`name`, `-name`, `year`, `-year`, `date_joined`, `-date_joined`), `page`.

### Teams

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/teams/` | user | All teams with `member_count` (not paginated) |
| POST | `/teams/` | admin | Create a team |
| GET | `/teams/{id}/` | user | Team detail |
| PUT / PATCH | `/teams/{id}/` | admin | Update |
| DELETE | `/teams/{id}/` | admin | Delete |
| GET | `/teams/{id}/members/` | user | Members of a team with their designation |

### Memberships

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/memberships/` | user | List |
| POST | `/memberships/` | admin | Assign `{member, team, designation}` |
| PUT / PATCH | `/memberships/{id}/` | admin | Change designation |
| DELETE | `/memberships/{id}/` | admin | Remove from team |

### Users (admin only)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/users/` | List users with roles |
| PATCH | `/users/{id}/role/` | Set `{role: "admin"}` or `{role: "viewer"}` |

### Status codes
`200` OK, `201` created, `204` deleted, `400` validation error (the body lists field errors), `401` bad credentials, `403` not permitted, `404` not found.

---

## Not implemented / planned

- Team lead field on teams
- Filtering by designation and department in the UI (the backend already accepts `department`)
- Member archiving (members are currently deleted permanently; the `inactive` status is the soft option)
- Pending membership applications and an approval workflow
- Profile picture uploads (colored initial avatars are used)
- Email notifications
- Light theme and theme toggle (the interface is dark only)
- Automated tests
- Linking a login account to its own member profile

---

## Known bugs and limitations

- **No automated tests.** Behaviour was verified by hand.
- **CSRF token checking is disabled** for API calls (`CsrfExemptSessionAuthentication`). Session cookies use Django's default `SameSite=Lax`, which blocks cross-site form posts, but the proper fix is to send Django's CSRF token from React.
- **Registration is open**, and the register endpoint does not run Django's password strength validators.
- **Passwords cannot be reset** through the app (no email flow).
- **A free-tier host sleeps** after about 15 minutes idle; the first request afterwards is slow.
- **Teams list is not paginated**, which is fine for a club but would not scale to thousands of teams.
- Designation is free text rather than a fixed list of roles.

---

## References

- [Django documentation](https://docs.djangoproject.com/)
- [Django REST framework](https://www.django-rest-framework.org/)
- [React](https://react.dev/) and [Vite](https://vite.dev/)
- [React Router](https://reactrouter.com/)
- [Recharts](https://recharts.org/)
- [WhiteNoise](https://whitenoise.readthedocs.io/)
- [Render](https://render.com/docs) and [Neon](https://neon.com/docs) deployment docs
- Claude Haiku
