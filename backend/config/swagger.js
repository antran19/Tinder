const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '🔥 Dating App API',
      version: '2.0.0',
      description: `
## Tinder Clone — RESTful API Documentation

Dating application backend API với đầy đủ tính năng:
- 🔐 Authentication (JWT)
- 👤 User Management
- 💫 Swipe (Like/Pass/Super Like/Rewind)
- 💬 Real-time Chat (Socket.io)
- 📖 Stories 24h
- 🎁 Virtual Gifts
- ⚡ Profile Boost
- 💎 Premium/Gold Subscriptions
- 🛡️ Admin Dashboard
- 📊 Smart Match AI

**Base URL:** \`http://localhost:5000/api\`
      `,
      contact: { name: 'Dating App Team' },
      license: { name: 'MIT' }
    },
    servers: [
      { url: 'http://localhost:5000', description: 'Development' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            userId: { type: 'string', example: 'user1' },
            firstName: { type: 'string', example: 'Minh' },
            gender: { type: 'string', enum: ['male', 'female'] },
            birthday: { type: 'string', format: 'date' },
            bio: { type: 'string', example: 'Yêu du lịch và cafe ☕' },
            images: { type: 'array', items: { type: 'string' } },
            interests: { type: 'array', items: { type: 'string' } },
            isVerified: { type: 'boolean' },
            isOnline: { type: 'boolean' },
            musicProfile: {
              type: 'object',
              properties: {
                anthem: { type: 'object', properties: {
                  title: { type: 'string' }, artist: { type: 'string' }
                }},
                topArtists: { type: 'array', items: { type: 'string' } },
                genre: { type: 'string' }
              }
            }
          }
        },
        Swipe: {
          type: 'object',
          properties: {
            fromUserId: { type: 'string' },
            toUserId: { type: 'string' },
            type: { type: 'string', enum: ['like', 'pass', 'super_like'] }
          }
        },
        Match: {
          type: 'object',
          properties: {
            user1Id: { type: 'string' },
            user2Id: { type: 'string' },
            matchedAt: { type: 'string', format: 'date-time' }
          }
        },
        Message: {
          type: 'object',
          properties: {
            matchId: { type: 'string' },
            senderId: { type: 'string' },
            content: { type: 'string' },
            type: { type: 'string', enum: ['text', 'image', 'emoji', 'gift', 'icebreaker'] }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['userId', 'password'],
          properties: {
            userId: { type: 'string', example: 'user1' },
            password: { type: 'string', example: '123456' }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { type: 'object' }
          }
        }
      }
    },
    tags: [
      { name: 'Auth', description: '🔐 Đăng ký, đăng nhập, đổi mật khẩu' },
      { name: 'Users', description: '👤 Quản lý hồ sơ người dùng' },
      { name: 'Swipes', description: '💫 Like, Pass, Super Like, Rewind' },
      { name: 'Matches', description: '💕 Danh sách match' },
      { name: 'Messages', description: '💬 Chat real-time' },
      { name: 'Stories', description: '📖 Stories 24h' },
      { name: 'Boost', description: '⚡ Profile Boost' },
      { name: 'Premium', description: '💎 Subscription tiers' },
      { name: 'Gifts', description: '🎁 Virtual Gifts' },
      { name: 'Reports', description: '🚫 Block & Report' },
      { name: 'Notifications', description: '🔔 Thông báo' },
      { name: 'Admin', description: '🛡️ Admin Dashboard' },
      { name: 'Upload', description: '📸 Upload files' },
      { name: 'Insights', description: '📊 User Insights' },
      { name: 'Smart Match', description: '🤖 AI Matching' },
    ]
  },
  apis: ['./routes/*.js'],
};

const specs = swaggerJsdoc(options);

const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    customCss: `
      .swagger-ui .topbar { background: linear-gradient(135deg, #fd267a, #ff6036); }
      .swagger-ui .topbar .download-url-wrapper .select-label select { border-color: white; }
      .swagger-ui .info .title { color: #fd267a; }
    `,
    customSiteTitle: '🔥 Dating App — API Docs',
    customfavIcon: 'https://cdn-icons-png.flaticon.com/512/3670/3670382.png',
  }));

  // JSON endpoint
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
};

module.exports = { setupSwagger };
