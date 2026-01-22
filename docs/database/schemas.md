# Database Schema

## Tables

### 1. coffees
Stores available coffee items.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | VARCHAR(255) | PRIMARY KEY, NOT NULL | Unique identifier (UUID or similar implied) |
| name | VARCHAR(255) | UNIQUE, NOT NULL | Name of the coffee |
| price | INT | NOT NULL, CHECK (price > 0) | Price per unit, must be positive |

### 2. members
Stores member information and points.

| Column | Type | Constraints | Description |
|---|---|---|---|
| memberId | VARCHAR(255) | PRIMARY KEY, NOT NULL | Unique member ID provided by client |
| name | VARCHAR(255) | NOT NULL | Member name |
| phone | VARCHAR(50) | UNIQUE, NOT NULL | Unique phone number |
| points | INT | DEFAULT 0, CHECK (points >= 0) | Current point balance |

### 3. purchases
Records purchase history.

| Column | Type | Constraints | Description |
|---|---|---|---|
| purchaseId | VARCHAR(255) | PRIMARY KEY, NOT NULL | Unique purchase ID |
| memberId | VARCHAR(255) | FOREIGN KEY -> members(memberId) | Member who made the purchase |
| coffeeId | VARCHAR(255) | FOREIGN KEY -> coffees(id) | Coffee item purchased |
| quantity | INT | NOT NULL, CHECK (quantity > 0) | Quantity purchased |
| totalAmount | INT | NOT NULL | Total cost (price * quantity) |
| pointsEarned | INT | NOT NULL | Points awarded for this purchase |
| timestamp | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Time of purchase |

### 4. point_transactions
Ledger for point changes (earning and redeeming).

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Internal ID |
| memberId | VARCHAR(255) | FOREIGN KEY -> members(memberId) | Member involved |
| type | ENUM('EARN', 'REDEEM') | NOT NULL | Type of transaction |
| amount | INT | NOT NULL, CHECK (amount > 0) | Amount of points involved |
| refId | VARCHAR(255) | NULL | Reference ID (e.g., purchaseId) |
| timestamp | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Time of transaction |

## Relationships
- `purchases.memberId` -> `members.memberId`
- `purchases.coffeeId` -> `coffees.id`
- `point_transactions.memberId` -> `members.memberId`
