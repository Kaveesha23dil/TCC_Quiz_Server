const express = require('express');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const AchievementManager = require('./achievement-manager');
const plagiarismDetector = require('./plagiarism-detector');
const AdvancedQuestionTypes = require('./advanced-question-types');

const app = express();
const PORT = 3000;

app.use(express.static('public'));
app.use(express.json());

let participants = [];
let teams = []; // Teams storage

// Initialize Achievement Manager
const achievementManager = new AchievementManager();

// Student joins
app.post('/api/join', (req, res) => {
  const { name } = req.body;

  const id = uuidv4();  // unique ID
  participants.push({
    id,
    name,
    status: 'waiting', // waiting, in_progress, completed
    currentQuestion: 0,
    totalQuestions: 0,
    answeredCount: 0,
    progressPercentage: 0,
    joinedAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null,
    proctoringAlerts: [],
    lastActivity: new Date().toISOString()
  });

  console.log(`New participant: ${name} (ID: ${id})`);

  res.json({ message: 'Joined successfully!', id });
});

// Admin gets list
app.get('/api/participants', (req, res) => {
  res.json(participants);
});

// Update student progress (real-time tracking)
app.post('/api/update-progress', (req, res) => {
  const { participantId, currentQuestion, totalQuestions, answeredCount, progressPercentage, status } = req.body;

  const participant = participants.find(p => p.id === participantId);
  if (participant) {
    participant.currentQuestion = currentQuestion || 0;
    participant.totalQuestions = totalQuestions || 0;
    participant.answeredCount = answeredCount || 0;
    participant.progressPercentage = progressPercentage || 0;
    participant.lastActivity = new Date().toISOString();

    if (status) {
      participant.status = status;
      if (status === 'in_progress' && !participant.startedAt) {
        participant.startedAt = new Date().toISOString();
      }
    }

    console.log(`Progress update: ${participant.name} - Q${currentQuestion}/${totalQuestions} (${progressPercentage}%)`);
  }

  res.json({ success: true });
});

// Report proctoring event (real-time)
app.post('/api/proctoring-alert', (req, res) => {
  const { participantId, alertType, message, count } = req.body;

  const participant = participants.find(p => p.id === participantId);
  if (participant) {
    const alert = {
      type: alertType,
      message: message,
      count: count || 1,
      timestamp: new Date().toISOString()
    };

    participant.proctoringAlerts.push(alert);
    participant.lastActivity = new Date().toISOString();

    console.log(`⚠️ Proctoring Alert: ${participant.name} - ${alertType} (${count})`);
  }

  res.json({ success: true });
});

// Get monitoring data for admin dashboard
app.get('/api/monitoring', (req, res) => {
  // Return participants with their current status
  const monitoringData = participants.map(p => ({
    id: p.id,
    name: p.name,
    status: p.status,
    currentQuestion: p.currentQuestion,
    totalQuestions: p.totalQuestions,
    answeredCount: p.answeredCount,
    progressPercentage: p.progressPercentage,
    joinedAt: p.joinedAt,
    startedAt: p.startedAt,
    completedAt: p.completedAt,
    proctoringAlerts: p.proctoringAlerts,
    lastActivity: p.lastActivity,
    hasAlerts: p.proctoringAlerts.length > 0,
    alertCount: p.proctoringAlerts.length
  }));

  res.json(monitoringData);
});

// ==================== TEAM MANAGEMENT ENDPOINTS ====================

// Create a new team
app.post('/api/teams/create', (req, res) => {
  const { teamName, creatorId, creatorName, maxMembers } = req.body;

  if (!teamName || !creatorId || !creatorName) {
    return res.status(400).json({ message: 'Team name, creator ID, and creator name are required' });
  }

  // Check if team name already exists
  const existingTeam = teams.find(t => t.name.toLowerCase() === teamName.toLowerCase());
  if (existingTeam) {
    return res.status(400).json({ message: 'Team name already exists' });
  }

  const teamId = uuidv4();
  const newTeam = {
    id: teamId,
    name: teamName,
    creatorId: creatorId,
    maxMembers: maxMembers || 4,
    members: [
      {
        id: creatorId,
        name: creatorName,
        role: 'leader',
        joinedAt: new Date().toISOString()
      }
    ],
    status: 'waiting', // waiting, in_progress, completed
    currentQuestion: 0,
    totalQuestions: 0,
    answeredCount: 0,
    progressPercentage: 0,
    answers: {}, // Collaborative answers storage
    createdAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null,
    lastActivity: new Date().toISOString()
  };

  teams.push(newTeam);
  console.log(`Team created: ${teamName} by ${creatorName}`);

  res.json({ message: 'Team created successfully', team: newTeam });
});

