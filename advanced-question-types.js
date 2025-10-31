/**
 * Advanced Question Types Module
 * Handles validation and scoring for advanced question formats
 */

class AdvancedQuestionTypes {
  /**
   * Validate and score a matching question
   * @param {Object} question - Question definition with pairs
   * @param {Object} answer - Student's matching pairs {leftId: rightId}
   * @returns {Object} {isCorrect, score, feedback}
   */
  static scoreMatchingQuestion(question, answer) {
    const correctPairs = question.correctPairs || {}; // {leftId: rightId}
    const studentPairs = answer || {};

    let correctCount = 0;
    let totalPairs = Object.keys(correctPairs).length;

    for (const [leftId, rightId] of Object.entries(correctPairs)) {
      if (studentPairs[leftId] === rightId) {
        correctCount++;
      }
    }

    const percentage = totalPairs > 0 ? (correctCount / totalPairs) : 0;
    const points = question.points || 1;

    // Award partial credit if enabled
    if (question.partialCredit) {
      return {
        isCorrect: percentage >= (question.passingPercentage || 0.5),
        score: points * percentage,
        correctCount,
        totalPairs,
        feedback: `Matched ${correctCount} out of ${totalPairs} pairs correctly`
      };
    } else {
      // All or nothing scoring
      return {
        isCorrect: percentage === 1,
        score: percentage === 1 ? points : 0,
        correctCount,
        totalPairs,
        feedback: percentage === 1 ? 'All pairs matched correctly!' : `Only ${correctCount} out of ${totalPairs} pairs correct`
      };
    }
  }

  /**
   * Validate and score an ordering/sequencing question
   * @param {Object} question - Question with correct sequence
   * @param {Array} answer - Student's ordered array
   * @returns {Object} {isCorrect, score, feedback}
   */
  static scoreOrderingQuestion(question, answer) {
    const correctOrder = question.correctOrder || [];
    const studentOrder = answer || [];
    const points = question.points || 1;

    // Check if arrays match exactly
    const isExactMatch = correctOrder.length === studentOrder.length &&
      correctOrder.every((item, idx) => item === studentOrder[idx]);

    if (isExactMatch) {
      return {
        isCorrect: true,
        score: points,
        feedback: 'Perfect sequence!'
      };
    }

    // Calculate partial credit if enabled
    if (question.partialCredit) {
      let correctPositions = 0;
      const length = Math.min(correctOrder.length, studentOrder.length);

      for (let i = 0; i < length; i++) {
        if (correctOrder[i] === studentOrder[i]) {
          correctPositions++;
        }
      }

      const percentage = correctOrder.length > 0 ? (correctPositions / correctOrder.length) : 0;

      return {
        isCorrect: percentage >= (question.passingPercentage || 0.5),
        score: points * percentage,
        correctPositions,
        totalItems: correctOrder.length,
        feedback: `${correctPositions} out of ${correctOrder.length} items in correct position`
      };
    }

    return {
      isCorrect: false,
      score: 0,
      feedback: 'Incorrect sequence'
    };
  }

  /**
   * Validate and score a hotspot/image mapping question
   * @param {Object} question - Question with defined hotspot regions
   * @param {Array} answer - Student's clicked coordinates [{x, y}]
   * @returns {Object} {isCorrect, score, feedback}
   */
  static scoreHotspotQuestion(question, answer) {
    const hotspots = question.hotspots || []; // [{id, x, y, radius, shape, ...}]
    const clicks = answer || [];
    const points = question.points || 1;
    const requiredHotspots = question.requiredHotspots || hotspots.length;

    const hitHotspots = new Set();

    // Check each click against all hotspots
    clicks.forEach(click => {
      hotspots.forEach(hotspot => {
        if (this._isPointInHotspot(click, hotspot)) {
          hitHotspots.add(hotspot.id);
        }
      });
    });

    const correctCount = hitHotspots.size;
    const percentage = requiredHotspots > 0 ? (correctCount / requiredHotspots) : 0;

    if (question.partialCredit) {
      return {
        isCorrect: percentage >= (question.passingPercentage || 0.5),
        score: points * percentage,
        hitCount: correctCount,
        requiredCount: requiredHotspots,
        feedback: `Identified ${correctCount} out of ${requiredHotspots} correct regions`
      };
    }

    return {
      isCorrect: correctCount === requiredHotspots,
      score: correctCount === requiredHotspots ? points : 0,
      hitCount: correctCount,
      requiredCount: requiredHotspots,
      feedback: correctCount === requiredHotspots ? 'All hotspots identified!' : 'Some hotspots missing'
    };
  }

