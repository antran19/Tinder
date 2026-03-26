const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { Swipe, Match } = require('../models');

/**
 * Smart Matching Algorithm
 * Tính điểm tương thích giữa 2 users dựa trên:
 * 1. Sở thích chung (40%)
 * 2. Khoảng cách (20%)
 * 3. Tuổi phù hợp (15%)
 * 4. Completion score - profile đầy đủ (10%)
 * 5. Online status bonus (5%)
 * 6. Verification bonus (5%)
 * 7. Zodiac compatibility (5%)
 */

// Zodiac compatibility matrix (simplified)
const ZODIAC_COMPAT = {
    aries: ['leo', 'sagittarius', 'gemini', 'aquarius'],
    taurus: ['virgo', 'capricorn', 'cancer', 'pisces'],
    gemini: ['libra', 'aquarius', 'aries', 'leo'],
    cancer: ['scorpio', 'pisces', 'taurus', 'virgo'],
    leo: ['aries', 'sagittarius', 'gemini', 'libra'],
    virgo: ['taurus', 'capricorn', 'cancer', 'scorpio'],
    libra: ['gemini', 'aquarius', 'leo', 'sagittarius'],
    scorpio: ['cancer', 'pisces', 'virgo', 'capricorn'],
    sagittarius: ['aries', 'leo', 'libra', 'aquarius'],
    capricorn: ['taurus', 'virgo', 'scorpio', 'pisces'],
    aquarius: ['gemini', 'libra', 'aries', 'sagittarius'],
    pisces: ['cancer', 'scorpio', 'taurus', 'capricorn']
};

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getProfileCompleteness(user) {
    let score = 0;
    if (user.images?.length > 0) score += 15;
    if (user.images?.length >= 3) score += 10;
    if (user.bio?.length > 10) score += 15;
    if (user.interests?.length >= 3) score += 15;
    if (user.profileDetails?.occupation) score += 10;
    if (user.profileDetails?.education) score += 10;
    if (user.profileDetails?.zodiac) score += 10;
    if (user.isVerified) score += 15;
    return score; // 0-100
}

function calculateMatchScore(currentUser, candidate) {
    let score = 0;
    const breakdown = {};

    // 1. Sở thích chung (40 điểm max)
    const myInterests = (currentUser.interests || []).map(i => i.toLowerCase());
    const theirInterests = (candidate.interests || []).map(i => i.toLowerCase());
    const commonCount = myInterests.filter(i => theirInterests.includes(i)).length;
    const maxInterests = Math.max(myInterests.length, theirInterests.length, 1);
    const interestScore = Math.min(40, (commonCount / maxInterests) * 40);
    score += interestScore;
    breakdown.interests = { score: Math.round(interestScore), common: commonCount };

    // 2. Khoảng cách (20 điểm max - gần hơn = điểm cao hơn)
    let distanceScore = 10; // default nếu không có GPS
    const myLat = currentUser.location?.coordinates?.[1];
    const myLng = currentUser.location?.coordinates?.[0];
    const theirLat = candidate.location?.coordinates?.[1];
    const theirLng = candidate.location?.coordinates?.[0];

    if (myLat && myLng && theirLat && theirLng && (myLat !== 0 || myLng !== 0) && (theirLat !== 0 || theirLng !== 0)) {
        const dist = calculateDistance(myLat, myLng, theirLat, theirLng);
        if (dist <= 5) distanceScore = 20;
        else if (dist <= 10) distanceScore = 17;
        else if (dist <= 20) distanceScore = 14;
        else if (dist <= 50) distanceScore = 10;
        else if (dist <= 100) distanceScore = 5;
        else distanceScore = 2;
        breakdown.distance = { score: Math.round(distanceScore), km: Math.round(dist) };
    } else {
        breakdown.distance = { score: distanceScore, km: null };
    }
    score += distanceScore;

    // 3. Tuổi phù hợp (15 điểm max)
    const myAge = currentUser.birthday ? Math.floor((Date.now() - new Date(currentUser.birthday)) / (365.25 * 24 * 60 * 60 * 1000)) : 25;
    const theirAge = candidate.birthday ? Math.floor((Date.now() - new Date(candidate.birthday)) / (365.25 * 24 * 60 * 60 * 1000)) : 25;
    const ageDiff = Math.abs(myAge - theirAge);
    let ageScore = 15;
    if (ageDiff > 15) ageScore = 3;
    else if (ageDiff > 10) ageScore = 7;
    else if (ageDiff > 5) ageScore = 11;
    score += ageScore;
    breakdown.age = { score: ageScore, diff: ageDiff };

    // 4. Profile completeness (10 điểm max)
    const completeness = getProfileCompleteness(candidate);
    const completenessScore = (completeness / 100) * 10;
    score += completenessScore;
    breakdown.profileComplete = { score: Math.round(completenessScore), pct: completeness };

    // 5. Online status (5 điểm)
    const onlineScore = candidate.isOnline ? 5 : 0;
    score += onlineScore;
    breakdown.online = { score: onlineScore };

    // 6. Verification (5 điểm)
    const verifiedScore = candidate.isVerified ? 5 : 0;
    score += verifiedScore;
    breakdown.verified = { score: verifiedScore };

    // 7. Zodiac compatibility (5 điểm)
    let zodiacScore = 0;
    if (currentUser.profileDetails?.zodiac && candidate.profileDetails?.zodiac) {
        const myZodiac = currentUser.profileDetails.zodiac;
        const theirZodiac = candidate.profileDetails.zodiac;
        if (ZODIAC_COMPAT[myZodiac]?.includes(theirZodiac)) {
            zodiacScore = 5;
        } else if (myZodiac === theirZodiac) {
            zodiacScore = 3;
        }
    }
    score += zodiacScore;
    breakdown.zodiac = { score: zodiacScore };

    return { totalScore: Math.round(score), breakdown };
}