// Join an existing team
app.post('/api/teams/join', (req, res) => {
  const { teamId, memberId, memberName } = req.body;

  if (!teamId || !memberId || !memberName) {
    return res.status(400).json({ message: 'Team ID, member ID, and member name are required' });
  }

  const team = teams.find(t => t.id === teamId);
  if (!team) {
    return res.status(404).json({ message: 'Team not found' });
  }

  // Check if team is full
  if (team.members.length >= team.maxMembers) {
    return res.status(400).json({ message: 'Team is full' });
  }

  // Check if member already in team
  if (team.members.some(m => m.id === memberId)) {
    return res.status(400).json({ message: 'You are already in this team' });
  }

  // Check if quiz already started
  if (team.status !== 'waiting') {
    return res.status(400).json({ message: 'Cannot join team after quiz has started' });
  }

  const newMember = {
    id: memberId,
    name: memberName,
    role: 'member',
    joinedAt: new Date().toISOString()
  };

  team.members.push(newMember);
  team.lastActivity = new Date().toISOString();

  console.log(`${memberName} joined team: ${team.name}`);

  res.json({ message: 'Joined team successfully', team });
});

// Leave a team
app.post('/api/teams/leave', (req, res) => {
  const { teamId, memberId } = req.body;

  const team = teams.find(t => t.id === teamId);
  if (!team) {
    return res.status(404).json({ message: 'Team not found' });
  }

  const memberIndex = team.members.findIndex(m => m.id === memberId);
  if (memberIndex === -1) {
    return res.status(404).json({ message: 'Member not found in team' });
  }

  const member = team.members[memberIndex];

  // If leader leaves, dissolve team or assign new leader
  if (member.role === 'leader') {
    if (team.members.length === 1) {
      // Last member, remove team
      const teamIndex = teams.findIndex(t => t.id === teamId);
      teams.splice(teamIndex, 1);
      console.log(`Team dissolved: ${team.name}`);
      return res.json({ message: 'Team dissolved', teamDissolved: true });
    } else {
      // Assign new leader
      team.members[memberIndex === 0 ? 1 : 0].role = 'leader';
    }
  }

  team.members.splice(memberIndex, 1);
  team.lastActivity = new Date().toISOString();

  console.log(`${member.name} left team: ${team.name}`);

  res.json({ message: 'Left team successfully' });
});

// Get all teams
app.get('/api/teams', (req, res) => {
  const teamsData = teams.map(t => ({
    id: t.id,
    name: t.name,
    creatorId: t.creatorId,
    maxMembers: t.maxMembers,
    currentMembers: t.members.length,
    members: t.members,
    status: t.status,
    progressPercentage: t.progressPercentage,
    createdAt: t.createdAt,
    canJoin: t.members.length < t.maxMembers && t.status === 'waiting'
  }));

  res.json(teamsData);
});

// Get specific team
app.get('/api/teams/:teamId', (req, res) => {
  const team = teams.find(t => t.id === req.params.teamId);
  if (!team) {
    return res.status(404).json({ message: 'Team not found' });
  }

  res.json(team);
});

// Update team answer (collaborative answering)
app.post('/api/teams/update-answer', (req, res) => {
  const { teamId, questionIndex, answer, memberId, memberName } = req.body;

  const team = teams.find(t => t.id === teamId);
  if (!team) {
    return res.status(404).json({ message: 'Team not found' });
  }

  // Verify member is in team
  if (!team.members.some(m => m.id === memberId)) {
    return res.status(403).json({ message: 'Not a team member' });
  }

  // Store answer with metadata
  team.answers[questionIndex] = {
    answer: answer,
    answeredBy: memberName,
    answeredById: memberId,
    timestamp: new Date().toISOString()
  };

  team.lastActivity = new Date().toISOString();

  console.log(`Team ${team.name}: ${memberName} answered Q${questionIndex}`);

  res.json({ message: 'Answer updated', team });
});

