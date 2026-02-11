# Server Setup

## Database

1. **Create PostgreSQL database** (local or cloud):
   ```bash
   createdb eob_explainer
   ```

2. **Set `DATABASE_URL`** in `.env`:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/eob_explainer
   ```

3. **Run the schema**:
   ```bash
   npm run db:schema
   ```
   Or manually: `psql $DATABASE_URL -f server/db/schema.sql`

## Running the app

- **Frontend only** (no API): `npm run dev`
- **Backend only**: `npm run server`
- **Both** (recommended for development): `npm run dev:all`

The Vite dev server proxies `/api` requests to the Express server on port 3000.

## Auth0 API (optional for dev)

For JWT validation on the backend, create an API in the Auth0 Dashboard and set:
- `AUTH0_DOMAIN` (same as `VITE_AUTH0_DOMAIN`)
- `AUTH0_AUDIENCE` (your API identifier, e.g. `https://your-api.com`)

Without these, the server uses a dev user (`dev-user`) for API requests.
