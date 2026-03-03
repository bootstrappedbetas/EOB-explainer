-- Allow pending users (paid via Stripe, not yet created Auth0 account)
ALTER TABLE users ALTER COLUMN auth0_sub DROP NOT NULL;