// Update team progress
app.post('/api/teams/update-progress', (req, res) => {
  const { teamId, currentQuestion, totalQuestions, answeredCount, progressPercentage, status } = req.body;

  const team = teams.find(t => t.id === teamId);
  if (team) {
    team.currentQuestion = currentQuestion || 0;
    team.totalQuestions = totalQuestions || 0;
    team.answeredCount = answeredCount || 0;
    team.progressPercentage = progressPercentage || 0;
    team.lastActivity = new Date().toISOString();

    if (status) {
      team.status = status;
      if (status === 'in_progress' && !team.startedAt) {
        team.startedAt = new Date().toISOString();
      }
    }

    console.log(`Team progress: ${team.name} - Q${currentQuestion}/${totalQuestions} (${progressPercentage}%)`);
  }

  res.json({ success: true });
});

// Submit team quiz answers
app.post('/api/teams/submit', (req, res) => {
  const { teamId, proctoringData } = req.body;
  const filePath = path.join(__dirname, 'currentQuiz.json');

  if (!fs.existsSync(filePath)) {
    return res.status(400).json({ message: "No active quiz" });
  }

  const team = teams.find(t => t.id === teamId);
  if (!team) {
    return res.status(404).json({ message: 'Team not found' });
  }

  const quiz = JSON.parse(fs.readFileSync(filePath));

  // Convert team answers object to array format
  const answers = [];
  quiz.questions.forEach((q, idx) => {
    if (team.answers[idx]) {
      answers[idx] = team.answers[idx].answer;
    } else {
      answers[idx] = null;
    }
  });

  // Evaluate score with weighted points
  let score = 0;
  let totalGraded = 0;
  let totalPoints = 0;
  let manualGradingNeeded = false;
  const detailedResults = [];

  quiz.questions.forEach((q, idx) => {
    const qType = q.type || 'multiple-choice';
    const qPoints = q.points || 1;
    const studentAnswer = answers[idx];
    let isCorrect = false;
    let needsManualGrading = false;

    switch(qType) {
      case 'multiple-choice':
      case 'true-false':
      case 'image-based':
        if (studentAnswer && studentAnswer === q.correct) {
          isCorrect = true;
          score += qPoints;
        }
        totalGraded++;
        totalPoints += qPoints;
        break;

      case 'multiple-answer':
        if (studentAnswer && Array.isArray(studentAnswer) && Array.isArray(q.correct)) {
          const sortedAnswer = [...studentAnswer].sort();
          const sortedCorrect = [...q.correct].sort();

          if (sortedAnswer.length === sortedCorrect.length &&
              sortedAnswer.every((val, idx) => val === sortedCorrect[idx])) {
            isCorrect = true;
            score += qPoints;
          }
        }
        totalGraded++;
        totalPoints += qPoints;
        break;

      case 'fill-blank':
        if (studentAnswer && typeof studentAnswer === 'string' &&
            typeof q.correct === 'string') {
          if (studentAnswer.toLowerCase().trim() === q.correct.toLowerCase().trim()) {
            isCorrect = true;
            score += qPoints;
          }
        }
        totalGraded++;
        totalPoints += qPoints;
        break;

      case 'short-answer':
        needsManualGrading = true;
        manualGradingNeeded = true;
        totalPoints += qPoints;
        break;

      // Advanced question types
      case 'matching':
      case 'ordering':
      case 'hotspot':
      case 'drag-drop':
      case 'code':
      case 'essay':
      case 'audio-video':
        const result = AdvancedQuestionTypes.scoreQuestion(q, studentAnswer);
        isCorrect = result.isCorrect;
        score += result.score || 0;
        needsManualGrading = result.needsManualGrading || false;
        if (result.needsManualGrading) {
          manualGradingNeeded = true;
        }
        if (!result.needsManualGrading) {
          totalGraded++;
        }
        totalPoints += qPoints;
        break;
    }

    detailedResults.push({
      questionIndex: idx,
      type: qType,
      points: qPoints,
      studentAnswer: studentAnswer,
      answeredBy: team.answers[idx]?.answeredBy || null,
      isCorrect: isCorrect,
      needsManualGrading: needsManualGrading
    });
  });

  // Mark team as completed
  team.status = 'completed';
  team.completedAt = new Date().toISOString();
  team.progressPercentage = 100;

  // Save team result
  quiz.results.push({
    teamId: team.id,
    teamName: team.name,
    teamMembers: team.members.map(m => m.name),
    isTeamSubmission: true,
    score,
    totalGraded,
    totalPoints,
    manualGradingNeeded,
    detailedResults,
    proctoringData: proctoringData || null,
    timestamp: new Date().toISOString()
  });

  fs.writeFileSync(filePath, JSON.stringify(quiz, null, 2));

  console.log(`Team ${team.name} completed quiz with score: ${score}/${totalPoints}`);

  res.json({
    score,
    totalGraded,
    totalPoints,
    manualGradingNeeded,
    detailedResults
  });
});

