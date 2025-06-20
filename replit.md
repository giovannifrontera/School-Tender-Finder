# replit.md

## Overview

School Tender Finder is now a lightweight PHP web application. It lets you upload a CSV of schools and view stored tenders without any separate API server.

## System Architecture

- **Runtime**: PHP 8 built-in server
- **Database**: MySQL (or MariaDB) accessed via PDO

### Directory Structure
```
index.php        # main entrypoint with HTML interface
php/             # database helper and schema
```

### Running Locally

```bash
php -S localhost:80 index.php
```

Load the address in your browser to upload data and browse the tables.

### Database Setup

Create a database and import `php/schema.sql` before running the app.

## User Preferences

Preferred communication style: Simple, everyday language.
