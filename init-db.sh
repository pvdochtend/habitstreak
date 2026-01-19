#!/bin/bash
set -e

# Create the production database (dev database is created by POSTGRES_DB env var)
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE habitstreak;
    GRANT ALL PRIVILEGES ON DATABASE habitstreak TO habitstreak;
EOSQL
