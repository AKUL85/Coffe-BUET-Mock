const express = require('express');
const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

const PORT = 3003;

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

app.post('/purchase', async (req, res) => {
    const { memberId, coffeeId, quantity } = req.body;

    if (!memberId || !coffeeId || !quantity || typeof quantity !== 'number' || quantity <= 0 || !Number.isInteger(quantity)) {
        return res.status(400).json({ error: 'Invalid input' });
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [members] = await connection.query('SELECT * FROM members WHERE memberId = ?', [memberId]);
        if (members.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Member not found' });
        }
        const member = members[0];

        const [coffees] = await connection.query('SELECT * FROM coffees WHERE id = ?', [coffeeId]);
        if (coffees.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Coffee not found' });
        }
        const coffee = coffees[0];

        const totalAmount = coffee.price * quantity;
        const pointsEarned = Math.floor(totalAmount / 50);
        const purchaseId = uuidv4();

        await connection.query(
            'INSERT INTO purchases (purchaseId, memberId, coffeeId, quantity, totalAmount, pointsEarned) VALUES (?, ?, ?, ?, ?, ?)',
            [purchaseId, memberId, coffeeId, quantity, totalAmount, pointsEarned]
        );

        const newTotalPoints = member.points + pointsEarned;
        await connection.query('UPDATE members SET points = ? WHERE memberId = ?', [newTotalPoints, memberId]);

        await connection.query(
            'INSERT INTO point_transactions (memberId, type, amount, refId) VALUES (?, ?, ?, ?)',
            [memberId, 'EARN', pointsEarned, purchaseId]
        );

        await connection.commit();

        res.status(200).json({
            purchaseId,
            memberId,
            coffeeId,
            quantity,
            totalAmount,
            pointsEarned,
            totalPoints: newTotalPoints
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
    console.log(`Purchase Service running on port ${PORT}`);
});
