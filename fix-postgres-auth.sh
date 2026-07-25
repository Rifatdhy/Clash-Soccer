#!/bin/bash

# Script to fix PostgreSQL authentication for Clash.Soccer project

echo "=========================================="
echo "PostgreSQL Authentication Fix Script"
echo "=========================================="
echo ""

# Find PostgreSQL version and config location
PG_VERSION=$(psql --version | grep -oP '\d+' | head -1)
PG_HBA_CONF="/etc/postgresql/${PG_VERSION}/main/pg_hba.conf"

if [ ! -f "$PG_HBA_CONF" ]; then
    echo "Finding PostgreSQL config..."
    PG_HBA_CONF=$(sudo find /etc/postgresql -name pg_hba.conf 2>/dev/null | head -1)
fi

if [ ! -f "$PG_HBA_CONF" ]; then
    echo "Error: Could not find pg_hba.conf"
    echo "Please locate it manually and edit it to change:"
    echo "  local   all             all                                     peer"
    echo "to:"
    echo "  local   all             all                                     md5"
    echo ""
    echo "And add this line if not present:"
    echo "  host    all             all             127.0.0.1/32            md5"
    exit 1
fi

echo "Found PostgreSQL config: $PG_HBA_CONF"
echo ""

# Backup original config
echo "Creating backup..."
sudo cp "$PG_HBA_CONF" "${PG_HBA_CONF}.backup.$(date +%Y%m%d_%H%M%S)"

# Check if changes are already applied
if sudo grep -q "^host.*127.0.0.1/32.*md5" "$PG_HBA_CONF" && sudo grep -q "^local.*all.*all.*md5" "$PG_HBA_CONF"; then
    echo "Authentication is already configured correctly!"
    echo ""
    echo "Setting postgres user password..."
    sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"
    echo ""
    echo "Restarting PostgreSQL..."
    sudo systemctl restart postgresql
    echo ""
    echo "Done! Try running the application now."
    exit 0
fi

echo "Updating authentication settings..."

# Add md5 authentication for localhost connections if not present
if ! sudo grep -q "^host.*127.0.0.1/32.*md5" "$PG_HBA_CONF"; then
    echo "Adding localhost md5 authentication..."
    sudo sed -i '/^# IPv4 local connections:/a host    all             all             127.0.0.1/32            md5' "$PG_HBA_CONF"
fi

# Change peer to md5 for local connections
echo "Changing local authentication to md5..."
sudo sed -i 's/^local\s\+all\s\+all\s\+peer$/local   all             all                                     md5/' "$PG_HBA_CONF"

# Set postgres user password
echo ""
echo "Setting postgres user password to 'postgres'..."
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"

# Restart PostgreSQL
echo ""
echo "Restarting PostgreSQL service..."
sudo systemctl restart postgresql

echo ""
echo "=========================================="
echo "Configuration completed successfully!"
echo "=========================================="
echo ""
echo "You can now run: npm run dev"
echo "And the application should connect to the database."
echo ""
echo "If you still have issues, check:"
echo "  sudo systemctl status postgresql"
echo "  sudo tail -f /var/log/postgresql/postgresql-${PG_VERSION}-main.log"