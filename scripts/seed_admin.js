/**
 * Seed Super Admin User
 * 
 * Usage:
 *   MONGODB_URI=mongodb://... node scripts/seed_admin.js [email] [password]
 * 
 * Examples:
 *   MONGODB_URI=mongodb://localhost:27017 node scripts/seed_admin.js admin@company.com SecurePass123!
 *   
 * If no arguments provided, defaults to:
 *   Email:    admin@finmodel.com
 *   Password: Admin123!
 */

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const DEFAULT_EMAIL = 'admin@finmodel.com';
const DEFAULT_PASSWORD = 'Admin123!';

async function seed() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('❌ MONGODB_URI environment variable is required');
        console.error('   Usage: MONGODB_URI=mongodb://... node scripts/seed_admin.js [email] [password]');
        process.exit(1);
    }

    const email = process.argv[2] || DEFAULT_EMAIL;
    const password = process.argv[3] || DEFAULT_PASSWORD;

    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db('fin-model');
        const users = db.collection('users');

        const existing = await users.findOne({ email });

        if (existing) {
            // Update existing user to super_admin
            const hashedPassword = await bcrypt.hash(password, 10);
            await users.updateOne(
                { email },
                { $set: { role: 'super_admin', status: 'active', password: hashedPassword } }
            );
            console.log(`✅ Updated existing user to super_admin: ${email}`);
        } else {
            // Create new super_admin user
            const hashedPassword = await bcrypt.hash(password, 10);
            await users.insertOne({
                email,
                password: hashedPassword,
                name: 'Super Admin',
                role: 'super_admin',
                status: 'active',
                createdAt: new Date()
            });
            console.log(`✅ Created super_admin user: ${email}`);
        }

        console.log(`   Password: ${password}`);
        console.log('');
        console.log('   You can now log in with these credentials.');
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await client.close();
    }
}

seed();