  /**
   * Check if a point is within a hotspot region
   * @private
   */
  static _isPointInHotspot(point, hotspot) {
    const { x, y } = point;

    switch (hotspot.shape) {
      case 'circle':
        const dx = x - hotspot.x;
        const dy = y - hotspot.y;
        return Math.sqrt(dx * dx + dy * dy) <= hotspot.radius;

      case 'rectangle':
        return x >= hotspot.x && x <= hotspot.x + hotspot.width &&
               y >= hotspot.y && y <= hotspot.y + hotspot.height;

      case 'polygon':
        return this._isPointInPolygon(point, hotspot.points);

      default:
        return false;
    }
  }

  /**
   * Ray casting algorithm for point in polygon
   * @private
   */
  static _isPointInPolygon(point, polygonPoints) {
    const { x, y } = point;
    let inside = false;

    for (let i = 0, j = polygonPoints.length - 1; i < polygonPoints.length; j = i++) {
      const xi = polygonPoints[i].x, yi = polygonPoints[i].y;
      const xj = polygonPoints[j].x, yj = polygonPoints[j].y;

      const intersect = ((yi > y) !== (yj > y)) &&
        (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

      if (intersect) inside = !inside;
    }

    return inside;
  }

  /**
   * Validate and score a drag-and-drop question
   * @param {Object} question - Question with drop zones and items
   * @param {Object} answer - Student's placement {dropZoneId: [itemIds]}
   * @returns {Object} {isCorrect, score, feedback}
   */
  static scoreDragDropQuestion(question, answer) {
    const correctPlacements = question.correctPlacements || {}; // {dropZoneId: [itemIds]}
    const studentPlacements = answer || {};
    const points = question.points || 1;

    let correctItems = 0;
    let totalItems = 0;

    // Count total items
    Object.values(correctPlacements).forEach(items => {
      totalItems += items.length;
    });

    // Check correct placements
    Object.entries(correctPlacements).forEach(([zoneId, correctItems]) => {
      const studentItems = studentPlacements[zoneId] || [];

      correctItems.forEach(itemId => {
        if (studentItems.includes(itemId)) {
          correctItems++;
        }
      });
    });

    const percentage = totalItems > 0 ? (correctItems / totalItems) : 0;

    if (question.partialCredit) {
      return {
        isCorrect: percentage >= (question.passingPercentage || 0.5),
        score: points * percentage,
        correctItems,
        totalItems,
        feedback: `${correctItems} out of ${totalItems} items placed correctly`
      };
    }

    return {
      isCorrect: percentage === 1,
      score: percentage === 1 ? points : 0,
      correctItems,
      totalItems,
      feedback: percentage === 1 ? 'All items placed correctly!' : 'Some items incorrectly placed'
    };
  }

  /**
   * Evaluate code submission
   * @param {Object} question - Question with test cases
   * @param {String} answer - Student's code
   * @returns {Object} {isCorrect, score, feedback, testResults}
   */
  static scoreCodeQuestion(question, answer) {
    // This is a simplified version - in production, use a sandboxed environment
    const points = question.points || 1;
    const testCases = question.testCases || [];

    // For security, code execution should be done server-side in a sandboxed environment
    // This is a placeholder implementation
    return {
      isCorrect: false,
      score: 0,
      needsManualGrading: true,
      feedback: 'Code submission requires manual evaluation or server-side execution',
      note: 'For production: Implement server-side code execution in sandboxed environment (Docker, VM, etc.)',
      submittedCode: answer,
      testCases: testCases
    };
  }

  /**
   * Score essay question with rubric
   * @param {Object} question - Question with rubric criteria
   * @param {String} answer - Student's essay
   * @param {Object} rubricScores - Manual scores for each criterion
   * @returns {Object} {score, feedback}
   */
  static scoreEssayQuestion(question, answer, rubricScores = null) {
    const rubric = question.rubric || [];
    const points = question.points || 1;

    // Check basic requirements
    const minWords = question.minWords || 0;
    const maxWords = question.maxWords || Infinity;
    const wordCount = answer ? answer.trim().split(/\s+/).length : 0;

    if (!rubricScores) {
      // Not yet manually graded
      return {
        isCorrect: false,
        score: 0,
        needsManualGrading: true,
        wordCount,
        meetsWordCount: wordCount >= minWords && wordCount <= maxWords,
        feedback: `Essay submitted (${wordCount} words). Awaiting manual grading with rubric.`,
        rubric: rubric
      };
    }

    // Calculate score based on rubric
    let totalEarned = 0;
    let totalPossible = 0;

    rubric.forEach(criterion => {
      const earnedPoints = rubricScores[criterion.id] || 0;
      const possiblePoints = criterion.maxPoints || 0;

      totalEarned += earnedPoints;
      totalPossible += possiblePoints;
    });

    const percentage = totalPossible > 0 ? (totalEarned / totalPossible) : 0;

    return {
      isCorrect: percentage >= (question.passingPercentage || 0.6),
      score: points * percentage,
      rubricScore: totalEarned,
      rubricTotal: totalPossible,
      percentage: (percentage * 100).toFixed(1),
      wordCount,
      feedback: `Essay scored ${totalEarned}/${totalPossible} on rubric (${(percentage * 100).toFixed(1)}%)`
    };
  }

  /**
   * Handle audio/video-based questions
   * @param {Object} question - Question with media
   * @param {any} answer - Student's answer (could be multiple types)
   * @returns {Object} {isCorrect, score, feedback}
   */
  static scoreMediaQuestion(question, answer) {
    // Media questions can have different answer types
    const responseType = question.responseType || 'multiple-choice';
    const points = question.points || 1;

    switch (responseType) {
      case 'multiple-choice':
        return {
          isCorrect: answer === question.correct,
          score: answer === question.correct ? points : 0,
          feedback: answer === question.correct ? 'Correct!' : 'Incorrect answer'
        };

      case 'short-answer':
        return {
          isCorrect: false,
          score: 0,
          needsManualGrading: true,
          feedback: 'Audio/video response requires manual evaluation',
          submittedAnswer: answer
        };

      case 'timestamp':
        // For questions like "At what time does X happen?"
        const correctTime = question.correctTimestamp || 0;
        const studentTime = answer || 0;
        const tolerance = question.timestampTolerance || 2; // seconds

        const isCorrect = Math.abs(correctTime - studentTime) <= tolerance;

        return {
          isCorrect,
          score: isCorrect ? points : 0,
          feedback: isCorrect ? 'Correct timestamp!' : `Correct answer was around ${correctTime}s`
        };

      default:
        return {
          isCorrect: false,
          score: 0,
          needsManualGrading: true,
          feedback: 'This question requires manual grading'
        };
    }
  }

  /**
   * Main scoring function that routes to appropriate handler
   * @param {Object} question - Full question object
   * @param {any} answer - Student's answer
   * @param {Object} additionalData - Additional grading data (rubric scores, etc.)
   * @returns {Object} Scoring result
   */
  static scoreQuestion(question, answer, additionalData = {}) {
    const type = question.type;

    switch (type) {
      case 'matching':
        return this.scoreMatchingQuestion(question, answer);

      case 'ordering':
        return this.scoreOrderingQuestion(question, answer);

      case 'hotspot':
        return this.scoreHotspotQuestion(question, answer);

      case 'drag-drop':
        return this.scoreDragDropQuestion(question, answer);

      case 'code':
        return this.scoreCodeQuestion(question, answer);

      case 'essay':
        return this.scoreEssayQuestion(question, answer, additionalData.rubricScores);

      case 'audio-video':
        return this.scoreMediaQuestion(question, answer);

      default:
        return {
          isCorrect: false,
          score: 0,
          error: `Unknown question type: ${type}`
        };
    }
  }
}

// For Node.js module export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdvancedQuestionTypes;
}
