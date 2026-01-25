/**
 * Script để xóa tất cả swipes của user1
 * Chạy: node clear-swipes.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const { Swipe } = require('./models');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dating-app';

async function clearSwipes() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        console.log('🗑️  Clearing swipes for user1...');
        const result = await Swipe.deleteMany({ fromUserId: 'user1' });
        console.log(`✅ Deleted ${result.deletedCount} swipes for user1`);

        console.log('\n✅ Clearing completed successfully!');
        console.log('Now user1 can swipe all available users again.');

        process.exit(0);

    } catch (error) {
        console.error('❌ Error clearing swipes:', error);
        process.exit(1);
    }
}

// Run the clear function
clearSwipes();
