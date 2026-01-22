CREATE TABLE IF NOT EXISTS coffees (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    price INT NOT NULL CHECK (price > 0)
);

CREATE TABLE IF NOT EXISTS members (
    memberId VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) UNIQUE NOT NULL,
    points INT DEFAULT 0 CHECK (points >= 0)
);

CREATE TABLE IF NOT EXISTS purchases (
    purchaseId VARCHAR(255) PRIMARY KEY,
    memberId VARCHAR(255) NOT NULL,
    coffeeId VARCHAR(255) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    totalAmount INT NOT NULL,
    pointsEarned INT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (memberId) REFERENCES members(memberId),
    FOREIGN KEY (coffeeId) REFERENCES coffees(id)
);

CREATE TABLE IF NOT EXISTS point_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    memberId VARCHAR(255) NOT NULL,
    type ENUM('EARN', 'REDEEM') NOT NULL,
    amount INT NOT NULL CHECK (amount > 0),
    refId VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (memberId) REFERENCES members(memberId)
);
