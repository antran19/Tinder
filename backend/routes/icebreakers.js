const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Icebreaker templates - câu mở đầu theo categories
const ICEBREAKER_TEMPLATES = {
    // Dựa trên sở thích chung
    common_interest: [
        "Mình thấy bạn cũng thích {interest}! Bạn hay {interest} ở đâu vậy? 😊",
        "Wow, cả hai mình đều thích {interest}! Kể mình nghe thêm đi! 🌟",
        "Cùng đam mê {interest} luôn! Bạn bắt đầu từ khi nào vậy? 🤩",
        "{interest} fan detected! 🎯 Bạn có tip gì hay không?",
        "Cuối tuần bạn có hay đi {interest} không? Mình tìm bạn đồng hành nè 🙌"
    ],
    // Dựa trên nghề nghiệp
    occupation: [
        "Làm {occupation} nghe thú vị ghê! Điều gì bạn thích nhất trong công việc? 💼",
        "Mình tò mò về nghề {occupation} lắm! Kể mình nghe nha 🤓",
        "Một ngày của {occupation} như thế nào vậy? 😄"
    ],
    // Dựa trên cung hoàng đạo
    zodiac: [
        "À {zodiac} hả? Nghe nói {zodiac_trait}! Đúng không? ♈",
        "Mình đã gặp {zodiac} rồi nè! Trùng hợp thật 🌙",
    ],
    // Câu chung (không cần điều kiện)
    general: [
        "Nếu có thể du lịch bất cứ đâu, bạn sẽ chọn đâu? ✈️",
        "Bữa ăn hoàn hảo nhất mà bạn từng thưởng thức là gì? 🍜",
        "Bạn là team chó hay team mèo? 🐶🐱",
        "Nếu có siêu năng lực, bạn sẽ chọn gì? ⚡",
        "Bài hát mà bạn nghe repeat mãi là gì? 🎵",
        "Bộ phim cuối cùng khiến bạn khóc là gì? 🎬",
        "Buổi sáng lý tưởng của bạn trông như thế nào? ☀️",
        "Bạn thích cafe hay trà boba hơn? ☕🧋",
        "Điều gì khiến bạn cười nhiều nhất? 😂",
        "Weekend vừa rồi bạn làm gì vui kể nghe nào? 🎉",
        "Nếu mô tả bản thân bằng 3 emoji, bạn sẽ chọn gì? 🤔",
        "Bạn đang binge-watch show gì vậy? 📺",
        "Món ăn mà bạn nấu tự tin nhất là gì? 👨‍🍳",
        "Điều bất ngờ nhất về bạn mà người khác không biết? 🤫",
        "Bạn thích đi biển hay đi núi hơn? 🏖️⛰️"
    ],
    // Câu dựa trên bio
    bio_related: [
        "Mình đọc bio bạn thấy hay quá! '{bio_snippet}' — kể thêm đi nào 😊",
        "'{bio_snippet}' — nghe thú vị thật! Bạn có thể share thêm không? 🌟"
    ],
    // Flirty (nhẹ nhàng)
    flirty: [
        "Nụ cười của bạn trong ảnh dễ thương quá! 😍 Bạn có hay cười vậy không?",
        "Phải nói mình ấn tượng ngay từ ảnh đầu tiên luôn 🔥 Kể về mình đi!",
        "Mình thấy match với bạn là may mắn rồi! Chào bạn nhé 💕"
    ]
};

const ZODIAC_TRAITS = {
    aries: 'rất năng động và nhiệt huyết',
    taurus: 'kiên nhẫn và thích ổn định',
    gemini: 'hoạt ngôn và thông minh',
    cancer: 'tình cảm và chu đáo',
    leo: 'tự tin và sáng chanh',
    virgo: 'cẩn thận và tinh tế',
    libra: 'hài hòa và duyên dáng',
    scorpio: 'bí ẩn và quyến rũ',
    sagittarius: 'thích phiêu lưu và tự do',
    capricorn: 'chăm chỉ và nghiêm túc',
    aquarius: 'sáng tạo và độc đáo',
    pisces: 'lãng mạn và nhạy cảm'
};

const ZODIAC_NAMES = {
    aries: 'Bạch Dương', taurus: 'Kim Ngưu', gemini: 'Song Tử',
    cancer: 'Cự Giải', leo: 'Sư Tử', virgo: 'Xử Nữ',
    libra: 'Thiên Bình', scorpio: 'Bọ Cạp', sagittarius: 'Nhân Mã',
    capricorn: 'Ma Kết', aquarius: 'Bảo Bình', pisces: 'Song Ngư'
};

