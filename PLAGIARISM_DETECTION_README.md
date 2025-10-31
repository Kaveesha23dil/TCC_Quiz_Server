# Plagiarism Detection System

## Overview

This comprehensive plagiarism detection system has been integrated into your Quiz application to automatically identify and flag suspicious quiz submissions. The system uses multiple detection methods to ensure academic integrity.

## Features Implemented

### 1. **Answer Similarity Comparison**
- Compares answers between all quiz submissions
- Uses advanced algorithms:
  - **Levenshtein Distance** - Measures character-level differences
  - **Jaccard Similarity** - Compares word sets for text-based answers
  - **Exact Matching** - For multiple choice and short answers
- Flags submissions with 85%+ similarity to other students
- Identifies specific matching questions

### 2. **Typing Pattern Analysis**
- Tracks keystroke timing for all text inputs
- Monitors typing speed (Words Per Minute)
- Detects:
  - **Copy-paste operations** - Sudden large content changes
  - **Unrealistic typing speeds** - Too fast (>500 WPM) or too slow (<10 WPM)
  - **Suspicious consistency** - Unnatural uniformity in typing speed
  - **Answer changes** - Tracks how many times answers are modified
  - **Pause patterns** - Identifies unusual pauses that may indicate external help

### 3. **Time-based Anomaly Detection**
- Monitors completion times and patterns
- Flags:
  - **Suspiciously fast completion** - Less than 2 seconds per question
  - **Instant answers** - Questions answered in <1 second
  - **Statistical outliers** - Submissions more than 2 standard deviations from average
  - **Uniform timing** - Unnaturally consistent time across questions
  - **Simultaneous submissions** - Multiple students submitting within 5 seconds

### 4. **Flagging System**
- Automatic risk scoring (0-100%)
  - **High Risk**: 80%+ suspicion score
  - **Medium Risk**: 60-79% suspicion score
  - **Low Risk**: 40-59% suspicion score
- Detailed flag reports with severity levels
- Comprehensive admin dashboard for review

## How It Works

### Data Collection (Client-Side)

The system automatically tracks:
1. **Typing Data**: Captured by `typing-pattern-tracker.js`
   - Keystroke timing per question
   - Typing speed calculations
   - Pause durations
   - Answer change frequency
   - Paste detection

2. **Quiz Behavior**:
   - Time spent on each question
   - Total completion time
   - Answer selection patterns

### Analysis (Server-Side)

When a quiz is submitted:
1. `plagiarism-detector.js` analyzes the submission
2. Compares against all previous submissions
3. Calculates suspicion scores across three categories:
   - Answer Similarity (50% weight)
   - Typing Pattern (30% weight)
   - Time Anomaly (20% weight)
4. Generates detailed flags for suspicious behaviors
5. Stores analysis with the submission

### Reporting (Admin Interface)

Admins can:
1. View overall plagiarism statistics
2. Filter flagged submissions by severity
3. Examine detailed analysis for each student
4. Review similarity matches between students
5. Access typing and timing data

## Files Modified/Created

### New Files
- `QuizServer/plagiarism-detector.js` - Core detection engine
- `QuizServer/public/typing-pattern-tracker.js` - Client-side tracking
- `QuizServer/public/plagiarism-report.html` - Admin interface

### Modified Files
- `QuizServer/server.js` - Integrated plagiarism analysis into submission endpoint
- `QuizServer/public/index.html` - Added typing pattern tracking
- `QuizServer/public/admin.html` - Added plagiarism report button

## API Endpoints

### Get Current Quiz Plagiarism Report
```
GET /api/plagiarism/report
```
Returns flagged submissions for the active quiz.

### Get Specific Submission Details
```
GET /api/plagiarism/submission/:participantId
```
Returns detailed plagiarism analysis for a specific student.

### Get Saved Quiz Plagiarism Report
```
GET /api/plagiarism/report/:quizFile
```
Returns plagiarism report for a completed quiz.

## Usage Instructions

### For Administrators

1. **View Reports**:
   - Navigate to Admin Dashboard
   - Click "View Plagiarism Report" button
   - Reports auto-refresh every 10 seconds

