const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Create MySQL Connection Pool
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test Database Connection
db.getConnection((err, connection) => {
    if (err) {
        console.error('Database connection failed:', err.message);
    } else {
        console.log('Connected to MySQL database: saferide_tacloban');
        connection.release();
    }
});

// --- AUTHENTICATION ENDPOINTS ---

// Register User
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = 'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)';
        db.query(query, [name, email, hashedPassword, 'user'], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Email already registered.' });
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ message: 'User registered successfully', user: { name, email, role: 'user' } });
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error during registration.' });
    }
});

// Login User
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const query = 'SELECT * FROM users WHERE email = ?';
    
    db.query(query, [email], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(401).json({ error: 'Invalid email or password.' });

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid email or password.' });

        const token = jwt.sign({ email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ message: 'Login successful', token, user: { name: user.name, email: user.email, role: user.role } });
    });
});

// --- REPORTS ENDPOINTS ---

// Get All Community Reports
app.get('/api/reports', (req, res) => {
    const query = 'SELECT * FROM reports ORDER BY created_at DESC';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Submit New Report
app.post('/api/reports', (req, res) => {
    const { category, location, description, user_email, photo_url } = req.body;
    const query = 'INSERT INTO reports (category, location, description, user_email, photo_url, status) VALUES (?, ?, ?, ?, ?, ?)';
    
    db.query(query, [category, location, description, user_email, photo_url || null, 'Pending'], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Report submitted successfully', reportId: result.insertId });
    });
});

// Delete Personal Report
app.delete('/api/reports/:id', (req, res) => {
    const reportId = req.params.id;
    const query = 'DELETE FROM reports WHERE id = ?';
    db.query(query, [reportId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Report deleted successfully' });
    });
});

// Admin Update Report Status
app.patch('/api/reports/:id/status', (req, res) => {
    const reportId = req.params.id;
    const { status } = req.body;
    const query = 'UPDATE reports SET status = ? WHERE id = ?';
    
    db.query(query, [status, reportId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Report status updated successfully' });
    });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`SafeRide-Tacloban backend running on port ${PORT}`);
});
