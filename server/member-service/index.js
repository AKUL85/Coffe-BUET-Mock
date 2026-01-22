const express = require('express');
const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

const PORT = 3002;

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

app.post('/members', async (req, res) => {
    const { memberId, name, phone } = req.body;

    if (!memberId || typeof memberId !== 'string' || !name || typeof name !== 'string' || !phone || typeof phone !== 'string') {
        return res.status(400).json({ error: 'Invalid input' });
    }

    try {
        await pool.query('INSERT INTO members (memberId, name, phone, points) VALUES (?, ?, ?, 0)', [memberId, name, phone]);
        res.status(200).json({ memberId, name, phone, points: 0 });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Duplicate memberId or phone' });
        }
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/members/:memberId/redeem', async (req, res) => {
    const { memberId } = req.params;
    const { pointsToUse, price } = req.body;

    if (!memberId || pointsToUse === undefined || price === undefined ||
        pointsToUse < 0 || price < 0 ||
        !Number.isInteger(pointsToUse) || !Number.isInteger(price)) {
        return res.status(400).json({ error: 'Invalid input' });
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [members] = await connection.query('SELECT * FROM members WHERE memberId = ? FOR UPDATE', [memberId]);
        if (members.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Member not found' });
        }
        const member = members[0];

        if (pointsToUse > member.points) {
            await connection.rollback();
            return res.status(400).json({ error: 'Insufficient points' });
        }

        const discountAmount = Math.min(pointsToUse, price);
        const discountedPrice = price - discountAmount;
        const usedPoints = discountAmount;
        const remainingPoints = member.points - usedPoints;

        await connection.query('UPDATE members SET points = ? WHERE memberId = ?', [remainingPoints, memberId]);

        await connection.query(
            'INSERT INTO point_transactions (memberId, type, amount, refId) VALUES (?, ?, ?, ?)',
            [memberId, 'REDEEM', usedPoints, null]
        );

        await connection.commit();

        res.status(200).json({
            memberId,
            usedPoints,
            discountAmount,
            discountedPrice,
            remainingPoints
        });

    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        connection.release();
    }
});

app.listen(PORT, () => {
    console.log(`Member Service running on port ${PORT}`);
});