// GET /api/icebreakers/:userId/:otherUserId
// Gợi ý câu mở đầu dựa trên thông tin 2 users
router.get('/:userId/:otherUserId', async (req, res) => {
    try {
        const { userId, otherUserId } = req.params;

        const [currentUser, otherUser] = await Promise.all([
            User.findOne({ userId }),
            User.findOne({ userId: otherUserId })
        ]);

        if (!currentUser || !otherUser) {
            return res.json({ success: false, message: 'User not found' });
        }

        const suggestions = [];

        // 1. Sở thích chung
        const myInterests = (currentUser.interests || []).map(i => i.toLowerCase());
        const theirInterests = (otherUser.interests || []).map(i => i.toLowerCase());
        const commonInterests = myInterests.filter(i => theirInterests.includes(i));

        if (commonInterests.length > 0) {
            const interest = commonInterests[Math.floor(Math.random() * commonInterests.length)];
            const templates = ICEBREAKER_TEMPLATES.common_interest;
            const template = templates[Math.floor(Math.random() * templates.length)];
            suggestions.push({
                category: 'common_interest',
                icon: '🎯',
                label: `Sở thích chung: ${interest}`,
                message: template.replace(/{interest}/g, interest)
            });
        }

        // 2. Nghề nghiệp
        if (otherUser.profileDetails?.occupation) {
            const templates = ICEBREAKER_TEMPLATES.occupation;
            const template = templates[Math.floor(Math.random() * templates.length)];
            suggestions.push({
                category: 'occupation',
                icon: '💼',
                label: `Nghề nghiệp`,
                message: template.replace(/{occupation}/g, otherUser.profileDetails.occupation)
            });
        }

        // 3. Cung hoàng đạo
        if (otherUser.profileDetails?.zodiac && otherUser.profileDetails.zodiac !== '') {
            const zodiac = otherUser.profileDetails.zodiac;
            const zodiacName = ZODIAC_NAMES[zodiac] || zodiac;
            const zodiacTrait = ZODIAC_TRAITS[zodiac] || 'thú vị lắm';
            const templates = ICEBREAKER_TEMPLATES.zodiac;
            const template = templates[Math.floor(Math.random() * templates.length)];
            suggestions.push({
                category: 'zodiac',
                icon: '♈',
                label: `Cung ${zodiacName}`,
                message: template
                    .replace(/{zodiac}/g, zodiacName)
                    .replace(/{zodiac_trait}/g, zodiacTrait)
            });
        }

        // 4. Bio
        if (otherUser.bio && otherUser.bio.length > 10) {
            const bioSnippet = otherUser.bio.length > 30
                ? otherUser.bio.substring(0, 30) + '...'
                : otherUser.bio;
            const templates = ICEBREAKER_TEMPLATES.bio_related;
            const template = templates[Math.floor(Math.random() * templates.length)];
            suggestions.push({
                category: 'bio',
                icon: '📝',
                label: 'Từ bio',
                message: template.replace(/{bio_snippet}/g, bioSnippet)
            });
        }

        // 5. Flirty
        const flirtyTemplates = ICEBREAKER_TEMPLATES.flirty;
        suggestions.push({
            category: 'flirty',
            icon: '💕',
            label: 'Tán tỉnh nhẹ',
            message: flirtyTemplates[Math.floor(Math.random() * flirtyTemplates.length)]
        });

        // 6. General - thêm 2-3 câu chung
        const shuffledGeneral = [...ICEBREAKER_TEMPLATES.general].sort(() => Math.random() - 0.5);
        const generalCount = Math.max(0, 5 - suggestions.length);
        for (let i = 0; i < Math.min(generalCount, shuffledGeneral.length); i++) {
            suggestions.push({
                category: 'general',
                icon: '💬',
                label: 'Gợi ý',
                message: shuffledGeneral[i]
            });
        }

        // Trả về tối đa 5 gợi ý
        res.json({
            success: true,
            data: {
                suggestions: suggestions.slice(0, 5),
                otherUser: {
                    userId: otherUser.userId,
                    firstName: otherUser.firstName,
                    interests: otherUser.interests,
                    bio: otherUser.bio,
                    zodiac: otherUser.profileDetails?.zodiac
                }
            }
        });

    } catch (error) {
        console.error('Icebreaker error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
