## Database Setup - Local & Production

### Local Development

#### 1. Create local D1 database

```bash
wrangler d1 create tranquille-vacances-db-local
```

This will output a database ID. Update `wrangler.toml`:
```toml
[[d1_databases]]
binding      = "DB"
database_name = "tranquille-vacances-db-local"
database_id  = "YOUR_DATABASE_ID_HERE"
```

#### 2. Initialize schema

```bash
wrangler d1 execute tranquille-vacances-db-local --file=schema.sql
```

#### 3. Clear hero image (if needed)

```bash
wrangler d1 execute tranquille-vacances-db-local --file=scripts/clear-hero-image.sql
```

### Production Setup

#### 1. Create production D1 database

```bash
wrangler d1 create tranquille-vacances-db
```

Update `wrangler.toml` production environment:
```toml
[env.production.d1_databases]
[[env.production.d1_databases]]
binding      = "DB"
database_name = "tranquille-vacances-db"
database_id  = "YOUR_PROD_DATABASE_ID"
```

#### 2. Initialize production schema

```bash
wrangler d1 execute tranquille-vacances-db --file=schema.sql
```

#### 3. Update environment variables

Replace "TODO" placeholders in both `wrangler.toml` files:
- `PUBLIC_URL`: Your production domain (e.g., `https://vacances.potet.fr`)
- `database_id`: The ID from `wrangler d1 create` output

### Set Secrets (Development & Production)

```bash
# Development
wrangler secret put ADMIN_PASSWORD --env development
wrangler secret put SESSION_SECRET --env development

# Production  
wrangler secret put ADMIN_PASSWORD --env production
wrangler secret put SESSION_SECRET --env production
```

### Deploy to Production

```bash
wrangler deploy --env production
```
