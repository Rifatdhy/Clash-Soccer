# PostgreSQL Authentication Fix

## Problem
The application is experiencing API errors because PostgreSQL authentication is not configured correctly. The database is running but rejecting password-based connections from the Next.js application.

Error message: `API request failed: Internal Server Error`
Root cause: `password authentication failed for user "postgres"`

## Solution

### Quick Fix (Automated)
Run the provided fix script:

```bash
./fix-postgres-auth.sh
```

This script will:
1. Locate your PostgreSQL configuration file (`pg_hba.conf`)
2. Create a backup of the original configuration
3. Update authentication method from `peer` to `md5` for local connections
4. Add password authentication for localhost (127.0.0.1)
5. Set the postgres user password to 'postgres'
6. Restart PostgreSQL service

### Manual Fix (If script doesn't work)

If the automated script fails, follow these manual steps:

#### 1. Find PostgreSQL Configuration
```bash
sudo find /etc/postgresql -name pg_hba.conf
```

#### 2. Edit pg_hba.conf
```bash
sudo nano /etc/postgresql/15/main/pg_hba.conf
# (adjust version number based on your installation)
```

#### 3. Update Authentication Lines

Find these lines:
```
local   all             all                                     peer
host    all             all             127.0.0.1/32            ident
```

Change them to:
```
local   all             all                                     md5
host    all             all             127.0.0.1/32            md5
```

Save the file (Ctrl+X, then Y, then Enter in nano).

#### 4. Set PostgreSQL Password
```bash
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"
```

#### 5. Restart PostgreSQL
```bash
sudo systemctl restart postgresql
```

#### 6. Verify Connection
```bash
PGPASSWORD=postgres psql -h localhost -U postgres -d clash_soccer -c "SELECT 1;"
```

If you see output with "1", the connection is working!

### After Applying the Fix

1. Ensure your `.env.local` file has the correct database URL:
   ```
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/clash_soccer
   ```

2. Restart your Next.js development server:
   ```bash
   npm run dev
   ```

3. Visit http://localhost:3000 - all API errors should be resolved!

## Verification

Test the API endpoints:
```bash
curl http://localhost:3000/api/settings
curl http://localhost:3000/api/matches
curl http://localhost:3000/api/news
curl http://localhost:3000/api/faqs
curl http://localhost:3000/api/albums
```

All should return JSON data without errors.

## Troubleshooting

### PostgreSQL won't start after changes
```bash
# Check logs
sudo tail -f /var/log/postgresql/postgresql-15-main.log

# Check status
sudo systemctl status postgresql
```

### Still getting authentication errors
1. Verify the password was set correctly:
   ```bash
   sudo -u postgres psql -c "\du"
   ```

2. Check pg_hba.conf was saved correctly:
   ```bash
   sudo cat /etc/postgresql/15/main/pg_hba.conf | grep -E "^(local|host)"
   ```

3. Ensure PostgreSQL was restarted after changes:
   ```bash
   sudo systemctl restart postgresql
   ```

### Cannot find pg_hba.conf
Try these locations:
- `/etc/postgresql/15/main/pg_hba.conf`
- `/etc/postgresql/14/main/pg_hba.conf`
- `/etc/postgresql/13/main/pg_hba.conf`
- `/var/lib/pgsql/data/pg_hba.conf` (some systems)

## Security Note

For production deployments:
- Use a strong, unique password instead of 'postgres'
- Update the `DATABASE_URL` environment variable with the new credentials
- Consider using connection pooling and SSL
- Restrict access by IP address in pg_hba.conf if possible