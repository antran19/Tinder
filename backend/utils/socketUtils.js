/**
 * Socket.io Utility Functions
 * 
 * Tập trung các helper functions để emit Socket.io events từ các routes khác
 * Đặc biệt quan trọng cho việc gửi match notifications real-time
 */

/**
 * Emit match notification cho cả hai users khi có match mới
 * 
 * @param {Object} matchData - Thông tin match mới được tạo
 * @param {Array} matchData.participants - Array chứa 2 userIds
 * @param {String} matchData._id - Match ID
 * @param {Date} matchData.createdAt - Thời gian tạo match
 */
const emitMatchNotification = (matchData) => {
  try {
    // Kiểm tra xem global.io có tồn tại không
    if (!global.io) {
      console.warn('⚠️ Socket.io instance not available for match notification');
      return;
    }

    const { participants, _id, createdAt } = matchData;

    if (!participants || participants.length !== 2) {
      console.error('❌ Invalid match data: participants must be array of 2 userIds');
      return;
    }

    const [userId1, userId2] = participants;

    console.log(`🎉 Emitting match notification for users: ${userId1} and ${userId2}`);

    // Tạo notification data cho cả hai users
    const notificationData = {
      matchId: _id,
      participants: participants,
      matchedWith: null, // Sẽ được set khác nhau cho mỗi user
      createdAt: createdAt,
      message: "It's a Match! 🎉"
    };

    // Emit cho user 1 (matchedWith là user 2)
    const notification1 = {
      ...notificationData,
      matchedWith: userId2
    };
    global.io.to(userId1).emit('new-match', notification1);

    // Emit cho user 2 (matchedWith là user 1)
    const notification2 = {
      ...notificationData,
      matchedWith: userId1
    };
    global.io.to(userId2).emit('new-match', notification2);

    console.log(`✅ Match notifications sent successfully`);

  } catch (error) {
    console.error('❌ Error emitting match notification:', error);
  }
};

/**
 * Emit user online status update
 * 
 * @param {String} userId - ID của user
 * @param {Boolean} isOnline - Trạng thái online/offline
 */
const emitUserStatusUpdate = (userId, isOnline) => {
  try {
    if (!global.io) {
      console.warn('⚠️ Socket.io instance not available for user status update');
      return;
    }

    console.log(`📡 Broadcasting user status: ${userId} is ${isOnline ? 'online' : 'offline'}`);

    // Broadcast cho tất cả clients (trừ user đó)
    global.io.emit('user-status-update', {
      userId: userId,
      isOnline: isOnline,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error emitting user status update:', error);
  }
};

/**
 * Get Socket.io server statistics
 * 
 * @returns {Object} Thống kê về Socket.io server
 */
const getSocketStats = () => {
  try {
    if (!global.io) {
      return {
        enabled: false,
        connectedClients: 0,
        rooms: []
      };
    }

    return {
      enabled: true,
      connectedClients: global.io.engine.clientsCount || 0,
      rooms: Array.from(global.io.sockets.adapter.rooms.keys())
    };

  } catch (error) {
    console.error('❌ Error getting socket stats:', error);
    return {
      enabled: false,
      connectedClients: 0,
      rooms: [],
      error: error.message
    };
  }
};

/**
 * Emit custom event tới specific user
 * 
 * @param {String} userId - ID của user nhận event
 * @param {String} eventName - Tên event
 * @param {Object} data - Data gửi kèm
 */
const emitToUser = (userId, eventName, data) => {
  try {
    if (!global.io) {
      console.warn('⚠️ Socket.io instance not available');
      return false;
    }

    console.log(`📡 Emitting ${eventName} to user ${userId}`);
    global.io.to(userId).emit(eventName, data);
    return true;

  } catch (error) {
    console.error(`❌ Error emitting ${eventName} to user ${userId}:`, error);
    return false;
  }
};

/**
 * Broadcast event tới tất cả connected clients
 * 
 * @param {String} eventName - Tên event
 * @param {Object} data - Data gửi kèm
 */
const broadcastToAll = (eventName, data) => {
  try {
    if (!global.io) {
      console.warn('⚠️ Socket.io instance not available');
      return false;
    }

    console.log(`📡 Broadcasting ${eventName} to all clients`);
    global.io.emit(eventName, data);
    return true;

  } catch (error) {
    console.error(`❌ Error broadcasting ${eventName}:`, error);
    return false;
  }
};

/**
 * Emit unmatch notification
 * @param {String} userId1 
 * @param {String} userId2 
 * @param {String} matchId 
 */
const emitMatchUnmatched = (userId1, userId2, matchId) => {
  try {
    if (!global.io) return;

    const data = { matchId, type: 'match_unmatched' };

    // Báo cho cả 2 user biết để xóa chat khỏi giao diện
    global.io.to(userId1).emit('match-removed', data);
    global.io.to(userId2).emit('match-removed', data);

    console.log(`📡 Emitted match-removed for match ${matchId}`);
  } catch (error) {
    console.error('Error emitting unmatch:', error);
  }
};

module.exports = {
  emitMatchNotification,
  emitUserStatusUpdate,
  getSocketStats,
  emitToUser,
  broadcastToAll,
  emitMatchUnmatched
};