// GET /api/smart-match/:userId — Lấy gợi ý match thông minh
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const limit = parseInt(req.query.limit) || 10;

        const currentUser = await User.findOne({ userId });
        if (!currentUser) return res.status(404).json({ success: false, message: 'User not found' });

        // Lấy users đã swipe
        const swipedIds = await Swipe.find({ fromUserId: userId }).distinct('toUserId');
        const excludeIds = [...swipedIds, userId];

        const genderPref = currentUser.preferences?.genderPreference || (currentUser.gender === 'male' ? 'female' : 'male');

        const candidates = await User.find({
            userId: { $nin: excludeIds },
            gender: genderPref,
            isBanned: { $ne: true }
        }).select('userId firstName birthday gender bio images interests profileDetails isOnline isVerified location boost');

        // Tính score cho mỗi ứng viên
        const scored = candidates.map(candidate => {
            const { totalScore, breakdown } = calculateMatchScore(currentUser, candidate);
            return {
                user: {
                    userId: candidate.userId,
                    firstName: candidate.firstName,
                    birthday: candidate.birthday,
                    gender: candidate.gender,
                    bio: candidate.bio,
                    images: candidate.images,
                    interests: candidate.interests,
                    profileDetails: candidate.profileDetails,
                    isOnline: candidate.isOnline,
                    isVerified: candidate.isVerified,
                    isBoosted: candidate.boost?.isActive && candidate.boost?.endsAt > new Date()
                },
                matchScore: totalScore,
                breakdown,
                compatibility: totalScore >= 70 ? 'Rất phù hợp' :
                               totalScore >= 50 ? 'Phù hợp' :
                               totalScore >= 30 ? 'Có tiềm năng' : 'Khám phá'
            };
        });

        // Sort by score, boosted first
        scored.sort((a, b) => {
            if (a.user.isBoosted && !b.user.isBoosted) return -1;
            if (!a.user.isBoosted && b.user.isBoosted) return 1;
            return b.matchScore - a.matchScore;
        });

        res.json({
            success: true,
            data: {
                suggestions: scored.slice(0, limit),
                totalCandidates: scored.length,
                algorithm: 'SmartMatch v1.0'
            }
        });

    } catch (error) {
        console.error('Smart match error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
