# PHP School Tender Finder

This directory holds the core PHP classes and SQL schema for the project. The main web interface lives in the repository root at `index.php`.

## Requirements

- PHP 8.0 or newer
- MySQL (or MariaDB)

Environment variables for database connection:

- `DB_DSN` – e.g. `mysql:host=localhost;dbname=school_finder;charset=utf8mb4`
- `DB_USER` – database user
- `DB_PASS` – database password

### Database Initialization

Import `schema.sql` before running the app:

```bash
mysql -u <user> -p -e "CREATE DATABASE school_finder CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u <user> -p school_finder < schema.sql
```

The tables mirror those from the previous Node.js version and store schools, tenders and scan sessions.
