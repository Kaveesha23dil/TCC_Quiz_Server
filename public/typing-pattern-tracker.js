/**
 * Typing Pattern Tracker
 * Captures typing patterns and behaviors for plagiarism detection
 */

class TypingPatternTracker {
    constructor() {
        this.typingData = {
            questionTypingSpeeds: [], // Words per minute for each question
            pausePatterns: {
                longPauses: 0,
                avgPause: 0,
                pauses: []
            },
            answerChanges: [], // Number of changes per question
            keystrokeTimes: {}, // Detailed keystroke timing per question
            questionTimes: [], // Total time spent per question
            totalTime: 0,
            totalQuestions: 0,
            instantAnswers: 0 // Questions answered in < 2 seconds
        };

        this.questionStartTime = {};
        this.lastKeystrokeTime = {};
        this.keystrokes = {};
        this.changeCount = {};
        this.isTracking = false;
        this.startTime = null;
    }

    /**
     * Initialize tracking for the quiz
     */
    startTracking(totalQuestions) {
        this.typingData.totalQuestions = totalQuestions;
        this.startTime = Date.now();
        this.isTracking = true;

        // Initialize arrays for each question
        for (let i = 0; i < totalQuestions; i++) {
            this.typingData.answerChanges[i] = 0;
            this.typingData.questionTypingSpeeds[i] = 0;
            this.typingData.questionTimes[i] = 0;
            this.keystrokes[i] = [];
            this.changeCount[i] = 0;
        }

        console.log('Typing pattern tracking started');
    }

    /**
     * Track keystrokes on a specific input element
     */
    trackInput(inputElement, questionIndex) {
        if (!this.isTracking) return;

        let currentValue = inputElement.value;
        let lastValue = inputElement.value;

        // Track keydown events
        inputElement.addEventListener('keydown', (e) => {
            const now = Date.now();

            // Initialize question start time
            if (!this.questionStartTime[questionIndex]) {
                this.questionStartTime[questionIndex] = now;
            }

            // Track keystroke timing
            if (!this.keystrokes[questionIndex]) {
                this.keystrokes[questionIndex] = [];
            }

            const keystrokeData = {
                key: e.key,
                timestamp: now,
                timeSinceLast: this.lastKeystrokeTime[questionIndex]
                    ? now - this.lastKeystrokeTime[questionIndex]
                    : 0
            };

            this.keystrokes[questionIndex].push(keystrokeData);
            this.lastKeystrokeTime[questionIndex] = now;

            // Track long pauses (> 3 seconds between keystrokes)
            if (keystrokeData.timeSinceLast > 3000) {
                this.typingData.pausePatterns.longPauses++;
                this.typingData.pausePatterns.pauses.push({
                    question: questionIndex,
                    duration: keystrokeData.timeSinceLast
                });
            }
        });

        // Track changes (paste, delete, major edits)
        inputElement.addEventListener('input', (e) => {
            currentValue = e.target.value;

            // Detect paste operations (large changes in content)
            const lengthDiff = Math.abs(currentValue.length - lastValue.length);
            if (lengthDiff > 5) {
                this.changeCount[questionIndex]++;
                this.typingData.answerChanges[questionIndex]++;
            }

            lastValue = currentValue;
        });

        // Track paste events specifically
        inputElement.addEventListener('paste', (e) => {
            this.changeCount[questionIndex] += 2; // Paste is suspicious
            this.typingData.answerChanges[questionIndex] += 2;

            // Log paste event
            console.warn(`Paste detected on question ${questionIndex}`);
        });

        // Calculate typing speed on blur
        inputElement.addEventListener('blur', () => {
            this.calculateTypingSpeed(questionIndex, inputElement.value);
        });

        // Track changes in radio/checkbox selections
        inputElement.addEventListener('change', () => {
            if (inputElement.type === 'radio' || inputElement.type === 'checkbox') {
                this.changeCount[questionIndex]++;
                this.typingData.answerChanges[questionIndex]++;

                // Track instant answers (< 2 seconds to answer)
                if (!this.questionStartTime[questionIndex]) {
                    this.questionStartTime[questionIndex] = Date.now();
                }

                const timeToAnswer = (Date.now() - this.questionStartTime[questionIndex]) / 1000;
                if (timeToAnswer < 2) {
                    this.typingData.instantAnswers++;
                }
            }
        });
    }

