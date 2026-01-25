/**
 * Script để seed users mẫu vào database
 * Chạy: node seed-users.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const { User } = require('./models');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dating-app';

// Sample users data
const sampleUsers = [
    {
        userId: 'user2',
        firstName: 'Emma',
        birthday: new Date('1995-06-15'),
        gender: 'female',
        bio: 'Love traveling and photography 📸 Looking for someone to explore the world with!',
        images: ['https://i.pravatar.cc/300?img=5'],
        isOnline: false,
        preferences: {
            ageRange: { min: 25, max: 35 },
            maxDistance: 50,
            interestedIn: ['male']
        }
    },
    {
        userId: 'user3',
        firstName: 'Sophia',
        birthday: new Date('1997-03-22'),
        gender: 'female',
        bio: 'Coffee lover ☕ Bookworm 📚 Always up for deep conversations',
        images: ['https://i.pravatar.cc/300?img=9'],
        isOnline: false,
        preferences: {
            ageRange: { min: 23, max: 32 },
            maxDistance: 30,
            interestedIn: ['male']
        }
    },
    {
        userId: 'user4',
        firstName: 'Olivia',
        birthday: new Date('1996-11-08'),
        gender: 'female',
        bio: 'Fitness enthusiast 💪 Yoga instructor 🧘‍♀️ Living a healthy lifestyle',
        images: ['https://i.pravatar.cc/300?img=10'],
        isOnline: false,
        preferences: {
            ageRange: { min: 24, max: 34 },
            maxDistance: 40,
            interestedIn: ['male']
        }
    },
    {
        userId: 'user5',
        firstName: 'Ava',
        birthday: new Date('1998-01-30'),
        gender: 'female',
        bio: 'Artist 🎨 Music lover 🎵 Looking for creative souls',
        images: ['https://i.pravatar.cc/300?img=20'],
        isOnline: false,
        preferences: {
            ageRange: { min: 22, max: 30 },
            maxDistance: 35,
            interestedIn: ['male']
        }
    },
    {
        userId: 'user6',
        firstName: 'Isabella',
        birthday: new Date('1994-09-12'),
        gender: 'female',
        bio: 'Foodie 🍕 Chef in the making 👩‍🍳 Let\'s cook together!',
        images: ['https://i.pravatar.cc/300?img=27'],
        isOnline: false,
        preferences: {
            ageRange: { min: 26, max: 36 },
            maxDistance: 45,
            interestedIn: ['male']
        }
    },
    {
        userId: 'user7',
        firstName: 'Mia',
        birthday: new Date('1999-04-25'),
        gender: 'female',
        bio: 'Adventure seeker 🏔️ Hiking enthusiast 🥾 Nature is my therapy',
        images: ['https://i.pravatar.cc/300?img=32'],
        isOnline: false,
        preferences: {
            ageRange: { min: 21, max: 29 },
            maxDistance: 50,
            interestedIn: ['male']
        }
    },
    {
        userId: 'user8',
        firstName: 'Charlotte',
        birthday: new Date('1996-07-18'),
        gender: 'female',
        bio: 'Dog mom 🐕 Beach lover 🏖️ Sunset chaser 🌅',
        images: ['https://i.pravatar.cc/300?img=38'],
        isOnline: false,
        preferences: {
            ageRange: { min: 24, max: 33 },
            maxDistance: 40,
            interestedIn: ['male']
        }
    },
    {
        userId: 'user9',
        firstName: 'Amelia',
        birthday: new Date('1997-12-05'),
        gender: 'female',
        bio: 'Tech geek 💻 Gamer 🎮 Netflix binge-watcher 📺',
        images: ['https://i.pravatar.cc/300?img=45'],
        isOnline: false,
        preferences: {
            ageRange: { min: 23, max: 31 },
            maxDistance: 35,
            interestedIn: ['male']
        }
    },
    {
        userId: 'user10',
        firstName: 'Harper',
        birthday: new Date('1995-02-14'),
        gender: 'female',
        bio: 'Fashion designer 👗 Style enthusiast 💄 Life is a runway',
        images: ['https://i.pravatar.cc/300?img=48'],
        isOnline: false,
        preferences: {
            ageRange: { min: 25, max: 35 },
            maxDistance: 50,
            interestedIn: ['male']
        }
    }
];

async function seedUsers() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        console.log('🗑️  Clearing existing users (except user1)...');
        await User.deleteMany({ userId: { $ne: 'user1' } });
        console.log('✅ Cleared existing users');

        console.log('➕ Adding sample users...');
        for (const userData of sampleUsers) {
            const user = new User(userData);
            await user.save();
            console.log(`   ✓ Added ${userData.firstName} (${userData.userId})`);
        }

        console.log(`\n🎉 Successfully seeded ${sampleUsers.length} users!`);
        console.log('\n📊 Database now contains:');
        const totalUsers = await User.countDocuments({});
        console.log(`   Total users: ${totalUsers}`);

        const allUsers = await User.find({}).select('userId firstName gender');
        console.log('\n👥 Users in database:');
        allUsers.forEach(user => {
            console.log(`   - ${user.firstName} (${user.userId}) - ${user.gender}`);
        });

        console.log('\n✅ Seeding completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding users:', error);
        process.exit(1);
    }
}

// Run the seed function
seedUsers();
