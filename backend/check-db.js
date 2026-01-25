/**
 * Script để kiểm tra database
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const { User, Swipe } = require('./models');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dating-app';

async function checkDatabase() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Count all users
        const totalUsers = await User.countDocuments({});
        console.log(`📊 Total users in database: ${totalUsers}`);

        // List all users
        const allUsers = await User.find({}).select('userId firstName gender');
        console.log('\n👥 All users:');
        allUsers.forEach(user => {
            console.log(`   - ${user.firstName} (${user.userId}) - ${user.gender}`);
        });

        // Count swipes for user1
        const swipesCount = await Swipe.countDocuments({ fromUserId: 'user1' });
        console.log(`\n📝 Swipes by user1: ${swipesCount}`);

        // Get available users for user1
        const swipedUserIds = await Swipe.find({ fromUserId: 'user1' }).distinct('toUserId');
        const excludeUserIds = [...swipedUserIds, 'user1'];
        const availableUsers = await User.find({
            userId: { $nin: excludeUserIds }
        }).select('userId firstName gender');

        console.log(`\n✨ Available users for user1: ${availableUsers.length}`);
        availableUsers.forEach(user => {
            console.log(`   - ${user.firstName} (${user.userId}) - ${user.gender}`);
        });

        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkDatabase();