2. **Filter Results**:
   - Use filter buttons to view All/High/Medium/Low risk submissions
   - Click "View Details" to see comprehensive analysis

3. **Interpret Results**:
   - **Suspicion Score**: Overall plagiarism likelihood (0-100%)
   - **Answer Similarity**: How similar answers are to other students
   - **Typing Pattern**: Anomalies in typing behavior
   - **Time Anomaly**: Unusual timing patterns
   - **Flags**: Specific issues detected with descriptions

### For Students

The system runs transparently:
- No additional actions required
- Typing patterns are tracked automatically
- System does not interfere with quiz-taking
- Fair use of the quiz will not trigger false positives

## Detection Thresholds

### Answer Similarity
- **Trigger**: 85%+ similarity with another submission
- **Method**: Compares all answers across submissions
- **Weight**: 50% of overall score

### Typing Pattern Anomalies
- **Slow Typing**: <10 WPM
- **Fast Typing**: >500 WPM
- **Low Variance**: StdDev < 10% of average
- **Weight**: 30% of overall score

### Time Anomalies
- **Too Fast**: <2 seconds per question
- **Statistical Outlier**: >2 standard deviations from mean
- **Weight**: 20% of overall score

## Technical Details

### Algorithms Used

1. **Levenshtein Distance**
   - Calculates minimum edits needed to transform one string to another
   - Used for comparing text-based answers
   - Normalized to 0-1 scale

2. **Jaccard Similarity**
   - Measures word overlap between answers
   - Formula: `|A ∩ B| / |A ∪ B|`
   - Effective for longer text answers

3. **Statistical Analysis**
   - Mean and standard deviation calculations
   - Outlier detection (>2σ from mean)
   - Variance analysis for consistency checks

### Data Storage

Plagiarism analysis is stored with each submission:
```json
{
  "participantId": "uuid",
  "participantName": "Student Name",
  "plagiarismAnalysis": {
    "isSuspicious": true,
    "suspicionScore": 85,
    "scores": {
      "answerSimilarity": 90,
      "typingPattern": 75,
      "timeAnomaly": 60
    },
    "flags": [...]
  },
  "typingData": {...}
}
```

## Best Practices

### For Fair Detection
1. Allow reasonable time limits for quizzes
2. Consider question difficulty when interpreting time anomalies
3. Review high-risk cases manually before taking action
4. Use plagiarism scores as indicators, not absolute proof

### For Privacy
1. Typing data is only used for plagiarism detection
2. Data is stored securely with quiz results
3. Only admins can access detailed reports
4. Students are not notified of flags automatically

### For Accuracy
1. System performs better with more submissions (n≥3)
2. Shorter quizzes may have higher false positive rates
3. Multiple-choice questions with few options may show natural similarity
4. Consider combining with proctoring features for comprehensive monitoring

## Troubleshooting

### High False Positive Rate
- Check if questions have very similar correct answers
- Verify typing speed thresholds are appropriate
- Review time limits (too short may flag fast typists)

### No Detections
- Ensure `typingData` is being captured (check browser console)
- Verify plagiarism-detector.js is loaded on server
- Check API endpoints are responding correctly

### Performance Issues
- Plagiarism analysis runs on each submission
- For large quizzes (>100 participants), consider batch analysis
- Reports auto-refresh every 10s - increase interval if needed

## Future Enhancements

Potential additions:
- Machine learning-based detection
- Behavioral biometrics (mouse movement patterns)
- Answer consistency analysis across multiple quizzes
- Integration with external plagiarism databases
- Automated email notifications for high-risk cases
- Export reports to PDF/CSV

## Support

For issues or questions about the plagiarism detection system:
1. Check console logs for errors
2. Verify all files are properly loaded
3. Test with sample quizzes first
4. Review API endpoint responses

## Conclusion

This plagiarism detection system provides a comprehensive, multi-layered approach to maintaining quiz integrity. By combining answer similarity, typing pattern analysis, and time-based anomaly detection, it can effectively identify suspicious submissions while minimizing false positives.

The system operates transparently for students and provides administrators with actionable insights through an intuitive interface.
