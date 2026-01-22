const BASE_URL = 'http://localhost:8000';

async function post(endpoint, data) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error(`Failed request to ${endpoint}: ${response.status} ${response.statusText} - ${await response.text()}`);
    }
    return response.json();
}

async function run() {
    try {
        console.log('--- SEEDING ---');

        // 1. Create Coffees
        console.log('Creating Coffees...');
        const espresso = await post('/coffees', { name: "Espresso", price: 200 });
        const latte = await post('/coffees', { name: "Latte", price: 250 });
        const cappuccino = await post('/coffees', { name: "Cappuccino", price: 300 });

        const C1 = espresso.id;
        const C2 = latte.id;
        const C3 = cappuccino.id;
        console.log(`Coffees Created: C1=${C1}, C2=${C2}, C3=${C3}`);

        // 2. Register Members
        console.log('\nRegistering Members...');
        const M1 = "M1";
        const M2 = "M2";

        await post('/members', { memberId: M1, name: "Alice", phone: "01711111111" });
        await post('/members', { memberId: M2, name: "Bob", phone: "01722222222" });
        console.log(`Members Registered: M1=${M1}, M2=${M2}`);

        // 3. Purchase for Alice (M1)
        console.log('\nPurchasing for Alice...');
        await post('/purchase', { memberId: M1, coffeeId: C1, quantity: 1 }); // 200/50 = 4 pts
        await post('/purchase', { memberId: M1, coffeeId: C2, quantity: 2 }); // 500/50 = 10 pts
        const aliceFinal = await post('/purchase', { memberId: M1, coffeeId: C3, quantity: 1 }); // 300/50 = 6 pts
        console.log(`Alice Total Points: ${aliceFinal.totalPoints} (Expected: 20)`);

        // 4. Purchase for Bob (M2)
        console.log('\nPurchasing for Bob...');
        await post('/purchase', { memberId: M2, coffeeId: C2, quantity: 1 }); // 250/50 = 5 pts
        await post('/purchase', { memberId: M2, coffeeId: C1, quantity: 2 }); // 400/50 = 8 pts
        const bobFinal = await post('/purchase', { memberId: M2, coffeeId: C3, quantity: 1 }); // 300/50 = 6 pts
        console.log(`Bob Total Points: ${bobFinal.totalPoints} (Expected: 19)`);

        // 5. Redeem for Bob
        console.log('\nRedeeming for Bob...');
        const redeemResult = await post(`/members/${M2}/redeem`, { pointsToUse: 15, price: 300 });
        console.log('Redeem Result:', redeemResult);
        console.log(`Bob Remaining Points: ${redeemResult.remainingPoints} (Expected: 4)`); // 19 - 15 = 4

        console.log('\n--- SEEDING COMPLETE ---');

    } catch (error) {
        console.error('Seeding Failed:', error.message);
    }
}

run();
