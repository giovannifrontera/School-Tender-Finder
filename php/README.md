# PHP Version of School Tender Finder

This directory provides a lightweight PHP implementation of a few API endpoints from the original Node.js server. It is designed for deployment on shared hosting services such as Aruba that typically offer PHP and MySQL.

## Requirements

- PHP 8.0 or newer
- MySQL (or MariaDB) database

Environment variables used for database connection:

- `DB_DSN` – e.g. `mysql:host=localhost;dbname=tenderfinder;charset=utf8mb4`
- `DB_USER` – database user
- `DB_PASS` – database password

### Database Initialization

The file `schema.sql` in this directory contains the SQL statements to create
the MySQL tables. Execute it once against your database before running the PHP
endpoints:

```bash
mysql -u <user> -p <database> < schema.sql
```

## Endpoints

- `POST /api/schools` – upload a CSV file named `file` containing school data. Basic columns supported: `codiceMeccanografico`, `denominazioneScuola`, `indirizzoEmail`, `sitoWeb`.
- `GET /api/schools` – fetch all schools.
- `GET /api/tenders` – fetch all tenders.

This is a simplified port and does not cover all features of the Node.js application, but it demonstrates how similar functionality can be implemented using PHP.
