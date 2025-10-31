const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class AchievementManager {
    constructor() {
        this.dataDir = path.join(__dirname, 'data');
        this.userProfilesDir = path.join(this.dataDir, 'user-profiles');
        this.leaderboardFile = path.join(this.dataDir, 'leaderboard.json');
        this.achievementsFile = path.join(__dirname, 'achievements-system-design.json');

        // Initialize directories
        this.initializeDirectories();

        // Load achievement definitions
        this.achievements = this.loadAchievements();
        this.tiers = this.loadTiers();
        this.xpSources = this.loadXPSources();
    }

    initializeDirectories() {
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
        if (!fs.existsSync(this.userProfilesDir)) {
            fs.mkdirSync(this.userProfilesDir, { recursive: true });
        }
    }

    loadAchievements() {
        try {
            const data = fs.readFileSync(this.achievementsFile, 'utf8');
            const parsed = JSON.parse(data);
            return parsed.achievements || [];
        } catch (error) {
            console.error('Error loading achievements:', error);
            return [];
        }
    }

    loadTiers() {
        try {
            const data = fs.readFileSync(this.achievementsFile, 'utf8');
            const parsed = JSON.parse(data);
            return parsed.tiers || [];
        } catch (error) {
            console.error('Error loading tiers:', error);
            return [];
        }
    }

    loadXPSources() {
        try {
            const data = fs.readFileSync(this.achievementsFile, 'utf8');
            const parsed = JSON.parse(data);
            return parsed.xpSources || {};
        } catch (error) {
            console.error('Error loading XP sources:', error);
            return {};
        }
    }

    // User Profile Management
    getUserProfile(userId) {
        const profilePath = path.join(this.userProfilesDir, `${userId}.json`);
        try {
            if (fs.existsSync(profilePath)) {
                const data = fs.readFileSync(profilePath, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
        }
        return null;
    }

    createUserProfile(userId, userName) {
        const profile = {
            userId,
            userName,
            totalXP: 0,
            currentTier: 'beginner',
            quizzesCompleted: 0,
            averageScore: 0,
            bestScore: 0,
            currentStreak: 0,
            bestStreak: 0,
            achievements: [],
            quizHistory: [],
            createdAt: new Date().toISOString(),
            lastActive: new Date().toISOString()
        };

        this.saveUserProfile(profile);
        return profile;
    }

    saveUserProfile(profile) {
        const profilePath = path.join(this.userProfilesDir, `${profile.userId}.json`);
        try {
            fs.writeFileSync(profilePath, JSON.stringify(profile, null, 2));
        } catch (error) {
            console.error('Error saving user profile:', error);
        }
    }

    getOrCreateUserProfile(userId, userName) {
        let profile = this.getUserProfile(userId);
        if (!profile) {
            profile = this.createUserProfile(userId, userName);
        }
        return profile;
    }

    // XP Calculation
    calculateXPForQuiz(quizResult, profile) {
        let totalXP = 0;
        const breakdown = {};

        // Base XP for completion
        const completionXP = this.xpSources.quiz_completion?.baseXP || 100;
        totalXP += completionXP;
        breakdown.completion = completionXP;

        // XP per correct answer
        const correctAnswerXP = this.xpSources.correct_answer?.baseXP || 10;
        const correctAnswers = quizResult.detailedResults.filter(r => r.isCorrect).length;
        const answerXP = correctAnswers * correctAnswerXP;
        totalXP += answerXP;
        breakdown.correctAnswers = answerXP;

        // Score bonus
        const percentage = quizResult.percentage || 0;
        const scoreBonus = this.calculateScoreBonus(percentage);
        totalXP += scoreBonus;
        breakdown.scoreBonus = scoreBonus;

        // Speed bonus (if completion time available)
        if (quizResult.timeTaken) {
            const speedBonus = this.calculateSpeedBonus(quizResult.timeTaken);
            totalXP += speedBonus;
            breakdown.speedBonus = speedBonus;
        }

        // First attempt bonus
        if (!profile.quizHistory.some(q => q.quizName === quizResult.quizName)) {
            const firstAttemptBonus = this.xpSources.first_attempt_bonus?.baseXP || 25;
            totalXP += firstAttemptBonus;
            breakdown.firstAttempt = firstAttemptBonus;
        }

        return { totalXP: Math.round(totalXP), breakdown };
    }

    calculateScoreBonus(percentage) {
        const ranges = this.xpSources.score_bonus?.ranges || [];
        for (const range of ranges) {
            if (percentage >= range.min && percentage <= range.max) {
                return range.bonus || 0;
            }
        }
        return 0;
    }

    calculateSpeedBonus(timeTakenSeconds) {
        const maxBonus = this.xpSources.speed_bonus?.maxBonus || 50;
        const bonus = Math.max(0, maxBonus - Math.floor(timeTakenSeconds / 60));
        return bonus;
    }

    // Tier Management
    getCurrentTier(totalXP) {
        for (let i = this.tiers.length - 1; i >= 0; i--) {
            const tier = this.tiers[i];
            if (totalXP >= tier.minXP) {
                return tier;
            }
        }
        return this.tiers[0]; // Return beginner if no match
    }

    getNextTier(currentTierXP) {
        const currentTier = this.getCurrentTier(currentTierXP);
        const currentIndex = this.tiers.findIndex(t => t.id === currentTier.id);
        if (currentIndex < this.tiers.length - 1) {
            return this.tiers[currentIndex + 1];
        }
        return null; // At max tier
    }

    // Achievement Detection
    checkAchievements(userId, profile, quizResult) {
        const unlockedAchievements = [];

        for (const achievement of this.achievements) {
            // Skip if already unlocked
            if (profile.achievements.some(a => a.achievementId === achievement.id)) {
                continue;
            }

            const unlocked = this.checkAchievementCriteria(achievement, profile, quizResult);
            if (unlocked) {
                const achievementData = {
                    achievementId: achievement.id,
                    unlockedAt: new Date().toISOString(),
                    progress: 100
                };

                profile.achievements.push(achievementData);
                unlockedAchievements.push({
                    ...achievement,
                    unlockedAt: achievementData.unlockedAt
                });

                // Award XP
                profile.totalXP += achievement.xpReward;
            }
        }

        return unlockedAchievements;
    }

    checkAchievementCriteria(achievement, profile, quizResult) {
        const { criteria } = achievement;

        switch (criteria.type) {
            case 'quiz_completion':
                return profile.quizzesCompleted >= criteria.value;

            case 'perfect_score':
                return quizResult.percentage === 100;

            case 'completion_time':
                return quizResult.timeTaken && quizResult.timeTaken <= criteria.value;

            case 'score_streak':
                return profile.currentStreak >= criteria.count;

            case 'high_score_count':
                const highScoreCount = profile.quizHistory.filter(
                    q => q.percentage >= criteria.threshold
                ).length;
                return highScoreCount >= criteria.count;

            case 'perfect_no_skip':
                return quizResult.percentage === 100 &&
                       quizResult.detailedResults.every(r => r.studentAnswer !== null);

            case 'completion_rank':
                return quizResult.rank && quizResult.rank <= criteria.value;

            case 'improvement':
                if (profile.quizHistory.length < 2) return false;
                const previousQuiz = profile.quizHistory[profile.quizHistory.length - 1];
                return previousQuiz.percentage < criteria.fromThreshold &&
                       quizResult.percentage >= criteria.toThreshold;

            default:
                return false;
        }
    }

    // Update user profile after quiz completion
    updateUserAfterQuiz(userId, userName, quizResult) {
        const profile = this.getOrCreateUserProfile(userId, userName);

        // Calculate XP
        const xpData = this.calculateXPForQuiz(quizResult, profile);
        profile.totalXP += xpData.totalXP;

        // Update quiz count
        profile.quizzesCompleted++;

        // Update scores
        const percentage = quizResult.percentage || 0;
        if (percentage > profile.bestScore) {
            profile.bestScore = percentage;
        }

        // Update average score
        const totalScore = profile.quizHistory.reduce((sum, q) => sum + q.percentage, 0) + percentage;
        profile.averageScore = Math.round(totalScore / profile.quizzesCompleted);

        // Update streak
        if (percentage >= 80) {
            profile.currentStreak++;
            if (profile.currentStreak > profile.bestStreak) {
                profile.bestStreak = profile.currentStreak;
            }
        } else {
            profile.currentStreak = 0;
        }

        // Add to quiz history
        profile.quizHistory.push({
            quizName: quizResult.quizName || 'Unknown Quiz',
            score: quizResult.score || 0,
            percentage: percentage,
            xpEarned: xpData.totalXP,
            completedAt: new Date().toISOString(),
            rank: quizResult.rank || null,
            timeTaken: quizResult.timeTaken || null
        });

        // Check for achievements
        const unlockedAchievements = this.checkAchievements(userId, profile, {
            ...quizResult,
            percentage,
            timeTaken: quizResult.completionTime || null
        });

        // Update tier
        const newTier = this.getCurrentTier(profile.totalXP);
        const tierChanged = profile.currentTier !== newTier.id;
        profile.currentTier = newTier.id;

        // Update last active
        profile.lastActive = new Date().toISOString();

        // Save profile
        this.saveUserProfile(profile);

        return {
            profile,
            xpEarned: xpData.totalXP,
            xpBreakdown: xpData.breakdown,
            unlockedAchievements,
            tierChanged,
            newTier: tierChanged ? newTier : null
        };
    }

    // Leaderboard Management
    getGlobalLeaderboard(limit = 50) {
        try {
            const profiles = [];
            const files = fs.readdirSync(this.userProfilesDir);

            for (const file of files) {
                if (file.endsWith('.json')) {
                    const filePath = path.join(this.userProfilesDir, file);
                    const data = fs.readFileSync(filePath, 'utf8');
                    const profile = JSON.parse(data);
                    profiles.push(profile);
                }
            }

            // Sort by total XP (descending)
            profiles.sort((a, b) => b.totalXP - a.totalXP);

            // Assign ranks and format
            const leaderboard = profiles.slice(0, limit).map((profile, index) => ({
                rank: index + 1,
                userId: profile.userId,
                userName: profile.userName,
                totalXP: profile.totalXP,
                currentTier: profile.currentTier,
                quizzesCompleted: profile.quizzesCompleted,
                averageScore: profile.averageScore,
                recentAchievements: profile.achievements.slice(-3).map(a => {
                    const achievement = this.achievements.find(ach => ach.id === a.achievementId);
                    return achievement ? {
                        name: achievement.name,
                        icon: achievement.icon
                    } : null;
                }).filter(a => a !== null),
                badges: this.getUserBadges(profile)
            }));

            return leaderboard;
        } catch (error) {
            console.error('Error generating leaderboard:', error);
            return [];
        }
    }

    getUserBadges(profile) {
        const badges = [];

        // Tier badge
        const tier = this.tiers.find(t => t.id === profile.currentTier);
        if (tier) {
            badges.push({ type: 'tier', icon: tier.icon, name: tier.name });
        }

        // Recent achievements (top 3 rarest)
        const userAchievements = profile.achievements
            .map(a => this.achievements.find(ach => ach.id === a.achievementId))
            .filter(a => a !== null)
            .sort((a, b) => {
                const tierOrder = { bronze: 1, silver: 2, gold: 3, platinum: 4 };
                return (tierOrder[b.tier] || 0) - (tierOrder[a.tier] || 0);
            })
            .slice(0, 3);

        userAchievements.forEach(achievement => {
            badges.push({ type: 'achievement', icon: achievement.icon, name: achievement.name });
        });

        return badges;
    }

    getQuizLeaderboard(quizName, results) {
        const entries = results.map((result, index) => ({
            userId: result.participantId,
            userName: result.participantName,
            score: result.score,
            percentage: result.percentage || 0,
            rank: index + 1,
            timeTaken: result.completionTime || null,
            completedAt: result.timestamp,
            isTeam: result.isTeamSubmission || false,
            teamName: result.teamName || null
        }));

        // Sort by percentage (descending), then by completion time (ascending)
        entries.sort((a, b) => {
            if (b.percentage !== a.percentage) {
                return b.percentage - a.percentage;
            }
            if (a.timeTaken && b.timeTaken) {
                return a.timeTaken - b.timeTaken;
            }
            return 0;
        });

        // Reassign ranks
        entries.forEach((entry, index) => {
            entry.rank = index + 1;
        });

        return {
            quizName,
            entries,
            updatedAt: new Date().toISOString()
        };
    }

    // Get user rank in global leaderboard
    getUserRank(userId) {
        const leaderboard = this.getGlobalLeaderboard(999999);
        const entry = leaderboard.find(e => e.userId === userId);
        return entry ? entry.rank : null;
    }

    // Get achievement progress for a user
    getAchievementProgress(userId) {
        const profile = this.getUserProfile(userId);
        if (!profile) return [];

        const progress = [];

        for (const achievement of this.achievements) {
            const unlocked = profile.achievements.some(a => a.achievementId === achievement.id);

            let currentValue = 0;
            let targetValue = 0;
            let percentage = 0;

            if (!unlocked) {
                const result = this.calculateAchievementProgress(achievement, profile);
                currentValue = result.currentValue;
                targetValue = result.targetValue;
                percentage = Math.min(100, Math.round((currentValue / targetValue) * 100));
            } else {
                percentage = 100;
            }

            progress.push({
                achievementId: achievement.id,
                name: achievement.name,
                description: achievement.description,
                icon: achievement.icon,
                tier: achievement.tier,
                xpReward: achievement.xpReward,
                unlocked,
                currentValue,
                targetValue,
                percentage
            });
        }

        return progress;
    }

    calculateAchievementProgress(achievement, profile) {
        const { criteria } = achievement;
        let currentValue = 0;
        let targetValue = 0;

        switch (criteria.type) {
            case 'quiz_completion':
                currentValue = profile.quizzesCompleted;
                targetValue = criteria.value;
                break;

            case 'score_streak':
                currentValue = profile.currentStreak;
                targetValue = criteria.count;
                break;

            case 'high_score_count':
                currentValue = profile.quizHistory.filter(q => q.percentage >= criteria.threshold).length;
                targetValue = criteria.count;
                break;

            default:
                targetValue = 1;
                currentValue = 0;
        }

        return { currentValue, targetValue };
    }

    // Get user statistics
    getUserStats(userId) {
        const profile = this.getUserProfile(userId);
        if (!profile) return null;

        const tier = this.getCurrentTier(profile.totalXP);
        const nextTier = this.getNextTier(profile.totalXP);
        const rank = this.getUserRank(userId);

        return {
            profile,
            tier,
            nextTier,
            rank,
            xpToNextTier: nextTier ? nextTier.minXP - profile.totalXP : 0,
            achievementProgress: this.getAchievementProgress(userId)
        };
    }
}

module.exports = AchievementManager;
