const mongoose = require('mongoose');

/**
 * Cấu hình kết nối MongoDB cho Dating App
 * 
 * File này xử lý việc kết nối đến MongoDB database và setup các event listeners
 * để theo dõi trạng thái kết nối
 */

/**
 * Kết nối đến MongoDB database
 * @returns {Promise} Promise resolve khi kết nối thành công
 */
const connectDB = async () => {
  try {
    // Lấy MongoDB URI từ environment variables
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dating-app';
    
    console.log('🔄 Đang kết nối đến MongoDB...');
    
    // Kết nối đến MongoDB với các options tối ưu
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`✅ MongoDB kết nối thành công: ${conn.connection.host}`);
    console.log(`📊 Database name: ${conn.connection.name}`);
    
    // Log các collections đã tồn tại
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📁 Collections hiện có: ${collections.map(c => c.name).join(', ') || 'Chưa có collections'}`);
    
    return conn;
  } catch (error) {
    console.error('❌ Lỗi kết nối MongoDB:', error.message);
    
    // Thoát process nếu không thể kết nối
    process.exit(1);
  }
};

/**
 * Setup các event listeners cho MongoDB connection
 */
const setupConnectionEvents = () => {
  // Khi kết nối bị ngắt
  mongoose.connection.on('disconnected', () => {
    console.log('⚠️  MongoDB connection disconnected');
  });
  
  // Khi có lỗi kết nối
  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err);
  });
  
  // Khi kết nối được khôi phục
  mongoose.connection.on('reconnected', () => {
    console.log('🔄 MongoDB reconnected');
  });
  
  // Graceful shutdown khi app bị terminate
  process.on('SIGINT', async () => {
    try {
      await mongoose.connection.close();
      console.log('🛑 MongoDB connection closed through app termination');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during MongoDB disconnection:', error);
      process.exit(1);
    }
  });
};

/**
 * Kiểm tra trạng thái kết nối database
 * @returns {Object} Thông tin về trạng thái kết nối
 */
const getConnectionStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected', 
    2: 'connecting',
    3: 'disconnecting'
  };
  
  return {
    status: states[mongoose.connection.readyState],
    host: mongoose.connection.host,
    name: mongoose.connection.name,
    collections: mongoose.connection.collections ? Object.keys(mongoose.connection.collections) : []
  };
};

/**
 * Tạo các collections cần thiết nếu chưa tồn tại
 * Đảm bảo 3 collections chính: users, swipes, matches
 */
const ensureCollections = async () => {
  try {
    const db = mongoose.connection.db;
    const existingCollections = await db.listCollections().toArray();
    const existingNames = existingCollections.map(c => c.name);
    
    const requiredCollections = ['users', 'swipes', 'matches'];
    
    console.log('📋 Kiểm tra collections cần thiết...');
    
    for (const collectionName of requiredCollections) {
      if (!existingNames.includes(collectionName)) {
        await db.createCollection(collectionName);
        console.log(`✅ Tạo collection '${collectionName}' thành công`);
      } else {
        console.log(`✓ Collection '${collectionName}' đã tồn tại`);
      }
    }
    
    console.log('🎉 Tất cả collections đã sẵn sàng!');
    
    // Trả về thông tin collections
    return {
      required: requiredCollections,
      existing: existingNames,
      created: requiredCollections.filter(name => !existingNames.includes(name))
    };
    
  } catch (error) {
    console.error('❌ Lỗi khi tạo collections:', error.message);
    throw error;
  }
};

module.exports = {
  connectDB,
  setupConnectionEvents,
  getConnectionStatus,
  ensureCollections
};