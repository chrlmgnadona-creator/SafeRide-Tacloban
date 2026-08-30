const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize SQLite Database File
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error('Database connection failed:', err.message);
    } else {
        console.log('Connected to SQLite database: database.sqlite');
    }
});

// Create Tables Automatically
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        location TEXT NOT NULL,
        description TEXT NOT NULL,
        photo_url TEXT DEFAULT NULL,
        user_email TEXT NOT NULL,
        status TEXT DEFAULT 'Pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

// --- API ROUTES ---
app.get('/api/reports', (req, res) => {
    db.all('SELECT * FROM reports ORDER BY created_at DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/reports', (req, res) => {
    const { category, location, description, user_email, photo_url } = req.body;
    const query = `INSERT INTO reports (category, location, description, user_email, photo_url, status) VALUES (?, ?, ?, ?, ?, 'Pending')`;
    db.run(query, [category, location, description, user_email, photo_url || null], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Report submitted successfully', reportId: this.lastID });
    });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Charlemagne Server running on port ${PORT}`);
});