// Get team leaderboard
app.get('/api/teams/leaderboard', (req, res) => {
  const filePath = path.join(__dirname, 'currentQuiz.json');

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "No active quiz" });
  }

  const quiz = JSON.parse(fs.readFileSync(filePath));

  // Filter team results and calculate rankings
  const teamResults = quiz.results
    .filter(r => r.isTeamSubmission)
    .map(r => ({
      teamId: r.teamId,
      teamName: r.teamName,
      teamMembers: r.teamMembers,
      score: r.score,
      totalPoints: r.totalPoints,
      percentage: r.totalPoints > 0 ? (r.score / r.totalPoints * 100).toFixed(1) : 0,
      timestamp: r.timestamp,
      manualGradingNeeded: r.manualGradingNeeded
    }))
    .sort((a, b) => b.percentage - a.percentage);

  res.json(teamResults);
});

// ==================== END TEAM MANAGEMENT ====================

// Current quiz API
app.get('/api/currentQuiz', (req, res) => {
  const filePath = path.join(__dirname, 'currentQuiz.json');
  if (fs.existsSync(filePath)) {
    const quiz = JSON.parse(fs.readFileSync(filePath));
    res.json(quiz);
  } else {
    res.status(404).json({ message: "No quiz started yet" });
  }
});

// Example submit answers (students)
app.post('/api/submit', (req, res) => {
  const { participantId, answers, proctoringData, typingData } = req.body;
  const filePath = path.join(__dirname, 'currentQuiz.json');
  if (!fs.existsSync(filePath)) return res.status(400).json({ message: "No active quiz" });

  const quiz = JSON.parse(fs.readFileSync(filePath));

  // evaluate score with weighted points
  let score = 0;
  let totalGraded = 0;
  let totalPoints = 0;
  let manualGradingNeeded = false;
  const detailedResults = [];

  quiz.questions.forEach((q, idx) => {
    const qType = q.type || 'multiple-choice';
    const qPoints = q.points || 1;
    const studentAnswer = answers[idx];
    let isCorrect = false;
    let needsManualGrading = false;

    switch(qType) {
      case 'multiple-choice':
      case 'true-false':
      case 'image-based':
        // Simple comparison
        if (studentAnswer && studentAnswer === q.correct) {
          isCorrect = true;
          score += qPoints;
        }
        totalGraded++;
        totalPoints += qPoints;
        break;

      case 'multiple-answer':
        // Check if arrays match (all correct answers selected, no wrong ones)
        if (studentAnswer && Array.isArray(studentAnswer) && Array.isArray(q.correct)) {
          const sortedAnswer = [...studentAnswer].sort();
          const sortedCorrect = [...q.correct].sort();

          if (sortedAnswer.length === sortedCorrect.length &&
              sortedAnswer.every((val, idx) => val === sortedCorrect[idx])) {
            isCorrect = true;
            score += qPoints;
          }
        }
        totalGraded++;
        totalPoints += qPoints;
        break;

      case 'fill-blank':
        // Case-insensitive string comparison
        if (studentAnswer && typeof studentAnswer === 'string' &&
            typeof q.correct === 'string') {
          if (studentAnswer.toLowerCase().trim() === q.correct.toLowerCase().trim()) {
            isCorrect = true;
            score += qPoints;
          }
        }
        totalGraded++;
        totalPoints += qPoints;
        break;

      case 'short-answer':
        // Needs manual grading - don't count towards automatic score
        needsManualGrading = true;
        manualGradingNeeded = true;
        totalPoints += qPoints;
        break;

      // Advanced question types
      case 'matching':
      case 'ordering':
      case 'hotspot':
      case 'drag-drop':
      case 'code':
      case 'essay':
      case 'audio-video':
        const result = AdvancedQuestionTypes.scoreQuestion(q, studentAnswer);
        isCorrect = result.isCorrect;
        score += result.score || 0;
        needsManualGrading = result.needsManualGrading || false;
        if (result.needsManualGrading) {
          manualGradingNeeded = true;
        }
        if (!result.needsManualGrading) {
          totalGraded++;
        }
        totalPoints += qPoints;
        break;
    }

    detailedResults.push({
      questionIndex: idx,
      type: qType,
      points: qPoints,
      studentAnswer: studentAnswer,
      isCorrect: isCorrect,
      needsManualGrading: needsManualGrading
    });
  });

  // Get participant name and mark as completed
  const participant = participants.find(p => p.id === participantId);
  const participantName = participant ? participant.name : 'Unknown';

  // Calculate completion time
  let completionTime = null;
  if (participant && participant.startedAt) {
    const startTime = new Date(participant.startedAt);
    const endTime = new Date();
    completionTime = Math.floor((endTime - startTime) / 1000); // seconds
  }

  // Mark participant as completed
  if (participant) {
    participant.status = 'completed';
    participant.completedAt = new Date().toISOString();
    participant.progressPercentage = 100;
  }

  // Calculate percentage
  const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;

  // Prepare submission object for plagiarism analysis
  const submission = {
    participantId,
    participantName,
    answers,
    score,
    percentage,
    completionTime,
    timestamp: new Date().toISOString(),
    typingData: typingData || null,
    questionTimes: proctoringData?.timePerQuestion || null
  };

  // Perform plagiarism analysis
  let plagiarismAnalysis = null;
  try {
    plagiarismAnalysis = plagiarismDetector.analyzeSubmission(
      submission,
      quiz.results || [],
      quiz.questions
    );
    console.log(`Plagiarism analysis for ${participantName}: Suspicion Score = ${plagiarismAnalysis.suspicionScore}%`);

    if (plagiarismAnalysis.isSuspicious) {
      console.warn(`⚠️ FLAGGED: ${participantName} has been flagged for plagiarism (Score: ${plagiarismAnalysis.suspicionScore}%)`);
    }
  } catch (error) {
    console.error('Error performing plagiarism analysis:', error);
  }

  // Save result first to determine rank
  quiz.results.push({
    participantId,
    participantName,
    score,
    totalGraded,
    totalPoints,
    percentage,
    manualGradingNeeded,
    detailedResults,
    proctoringData: proctoringData || null,
    typingData: typingData || null,
    plagiarismAnalysis: plagiarismAnalysis,
    timestamp: new Date().toISOString(),
    completionTime
  });
  fs.writeFileSync(filePath, JSON.stringify(quiz, null, 2));

  // Calculate rank (position among all participants)
  const sortedResults = [...quiz.results].sort((a, b) => {
    if (b.percentage !== a.percentage) return b.percentage - a.percentage;
    if (a.completionTime && b.completionTime) return a.completionTime - b.completionTime;
    return 0;
  });
  const rank = sortedResults.findIndex(r => r.participantId === participantId) + 1;

  // Update achievement system
  let achievementData = null;
  try {
    achievementData = achievementManager.updateUserAfterQuiz(participantId, participantName, {
      quizName: quiz.name || 'Quiz',
      score,
      percentage,
      totalPoints,
      detailedResults,
      completionTime,
      rank
    });
  } catch (error) {
    console.error('Error updating achievements:', error);
  }

  res.json({
    score,
    totalGraded,
    totalPoints,
    percentage,
    manualGradingNeeded,
    detailedResults,
    achievements: achievementData ? {
      xpEarned: achievementData.xpEarned,
      totalXP: achievementData.profile.totalXP,
      unlockedAchievements: achievementData.unlockedAchievements,
      tierChanged: achievementData.tierChanged,
      newTier: achievementData.newTier,
      currentTier: achievementData.profile.currentTier,
      rank: rank
    } : null
  });
});

