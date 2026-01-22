const express = require('express');
const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

const PORT = 3001;

const dbConfig = {
    host: process.env.DB_HOST || 'db',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'coffee_shop',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

let pool;

async function initDb() {
    try {
        pool = mysql.createPool(dbConfig);
        console.log('Database pool created');
    } catch (err) {
        console.error('Failed to create database pool:', err);
        process.exit(1);
    }
}

initDb();

app.post('/coffees', async (req, res) => {
    const { name, price } = req.body;

    if (!name || typeof name !== 'string' || !price || typeof price !== 'number' || price <= 0 || !Number.isInteger(price)) {
        return res.status(400).json({ error: 'Invalid input' });
    }

    try {
        const id = uuidv4();
        await pool.query('INSERT INTO coffees (id, name, price) VALUES (?, ?, ?)', [id, name, price]);
        res.status(200).json({ id, name, price });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Coffee name must be unique' });
        }
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Coffee Service running on port ${PORT}`);
});
