/**
 * Plagiarism Detection System
 * Analyzes quiz submissions for potential plagiarism through:
 * - Answer similarity comparison
 * - Typing pattern analysis
 * - Time-based anomaly detection
 */

class PlagiarismDetector {
    constructor() {
        this.similarityThreshold = 0.85; // 85% similarity triggers flag
        this.typingSpeedThreshold = { min: 10, max: 500 }; // WPM range
        this.suspiciousTimeThreshold = 2; // seconds per question minimum
    }

    /**
     * Main analysis function - analyzes a submission for plagiarism
     * @param {Object} submission - The quiz submission to analyze
     * @param {Array} allSubmissions - All submissions for comparison
     * @param {Array} questions - Quiz questions
     * @returns {Object} Plagiarism analysis result
     */
    analyzeSubmission(submission, allSubmissions, questions) {
        const flags = [];
        const scores = {
            answerSimilarity: 0,
            typingPattern: 0,
            timeAnomaly: 0,
            overall: 0
        };

        // 1. Answer Similarity Analysis
        const similarityAnalysis = this.detectAnswerSimilarity(
            submission,
            allSubmissions
        );
        scores.answerSimilarity = similarityAnalysis.maxScore;
        if (similarityAnalysis.suspicious.length > 0) {
            flags.push({
                type: 'ANSWER_SIMILARITY',
                severity: this.getSeverity(similarityAnalysis.maxScore),
                details: similarityAnalysis.suspicious,
                description: `High similarity with ${similarityAnalysis.suspicious.length} submission(s)`
            });
        }

        // 2. Typing Pattern Analysis
        if (submission.typingData) {
            const typingAnalysis = this.analyzeTypingPattern(submission.typingData);
            scores.typingPattern = typingAnalysis.anomalyScore;
            if (typingAnalysis.flags.length > 0) {
                flags.push({
                    type: 'TYPING_PATTERN',
                    severity: this.getSeverity(typingAnalysis.anomalyScore),
                    details: typingAnalysis.flags,
                    description: 'Suspicious typing patterns detected'
                });
            }
        }

        // 3. Time-based Anomaly Detection
        const timeAnalysis = this.detectTimeAnomalies(
            submission,
            allSubmissions,
            questions
        );
        scores.timeAnomaly = timeAnalysis.anomalyScore;
        if (timeAnalysis.flags.length > 0) {
            flags.push({
                type: 'TIME_ANOMALY',
                severity: this.getSeverity(timeAnalysis.anomalyScore),
                details: timeAnalysis.flags,
                description: 'Unusual time-based patterns detected'
            });
        }

        // Calculate overall suspicion score (0-100)
        scores.overall = Math.round(
            (scores.answerSimilarity * 0.5) +
            (scores.typingPattern * 0.3) +
            (scores.timeAnomaly * 0.2)
        );

        return {
            participantId: submission.participantId,
            participantName: submission.participantName,
            isSuspicious: scores.overall >= 60,
            suspicionScore: scores.overall,
            scores: scores,
            flags: flags,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Detect answer similarity between submissions
     */
    detectAnswerSimilarity(submission, allSubmissions) {
        const suspicious = [];
        let maxScore = 0;

        // Compare with all other submissions
        for (const other of allSubmissions) {
            // Skip self-comparison and incomplete submissions
            if (other.participantId === submission.participantId || !other.answers) {
                continue;
            }

            const similarity = this.calculateAnswerSimilarity(
                submission.answers,
                other.answers
            );

            if (similarity >= this.similarityThreshold) {
                suspicious.push({
                    participantId: other.participantId,
                    participantName: other.participantName,
                    similarityScore: Math.round(similarity * 100),
                    matchingAnswers: this.getMatchingAnswers(
                        submission.answers,
                        other.answers
                    )
                });
                maxScore = Math.max(maxScore, similarity * 100);
            }
        }

        return { suspicious, maxScore };
    }

    /**
     * Calculate similarity between two answer sets
     * Uses multiple algorithms for comprehensive analysis
     */
    calculateAnswerSimilarity(answers1, answers2) {
        if (!answers1 || !answers2 || answers1.length !== answers2.length) {
            return 0;
        }

        let totalSimilarity = 0;
        let comparableAnswers = 0;

        for (let i = 0; i < answers1.length; i++) {
            const answer1 = this.normalizeAnswer(answers1[i]);
            const answer2 = this.normalizeAnswer(answers2[i]);

            if (answer1 && answer2) {
                // For short answers, use string similarity
                if (typeof answer1 === 'string' && typeof answer2 === 'string') {
                    if (answer1.length > 20 || answer2.length > 20) {
                        // Long text: use Jaccard + Levenshtein
                        const jaccardSim = this.jaccardSimilarity(answer1, answer2);
                        const levenshteinSim = this.levenshteinSimilarity(answer1, answer2);
                        totalSimilarity += (jaccardSim + levenshteinSim) / 2;
                    } else {
                        // Short text: exact or near-exact match
                        totalSimilarity += answer1 === answer2 ? 1 : 0;
                    }
                } else {
                    // For arrays or exact values
                    totalSimilarity += JSON.stringify(answer1) === JSON.stringify(answer2) ? 1 : 0;
                }
                comparableAnswers++;
            }
        }

        return comparableAnswers > 0 ? totalSimilarity / comparableAnswers : 0;
    }

    /**
     * Get list of matching answer indices
     */
    getMatchingAnswers(answers1, answers2) {
        const matches = [];
        for (let i = 0; i < answers1.length; i++) {
            const a1 = this.normalizeAnswer(answers1[i]);
            const a2 = this.normalizeAnswer(answers2[i]);
            if (a1 && a2 && JSON.stringify(a1) === JSON.stringify(a2)) {
                matches.push(i);
            }
        }
        return matches;
    }

    /**
     * Analyze typing patterns for anomalies
     */
    analyzeTypingPattern(typingData) {
        const flags = [];
        let anomalyScore = 0;

        // 1. Check typing speed consistency
        const speeds = typingData.questionTypingSpeeds || [];
        if (speeds.length > 0) {
            const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
            const variance = this.calculateVariance(speeds);
            const stdDev = Math.sqrt(variance);

            // Flag extremely high or low speeds
            if (avgSpeed < this.typingSpeedThreshold.min) {
                flags.push({
                    issue: 'Extremely slow typing speed',
                    value: `${Math.round(avgSpeed)} WPM`,
                    expected: `>${this.typingSpeedThreshold.min} WPM`
                });
                anomalyScore += 30;
            } else if (avgSpeed > this.typingSpeedThreshold.max) {
                flags.push({
                    issue: 'Unrealistically fast typing speed',
                    value: `${Math.round(avgSpeed)} WPM`,
                    expected: `<${this.typingSpeedThreshold.max} WPM`
                });
                anomalyScore += 40;
            }

            // Flag unusual consistency (possible copy-paste)
            if (stdDev < avgSpeed * 0.1 && avgSpeed > 100) {
                flags.push({
                    issue: 'Suspiciously consistent typing speed',
                    value: `StdDev: ${stdDev.toFixed(2)}`,
                    expected: 'Natural variation expected'
                });
                anomalyScore += 35;
            }
        }

        // 2. Check pause patterns
        if (typingData.pausePatterns) {
            const { longPauses, avgPause } = typingData.pausePatterns;

            // Too few pauses might indicate copy-paste
            if (longPauses < 2 && typingData.totalTime > 60) {
                flags.push({
                    issue: 'Very few thinking pauses',
                    value: `${longPauses} pauses`,
                    expected: 'Regular pauses for thinking'
                });
                anomalyScore += 25;
            }

            // Extremely long pauses might indicate looking up answers
            if (avgPause > 30) {
                flags.push({
                    issue: 'Unusually long pauses between typing',
                    value: `${avgPause.toFixed(1)}s average`,
                    expected: '<30s average pause'
                });
                anomalyScore += 20;
            }
        }

        // 3. Check answer change patterns
        if (typingData.answerChanges) {
            const totalChanges = typingData.answerChanges.reduce((a, b) => a + b, 0);
            const questionsWithChanges = typingData.answerChanges.filter(c => c > 0).length;

            // No changes at all might indicate pre-written answers
            if (totalChanges === 0 && typingData.totalTime > 30) {
                flags.push({
                    issue: 'No answer revisions',
                    value: '0 changes',
                    expected: 'Some natural corrections expected'
                });
                anomalyScore += 30;
            }

            // Excessive changes might indicate uncertainty or collaboration
            if (totalChanges > typingData.totalQuestions * 5) {
                flags.push({
                    issue: 'Excessive answer revisions',
                    value: `${totalChanges} changes`,
                    expected: `<${typingData.totalQuestions * 5} changes`
                });
                anomalyScore += 15;
            }
        }

        return { flags, anomalyScore: Math.min(anomalyScore, 100) };
    }

    /**
     * Detect time-based anomalies
     */
    detectTimeAnomalies(submission, allSubmissions, questions) {
        const flags = [];
        let anomalyScore = 0;

        // 1. Check overall completion time
        const completionTime = submission.completionTime || 0;
        const questionCount = questions.length;

        if (completionTime < this.suspiciousTimeThreshold * questionCount) {
            flags.push({
                issue: 'Suspiciously fast completion',
                value: `${completionTime}s for ${questionCount} questions`,
                expected: `>${this.suspiciousTimeThreshold * questionCount}s`
            });
            anomalyScore += 40;
        }

        // 2. Compare with average submission time
        const completedSubmissions = allSubmissions.filter(s =>
            s.completionTime && s.participantId !== submission.participantId
        );

        if (completedSubmissions.length >= 3) {
            const avgTime = completedSubmissions.reduce((sum, s) =>
                sum + s.completionTime, 0
            ) / completedSubmissions.length;
            const stdDev = Math.sqrt(
                this.calculateVariance(completedSubmissions.map(s => s.completionTime))
            );

            // Flag if more than 2 standard deviations from mean (very fast or very slow)
            if (Math.abs(completionTime - avgTime) > 2 * stdDev) {
                if (completionTime < avgTime) {
                    flags.push({
                        issue: 'Completion time significantly faster than peers',
                        value: `${completionTime}s`,
                        expected: `~${Math.round(avgTime)}s average`
                    });
                    anomalyScore += 30;
                } else {
                    flags.push({
                        issue: 'Unusually slow completion time',
                        value: `${completionTime}s`,
                        expected: `~${Math.round(avgTime)}s average`
                    });
                    anomalyScore += 15;
                }
            }
        }

        // 3. Check question-level timing if available
        if (submission.questionTimes && submission.questionTimes.length > 0) {
            const questionTimes = submission.questionTimes;

            // Check for suspiciously uniform timing
            const variance = this.calculateVariance(questionTimes);
            const avgQuestionTime = questionTimes.reduce((a, b) => a + b, 0) / questionTimes.length;

            if (variance < avgQuestionTime * 0.1 && questionTimes.length > 5) {
                flags.push({
                    issue: 'Unnaturally consistent question timing',
                    value: `Variance: ${variance.toFixed(2)}`,
                    expected: 'Variable timing across questions'
                });
                anomalyScore += 25;
            }

            // Check for instant answers (< 1 second)
            const instantAnswers = questionTimes.filter(t => t < 1).length;
            if (instantAnswers > questionTimes.length * 0.3) {
                flags.push({
                    issue: 'Too many instant answers',
                    value: `${instantAnswers} questions`,
                    expected: 'More time for reading and thinking'
                });
                anomalyScore += 35;
            }
        }

        // 4. Check submission timing relative to others
        if (submission.timestamp && completedSubmissions.length > 0) {
            const submissionTime = new Date(submission.timestamp).getTime();

            // Check if multiple submissions happened at suspiciously similar times
            const nearbySubs = completedSubmissions.filter(s => {
                const otherTime = new Date(s.timestamp).getTime();
                return Math.abs(submissionTime - otherTime) < 5000; // Within 5 seconds
            });

            if (nearbySubs.length >= 2) {
                flags.push({
                    issue: 'Multiple submissions within 5 seconds',
                    value: `${nearbySubs.length + 1} submissions`,
                    expected: 'More varied submission times'
                });
                anomalyScore += 20;
            }
        }

        return { flags, anomalyScore: Math.min(anomalyScore, 100) };
    }

    /**
     * Utility Functions
     */

    normalizeAnswer(answer) {
        if (answer === null || answer === undefined) return null;
        if (typeof answer === 'string') {
            return answer.toLowerCase().trim();
        }
        return answer;
    }

    // Jaccard similarity for text comparison
    jaccardSimilarity(str1, str2) {
        const set1 = new Set(str1.toLowerCase().split(/\s+/));
        const set2 = new Set(str2.toLowerCase().split(/\s+/));

        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);

        return union.size === 0 ? 0 : intersection.size / union.size;
    }

    // Levenshtein distance similarity
    levenshteinSimilarity(str1, str2) {
        const distance = this.levenshteinDistance(str1, str2);
        const maxLength = Math.max(str1.length, str2.length);
        return maxLength === 0 ? 1 : 1 - (distance / maxLength);
    }

    levenshteinDistance(str1, str2) {
        const m = str1.length;
        const n = str2.length;
        const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

        for (let i = 0; i <= m; i++) dp[i][0] = i;
        for (let j = 0; j <= n; j++) dp[0][j] = j;

        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (str1[i - 1] === str2[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1];
                } else {
                    dp[i][j] = Math.min(
                        dp[i - 1][j] + 1,
                        dp[i][j - 1] + 1,
                        dp[i - 1][j - 1] + 1
                    );
                }
            }
        }

        return dp[m][n];
    }

    calculateVariance(numbers) {
        if (numbers.length === 0) return 0;
        const avg = numbers.reduce((a, b) => a + b, 0) / numbers.length;
        return numbers.reduce((sum, num) => sum + Math.pow(num - avg, 2), 0) / numbers.length;
    }

    getSeverity(score) {
        if (score >= 80) return 'HIGH';
        if (score >= 60) return 'MEDIUM';
        if (score >= 40) return 'LOW';
        return 'INFO';
    }

    /**
     * Generate a summary report for all submissions
     */
    generateBatchReport(allSubmissions, questions) {
        const reports = [];

        for (const submission of allSubmissions) {
            const analysis = this.analyzeSubmission(
                submission,
                allSubmissions,
                questions
            );
            reports.push(analysis);
        }

        // Sort by suspicion score (highest first)
        reports.sort((a, b) => b.suspicionScore - a.suspicionScore);

        return {
            totalSubmissions: allSubmissions.length,
            flaggedSubmissions: reports.filter(r => r.isSuspicious).length,
            reports: reports,
            generatedAt: new Date().toISOString()
        };
    }
}

module.exports = new PlagiarismDetector();
