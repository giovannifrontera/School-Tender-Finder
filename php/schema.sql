CREATE TABLE IF NOT EXISTS schools (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codice_meccanografico VARCHAR(255) NOT NULL UNIQUE,
    denominazione_scuola VARCHAR(255) NOT NULL,
    codice_istituto_riferimento VARCHAR(255),
    denominazione_istituto_riferimento VARCHAR(255),
    indirizzo_email VARCHAR(255),
    sito_web VARCHAR(255),
    indirizzo VARCHAR(255),
    cap VARCHAR(10),
    comune VARCHAR(255),
    provincia VARCHAR(255),
    regione VARCHAR(255),
    area_geografica VARCHAR(255),
    tipo_istituto VARCHAR(255),
    detected_platforms JSON DEFAULT (JSON_ARRAY())
);

CREATE TABLE IF NOT EXISTS tenders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    excerpt TEXT,
    deadline VARCHAR(255),
    type VARCHAR(255) NOT NULL,
    platform VARCHAR(255) NOT NULL,
    pdf_url VARCHAR(255),
    source_url VARCHAR(255),
    hash VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS scan_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    status VARCHAR(255) NOT NULL DEFAULT 'pending',
    total_schools INT NOT NULL,
    completed_schools INT DEFAULT 0,
    total_tenders INT DEFAULT 0,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    progress JSON DEFAULT (JSON_OBJECT())
);
