const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const checkIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dating-app');
    console.log('Connected to MongoDB');
    
    const User = mongoose.model('User', new mongoose.Schema({}));
    const indexes = await User.collection.indexes();
    console.log('User model indexes:');
    console.log(JSON.stringify(indexes, null, 2));
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
};

checkIndexes();