// Get quiz results (for results page)
app.get('/api/quiz-results/:quizFile', (req, res) => {
  const quizFile = req.params.quizFile;
  const filePath = path.join(__dirname, 'quizzes', quizFile);

  if (fs.existsSync(filePath)) {
    const quizData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    res.json(quizData);
  } else {
    res.status(404).json({ message: 'Quiz not found' });
  }
});

// Manual grading endpoint for short answer questions
app.post('/api/grade-short-answer', (req, res) => {
  const { quizFile, resultIndex, questionIndex, isCorrect } = req.body;
  const filePath = path.join(__dirname, 'quizzes', quizFile);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'Quiz not found' });
  }

  try {
    const quizData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Update the specific question result
    if (quizData.results[resultIndex] &&
        quizData.results[resultIndex].detailedResults[questionIndex]) {

      const result = quizData.results[resultIndex];
      const questionResult = result.detailedResults[questionIndex];

      // Mark as graded
      questionResult.isCorrect = isCorrect;
      questionResult.needsManualGrading = false;
      questionResult.manuallyGraded = true;

      // Update score
      if (isCorrect) {
        result.score++;
      }
      result.totalGraded++;

      // Check if all manual grading is complete
      const stillNeedsGrading = result.detailedResults.some(d => d.needsManualGrading);
      result.manualGradingNeeded = stillNeedsGrading;

      // Save updated quiz data
      fs.writeFileSync(filePath, JSON.stringify(quizData, null, 2));

      res.json({ message: 'Graded successfully', result });
    } else {
      res.status(400).json({ message: 'Invalid result or question index' });
    }
  } catch (error) {
    console.error('Error grading:', error);
    res.status(500).json({ message: 'Failed to save grade' });
  }
});

