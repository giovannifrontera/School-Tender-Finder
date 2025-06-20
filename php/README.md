# PHP Version of School Tender Finder

This directory provides a lightweight PHP implementation of selected API endpoints. It is designed for deployment on shared hosting services such as Aruba that typically offer PHP and MySQL.

## Requirements

- PHP 8.0 or newer
- MySQL (or MariaDB) database

Environment variables used for database connection (assuming MySQL via XAMPP on localhost):

- `DB_DSN` – e.g. `mysql:host=localhost;dbname=school_finder;charset=utf8mb4`
- `DB_USER` – database user
- `DB_PASS` – database password

### Database Initialization

The file `schema.sql` in this directory contains the SQL statements to create
the MySQL tables. Create the database before importing it. For example:

```bash
mysql -u <user> -p -e "CREATE DATABASE school_finder CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u <user> -p school_finder < schema.sql
```

## Endpoints

- `POST /api/schools` – upload a CSV file named `file` containing school data. Basic columns supported: `codiceMeccanografico`, `denominazioneScuola`, `indirizzoEmail`, `sitoWeb`.
- `GET /api/schools` – fetch all schools.
- `GET /api/tenders` – fetch all tenders.

This is a simplified version and does not cover all features of the original application, but it demonstrates how similar functionality can be implemented using PHP.