    /**
     * Calculate typing speed in words per minute
     */
    calculateTypingSpeed(questionIndex, text) {
        if (!this.questionStartTime[questionIndex] || !text || text.trim().length === 0) {
            this.typingData.questionTypingSpeeds[questionIndex] = 0;
            return;
        }

        const startTime = this.questionStartTime[questionIndex];
        const endTime = Date.now();
        const timeInMinutes = (endTime - startTime) / 60000;

        // Calculate words (roughly 5 characters = 1 word)
        const wordCount = text.trim().length / 5;
        const wpm = timeInMinutes > 0 ? wordCount / timeInMinutes : 0;

        this.typingData.questionTypingSpeeds[questionIndex] = Math.round(wpm);

        // Store total time for this question
        this.typingData.questionTimes[questionIndex] = Math.round((endTime - startTime) / 1000);
    }

    /**
     * Finalize tracking and calculate summary statistics
     */
    finalizeTracking() {
        if (!this.isTracking) return this.typingData;

        // Calculate total time
        this.typingData.totalTime = Math.round((Date.now() - this.startTime) / 1000);

        // Calculate average pause duration
        if (this.typingData.pausePatterns.pauses.length > 0) {
            const totalPauseDuration = this.typingData.pausePatterns.pauses.reduce(
                (sum, pause) => sum + pause.duration, 0
            );
            this.typingData.pausePatterns.avgPause =
                totalPauseDuration / this.typingData.pausePatterns.pauses.length / 1000; // in seconds
        }

        // Analyze keystroke patterns for each question
        this.typingData.questionTypingSpeeds = this.typingData.questionTypingSpeeds.map((speed, idx) => {
            if (speed === 0 && this.questionStartTime[idx]) {
                // Recalculate for questions that might have been answered via selection
                const timeSpent = (Date.now() - this.questionStartTime[idx]) / 1000;
                this.typingData.questionTimes[idx] = Math.round(timeSpent);

                // For non-text questions, use a default speed based on time
                return timeSpent > 0 ? Math.round(60 / timeSpent) : 0;
            }
            return speed;
        });

        console.log('Typing pattern tracking completed:', this.typingData);
        this.isTracking = false;

        return this.typingData;
    }

    /**
     * Get current typing data (without finalizing)
     */
    getCurrentData() {
        return { ...this.typingData };
    }

    /**
     * Reset tracker for a new quiz
     */
    reset() {
        this.typingData = {
            questionTypingSpeeds: [],
            pausePatterns: {
                longPauses: 0,
                avgPause: 0,
                pauses: []
            },
            answerChanges: [],
            keystrokeTimes: {},
            questionTimes: [],
            totalTime: 0,
            totalQuestions: 0,
            instantAnswers: 0
        };

        this.questionStartTime = {};
        this.lastKeystrokeTime = {};
        this.keystrokes = {};
        this.changeCount = {};
        this.isTracking = false;
        this.startTime = null;
    }

    /**
     * Auto-attach to quiz form
     * Call this after quiz questions are rendered
     */
    attachToQuizForm(totalQuestions) {
        this.startTracking(totalQuestions);

        // Track all text inputs, textareas, and radio/checkbox inputs
        const questions = document.querySelectorAll('.question');

        questions.forEach((questionDiv, idx) => {
            // Track text inputs
            const textInputs = questionDiv.querySelectorAll('input[type="text"], textarea');
            textInputs.forEach(input => {
                this.trackInput(input, idx);
            });

            // Track radio buttons
            const radios = questionDiv.querySelectorAll('input[type="radio"]');
            radios.forEach(radio => {
                this.trackInput(radio, idx);
            });

            // Track checkboxes
            const checkboxes = questionDiv.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                this.trackInput(checkbox, idx);
            });
        });

        console.log(`Attached typing pattern tracking to ${totalQuestions} questions`);
    }
}

// Create global instance
const typingPatternTracker = new TypingPatternTracker();