// ==================== PLAGIARISM DETECTION ENDPOINTS ====================

// Get plagiarism report for current quiz
app.get('/api/plagiarism/report', (req, res) => {
  const filePath = path.join(__dirname, 'currentQuiz.json');

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "No active quiz" });
  }

  try {
    const quiz = JSON.parse(fs.readFileSync(filePath));

    // Get all submissions with plagiarism analysis
    const flaggedSubmissions = quiz.results
      .filter(r => r.plagiarismAnalysis && r.plagiarismAnalysis.isSuspicious)
      .map(r => ({
        participantId: r.participantId,
        participantName: r.participantName,
        score: r.score,
        percentage: r.percentage,
        completionTime: r.completionTime,
        timestamp: r.timestamp,
        plagiarismAnalysis: r.plagiarismAnalysis
      }))
      .sort((a, b) => b.plagiarismAnalysis.suspicionScore - a.plagiarismAnalysis.suspicionScore);

    res.json({
      quizName: quiz.name,
      totalSubmissions: quiz.results.length,
      flaggedSubmissions: flaggedSubmissions.length,
      submissions: flaggedSubmissions
    });
  } catch (error) {
    console.error('Error getting plagiarism report:', error);
    res.status(500).json({ message: 'Error fetching plagiarism report' });
  }
});

// Get detailed plagiarism analysis for a specific submission
app.get('/api/plagiarism/submission/:participantId', (req, res) => {
  const { participantId } = req.params;
  const filePath = path.join(__dirname, 'currentQuiz.json');

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "No active quiz" });
  }

  try {
    const quiz = JSON.parse(fs.readFileSync(filePath));
    const submission = quiz.results.find(r => r.participantId === participantId);

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    res.json({
      participantName: submission.participantName,
      score: submission.score,
      percentage: submission.percentage,
      completionTime: submission.completionTime,
      timestamp: submission.timestamp,
      plagiarismAnalysis: submission.plagiarismAnalysis || null,
      typingData: submission.typingData || null,
      proctoringData: submission.proctoringData || null,
      detailedResults: submission.detailedResults
    });
  } catch (error) {
    console.error('Error getting submission details:', error);
    res.status(500).json({ message: 'Error fetching submission details' });
  }
});

