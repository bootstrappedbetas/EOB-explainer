# Auth0 Setup Guide

## 1. Create Auth0 Account & Application

1. Go to [manage.auth0.com](https://manage.auth0.com) and sign up
2. Create a new **Application** → choose **Single Page Application**
3. Note your **Domain** and **Client ID** from the Application settings

## 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_AUTH0_DOMAIN=your-tenant.us.auth0.com
VITE_AUTH0_CLIENT_ID=your_client_id_here
```

## 3. Configure Auth0 Application Settings

In your Auth0 Application settings, add these URLs:

| Setting | URLs to add |
|---------|-------------|
| **Allowed Callback URLs** | `http://localhost:5173` |
| **Allowed Logout URLs** | `http://localhost:5173` |
| **Allowed Web Origins** | `http://localhost:5173` |

For production, also add your production URL (e.g. `https://yourdomain.com`).

## 4. Enable Connections

In Auth0 Dashboard → **Authentication** → **Database**:
- Enable **Username-Password-Authentication** for email/password sign-in

In Auth0 Dashboard → **Authentication** → **Social**:
- Enable **Google** for Google sign-in
- Configure with your Google OAuth credentials

## 5. Optional: SSO (Enterprise)

For single sign-on with organizations:
- Auth0 Dashboard → **Organizations** → create organization
- Add `VITE_AUTH0_ORGANIZATION=org_xxxxxxxx` to `.env`

## Security (Encryption)

Auth0 provides:
- **TLS/HTTPS** – all traffic encrypted in transit
- **Bcrypt** – password hashing with salt
- **JWT** – signed tokens for session management
- **HIPAA** – BAA available on paid plans

Never commit `.env` – it's in `.gitignore`.
