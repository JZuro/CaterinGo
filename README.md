# CaterinGo

CaterinGo is a small catering delivery management app. It lets drivers manage
delivery addresses, meals and orders, then calculate an ordered route through
all pending deliveries.

The project was built as a full-stack demonstration with a React frontend and a
Django REST API.

## Features

- User signup, login and logout
- Separate addresses, meals, orders and routes for every user
- Address geocoding with [Nominatim](https://nominatim.org/)
- Route distance data from [OSRM](https://project-osrm.org/)
- Exact route optimization for smaller routes and a nearest-neighbour fallback
  for larger ones
- Address, meal and order create, edit and delete forms
- Persistent route snapshots that remain unchanged until the next optimization
- Responsive light and dark themes

## Technology

- React, TypeScript and Vite
- Tailwind CSS and FlyonUI
- Django and Django REST Framework
- SQLite for local development
- Nominatim and OSRM public APIs

## API

The frontend uses the API under `/api/`. Its main endpoints are:

```text
/api/auth/signup/
/api/auth/login/
/api/auth/logout/
/api/auth/me/
/api/addresses/
/api/meals/
/api/orders/
/api/routes/current/
/api/routes/optimize/
```

Except for signup and login, API requests require an authentication token.

## Local development

Install the frontend packages and start Vite:

```bash
npm install
npm run dev
```

In another terminal, create and activate the backend environment, install its
packages, and start Django:

```bash
python3 -m venv server/.venv
source server/.venv/bin/activate
python -m pip install -r server/requirements.txt
python server/manage.py migrate
python server/manage.py runserver
```

Vite serves the site at `http://127.0.0.1:5173` and proxies `/api/` requests to
Django at `http://127.0.0.1:8000`.

## Railway deployment

The repository contains a multi-stage `Dockerfile` that builds the React app
and serves it together with Django from one Gunicorn process. Railway detects
the Dockerfile automatically.

1. Create a Railway project from this GitHub repository.
2. In the same project, select **New → Database → PostgreSQL**.
3. Add these variables to the application service:

   ```text
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   DJANGO_SECRET_KEY=<a long random value>
   DJANGO_DEBUG=False
   DJANGO_HTTPS=True
   DJANGO_HSTS_SECONDS=300
   NOMINATIM_USER_AGENT=CaterinGo/1.0 (contact: you@example.com)
   OSRM_USER_AGENT=CaterinGo/1.0
   ```

4. Under the application service's deployment settings, set the health-check
   path to `/api/health/`.
5. Under **Settings → Networking**, generate a Railway domain.

The `DATABASE_URL` reference uses Railway's private network and stays in sync
with the PostgreSQL service. Railway supplies `PORT`; the container runs the
migrations and then starts Gunicorn on that port.

The public Nominatim and OSRM endpoints are suitable for this small demo but
should be replaced with hosted services before using the app for real delivery
operations.