// Get plagiarism report for a saved quiz
app.get('/api/plagiarism/report/:quizFile', (req, res) => {
  const quizFile = req.params.quizFile;
  const filePath = path.join(__dirname, 'quizzes', quizFile);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'Quiz not found' });
  }

  try {
    const quiz = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    const flaggedSubmissions = quiz.results
      .filter(r => r.plagiarismAnalysis && r.plagiarismAnalysis.isSuspicious)
      .map(r => ({
        participantId: r.participantId,
        participantName: r.participantName,
        score: r.score,
        percentage: r.percentage,
        completionTime: r.completionTime,
        timestamp: r.timestamp,
        plagiarismAnalysis: r.plagiarismAnalysis
      }))
      .sort((a, b) => b.plagiarismAnalysis.suspicionScore - a.plagiarismAnalysis.suspicionScore);

    res.json({
      quizName: quiz.name,
      totalSubmissions: quiz.results.length,
      flaggedSubmissions: flaggedSubmissions.length,
      submissions: flaggedSubmissions
    });
  } catch (error) {
    console.error('Error getting plagiarism report:', error);
    res.status(500).json({ message: 'Error fetching plagiarism report' });
  }
});

// ==================== LEADERBOARD & ACHIEVEMENTS ENDPOINTS ====================

// Get global leaderboard (all-time rankings)
app.get('/api/leaderboard/global', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  try {
    const leaderboard = achievementManager.getGlobalLeaderboard(limit);
    res.json(leaderboard);
  } catch (error) {
    console.error('Error getting global leaderboard:', error);
    res.status(500).json({ message: 'Error fetching leaderboard' });
  }
});

// Get current quiz leaderboard (real-time during quiz)
app.get('/api/leaderboard/quiz', (req, res) => {
  const filePath = path.join(__dirname, 'currentQuiz.json');

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "No active quiz" });
  }

  try {
    const quiz = JSON.parse(fs.readFileSync(filePath));
    const leaderboard = achievementManager.getQuizLeaderboard(quiz.name || 'Quiz', quiz.results || []);
    res.json(leaderboard);
  } catch (error) {
    console.error('Error getting quiz leaderboard:', error);
    res.status(500).json({ message: 'Error fetching quiz leaderboard' });
  }
});

// Get user stats, achievements, and progress
app.get('/api/achievements/user/:userId', (req, res) => {
  const { userId } = req.params;

  try {
    const stats = achievementManager.getUserStats(userId);
    if (!stats) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(stats);
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({ message: 'Error fetching user stats' });
  }
});

// Get achievement progress for a user
app.get('/api/achievements/progress/:userId', (req, res) => {
  const { userId } = req.params;

  try {
    const progress = achievementManager.getAchievementProgress(userId);
    res.json(progress);
  } catch (error) {
    console.error('Error getting achievement progress:', error);
    res.status(500).json({ message: 'Error fetching achievement progress' });
  }
});

// Get all achievement definitions
app.get('/api/achievements/all', (req, res) => {
  try {
    res.json({
      achievements: achievementManager.achievements,
      tiers: achievementManager.tiers,
      xpSources: achievementManager.xpSources
    });
  } catch (error) {
    console.error('Error getting achievements:', error);
    res.status(500).json({ message: 'Error fetching achievements' });
  }
});

// Get user's current tier information
app.get('/api/achievements/tier/:userId', (req, res) => {
  const { userId } = req.params;

  try {
    const profile = achievementManager.getUserProfile(userId);
    if (!profile) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentTier = achievementManager.getCurrentTier(profile.totalXP);
    const nextTier = achievementManager.getNextTier(profile.totalXP);

    res.json({
      currentTier,
      nextTier,
      xpToNextTier: nextTier ? nextTier.minXP - profile.totalXP : 0,
      progress: nextTier ? ((profile.totalXP - currentTier.minXP) / (nextTier.minXP - currentTier.minXP) * 100) : 100
    });
  } catch (error) {
    console.error('Error getting tier info:', error);
    res.status(500).json({ message: 'Error fetching tier information' });
  }
});

// ==================== END LEADERBOARD & ACHIEVEMENTS ====================

// Serve admin through /admin route too (alternative)
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening at http://0.0.0.0:${PORT}`);
});
