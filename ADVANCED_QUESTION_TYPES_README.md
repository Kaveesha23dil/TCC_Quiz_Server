# Advanced Question Types Documentation

This document provides comprehensive information about the advanced question types available in the Quiz Server system.

## Table of Contents
1. [Matching Questions](#matching-questions)
2. [Ordering/Sequencing Questions](#ordering-sequencing-questions)
3. [Hotspot/Image Mapping Questions](#hotspot-image-mapping-questions)
4. [Drag-and-Drop Questions](#drag-and-drop-questions)
5. [Code Evaluation Questions](#code-evaluation-questions)
6. [Essay Questions with Rubric](#essay-questions-with-rubric)
7. [Audio/Video-Based Questions](#audio-video-based-questions)

---

## Matching Questions

**Type:** `matching`

Match items from a left column to corresponding items in a right column.

### Question Structure
```json
{
  "type": "matching",
  "question": "Match the programming languages with their primary use cases:",
  "points": 5,
  "partialCredit": true,
  "passingPercentage": 0.6,
  "leftItems": [
    {"id": "python", "content": "Python"},
    {"id": "javascript", "content": "JavaScript"},
    {"id": "sql", "content": "SQL"}
  ],
  "rightItems": [
    {"id": "data", "content": "Data Science"},
    {"id": "web", "content": "Web Development"},
    {"id": "database", "content": "Database Queries"}
  ],
  "correctPairs": {
    "python": "data",
    "javascript": "web",
    "sql": "database"
  }
}
```

### Answer Format
```json
{
  "python": "data",
  "javascript": "web",
  "sql": "database"
}
```

### Scoring Options
- **partialCredit**: Boolean - Award partial credit for partially correct answers
- **passingPercentage**: Number (0-1) - Minimum percentage to mark as correct (default: 0.5)

---

## Ordering/Sequencing Questions

**Type:** `ordering`

Arrange items in the correct sequence or order.

### Question Structure
```json
{
  "type": "ordering",
  "question": "Arrange the software development lifecycle phases in order:",
  "points": 4,
  "partialCredit": true,
  "shuffleItems": true,
  "items": [
    {"id": "req", "content": "Requirements Analysis"},
    {"id": "design", "content": "Design"},
    {"id": "impl", "content": "Implementation"},
    {"id": "test", "content": "Testing"},
    {"id": "deploy", "content": "Deployment"}
  ],
  "correctOrder": ["req", "design", "impl", "test", "deploy"]
}
```

### Answer Format
```json
["req", "design", "impl", "test", "deploy"]
```

### Features
- **Drag-and-drop interface** for reordering items
- **Up/Down buttons** for accessibility
- **Visual feedback** with numbered indicators
- **Partial credit** for partially correct sequences

---

## Hotspot/Image Mapping Questions

**Type:** `hotspot`

Click on specific regions of an image to answer the question.

### Question Structure
```json
{
  "type": "hotspot",
  "question": "Click on all the variables in this code diagram:",
  "instructions": "Click on each variable declaration in the image",
  "points": 3,
  "imageUrl": "/images/code-diagram.png",
  "maxClicks": 5,
  "partialCredit": true,
  "hotspots": [
    {
      "id": "var1",
      "shape": "circle",
      "x": 150,
      "y": 200,
      "radius": 20
    },
    {
      "id": "var2",
      "shape": "rectangle",
      "x": 300,
      "y": 150,
      "width": 80,
      "height": 30
    },
    {
      "id": "var3",
      "shape": "polygon",
      "points": [
        {"x": 400, "y": 100},
        {"x": 450, "y": 120},
        {"x": 420, "y": 150}
      ]
    }
  ],
  "requiredHotspots": 3
}
```

### Answer Format
```json
[
  {"x": 148, "y": 201},
  {"x": 315, "y": 162},
  {"x": 425, "y": 125}
]
```

### Supported Shapes
- **Circle**: Defined by center (x, y) and radius
- **Rectangle**: Defined by top-left corner (x, y), width, and height
- **Polygon**: Defined by array of points

---

## Drag-and-Drop Questions

**Type:** `drag-drop`

Drag items from a pool into appropriate drop zones/categories.

### Question Structure
```json
{
  "type": "drag-drop",
  "question": "Categorize these programming concepts:",
  "points": 6,
  "partialCredit": true,
  "items": [
    {"id": "var", "content": "Variables"},
    {"id": "func", "content": "Functions"},
    {"id": "loop", "content": "Loops"},
    {"id": "class", "content": "Classes"},
    {"id": "array", "content": "Arrays"}
  ],
  "dropZones": [
    {"id": "basics", "label": "Basic Concepts"},
    {"id": "advanced", "label": "Advanced Concepts"}
  ],
  "correctPlacements": {
    "basics": ["var", "loop", "array"],
    "advanced": ["func", "class"]
  }
}
```

### Answer Format
```json
{
  "basics": ["var", "loop", "array"],
  "advanced": ["func", "class"]
}
```

### Features
- **Visual drag-and-drop interface**
- **Multiple drop zones**
- **Item pooling system**
- **Partial credit support**

---

## Code Evaluation Questions

**Type:** `code`

Students write code that is evaluated against test cases.

### Question Structure
```json
{
  "type": "code",
  "question": "Write a function that reverses a string:",
  "instructions": "Create a function named reverseString that takes a string parameter and returns it reversed.",
  "points": 10,
  "language": "javascript",
  "template": "function reverseString(str) {\n  // Your code here\n}",
  "testCases": [
    {
      "input": "hello",
      "expectedOutput": "olleh",
      "description": "Basic string reversal"
    },
    {
      "input": "JavaScript",
      "expectedOutput": "tpircSavaJ",
      "description": "Mixed case string"
    }
  ]
}
```

### Answer Format
```json
"function reverseString(str) {\n  return str.split('').reverse().join('');\n}"
```

### Important Notes
- **Security**: Code execution should be sandboxed server-side
- **Manual Grading**: Currently requires manual evaluation
- **Future Enhancement**: Integrate with code execution environments (Docker, VM)

### Supported Languages
- JavaScript
- Python
- Java
- C++
- Any language (specify in `language` field)

---

## Essay Questions with Rubric

**Type:** `essay`

Extended written responses evaluated using a detailed rubric.

### Question Structure
```json
{
  "type": "essay",
  "question": "Explain the concept of Object-Oriented Programming and its benefits:",
  "instructions": "Write a comprehensive essay covering the main principles of OOP.",
  "points": 15,
  "minWords": 200,
  "maxWords": 500,
  "passingPercentage": 0.6,
  "rubric": [
    {
      "id": "understanding",
      "name": "Understanding of Concepts",
      "description": "Demonstrates clear understanding of OOP principles",
      "maxPoints": 5
    },
    {
      "id": "examples",
      "name": "Use of Examples",
      "description": "Provides relevant and accurate examples",
      "maxPoints": 5
    },
    {
      "id": "structure",
      "name": "Organization and Structure",
      "description": "Well-organized with clear introduction and conclusion",
      "maxPoints": 3
    },
    {
      "id": "grammar",
      "name": "Grammar and Spelling",
      "description": "Proper grammar, spelling, and writing mechanics",
      "maxPoints": 2
    }
  ]
}
```

### Answer Format
```json
"Object-Oriented Programming (OOP) is a programming paradigm that..."
```

### Manual Grading Required
Essay questions require manual grading using the rubric. Instructors assign points for each rubric criterion.

### Features
- **Word count tracking**
- **Min/max word requirements**
- **Detailed rubric display**
- **Real-time word counter**

---

## Audio/Video-Based Questions

**Type:** `audio-video`

Questions based on audio or video content.

### Question Structure

#### Multiple Choice Response
```json
{
  "type": "audio-video",
  "mediaType": "audio",
  "mediaUrl": "/media/pronunciation.mp3",
  "question": "What word is being pronounced?",
  "instructions": "Listen to the audio clip and select the correct word.",
  "points": 2,
  "responseType": "multiple-choice",
  "options": [
    {"value": "their", "text": "Their"},
    {"value": "there", "text": "There"},
    {"value": "they're", "text": "They're"}
  ],
  "correct": "there"
}
```

#### Short Answer Response
```json
{
  "type": "audio-video",
  "mediaType": "video",
  "mediaUrl": "/media/lecture.mp4",
  "question": "Summarize the main points of the lecture:",
  "points": 5,
  "responseType": "short-answer"
}
```

#### Timestamp Response
```json
{
  "type": "audio-video",
  "mediaType": "video",
  "mediaUrl": "/media/experiment.mp4",
  "question": "At what time does the reaction occur?",
  "points": 3,
  "responseType": "timestamp",
  "correctTimestamp": 45.5,
  "timestampTolerance": 2
}
```

### Response Types
- **multiple-choice**: Standard multiple choice based on media
- **short-answer**: Open-ended response (requires manual grading)
- **timestamp**: Identify specific time in media (seconds)

### Media Types
- **audio**: MP3, WAV, OGG audio files
- **video**: MP4, WebM video files

---

## Integration Guide

### 1. Include Required Files

Add these files to your HTML:

```html
<!-- CSS -->
<link rel="stylesheet" href="advanced-questions.css">

<!-- JavaScript -->
<script src="advanced-questions-ui.js"></script>
```

### 2. Rendering Questions

Use the UI component to render questions:

```javascript
// Get question container
const container = document.getElementById('question-container');

// Render based on question type
switch(question.type) {
  case 'matching':
    AdvancedQuestionsUI.renderMatchingQuestion(question, container, index);
    break;
  case 'ordering':
    AdvancedQuestionsUI.renderOrderingQuestion(question, container, index);
    break;
  case 'hotspot':
    AdvancedQuestionsUI.renderHotspotQuestion(question, container, index);
    break;
  case 'drag-drop':
    AdvancedQuestionsUI.renderDragDropQuestion(question, container, index);
    break;
  case 'code':
    AdvancedQuestionsUI.renderCodeQuestion(question, container, index);
    break;
  case 'essay':
    AdvancedQuestionsUI.renderEssayQuestion(question, container, index);
    break;
  case 'audio-video':
    AdvancedQuestionsUI.renderMediaQuestion(question, container, index);
    break;
}
```

### 3. Collecting Answers

Answers are automatically stored in `window.answers` array:

```javascript
// Submit answers
fetch('/api/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    participantId: userId,
    answers: window.answers
  })
});
```

### 4. Server-Side Scoring

The server automatically handles scoring for all question types:

```javascript
const AdvancedQuestionTypes = require('./advanced-question-types');

// Score a single question
const result = AdvancedQuestionTypes.scoreQuestion(question, answer);

// result contains:
// - isCorrect: boolean
// - score: number
// - feedback: string
// - needsManualGrading: boolean (if applicable)
```

---

## Best Practices

### 1. Partial Credit
Enable partial credit for complex questions to encourage student effort:
```json
{
  "partialCredit": true,
  "passingPercentage": 0.6
}
```

### 2. Clear Instructions
Always provide clear, specific instructions:
```json
{
  "instructions": "Drag each item to the appropriate category. Items can only be placed once."
}
```

### 3. Appropriate Points
Assign points based on question complexity:
- Simple matching: 2-5 points
- Complex ordering: 4-6 points
- Hotspot questions: 3-5 points
- Code questions: 8-15 points
- Essays: 10-20 points

### 4. Test Cases for Code
Provide comprehensive test cases:
```json
{
  "testCases": [
    { "input": "normal case", "expectedOutput": "..." },
    { "input": "edge case", "expectedOutput": "..." },
    { "input": "error case", "expectedOutput": "..." }
  ]
}
```

### 5. Rubric Design
Create specific, measurable rubric criteria:
```json
{
  "rubric": [
    {
      "name": "Accuracy",
      "description": "Information is factually correct",
      "maxPoints": 5
    }
  ]
}
```

---

## Accessibility Features

All advanced question types include:
- **Keyboard navigation** support
- **Screen reader** compatible labels
- **High contrast** mode support
- **Alternative input methods** (buttons in addition to drag-and-drop)

---

## Browser Compatibility

Tested and supported on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Required Features
- HTML5 Canvas (for hotspot questions)
- HTML5 Audio/Video (for media questions)
- Drag and Drop API
- ES6 JavaScript support

---

## Troubleshooting

### Images Not Loading
Ensure image URLs are accessible and use proper paths:
```json
"imageUrl": "/images/diagram.png"  // Relative to public folder
```

### Audio/Video Not Playing
Check media format compatibility and file paths:
- Use MP4 for video (H.264 codec)
- Use MP3 for audio
- Host files in the `public` folder

### Drag and Drop Not Working
Ensure the draggable attribute is set and event listeners are properly attached. The UI components handle this automatically.

### Code Execution Security
Never execute user code directly in the browser. Always:
1. Send code to server
2. Execute in sandboxed environment
3. Return results to client

---

## Future Enhancements

Planned features for future releases:
- Real-time code execution with sandbox
- AI-assisted essay grading
- Collaborative answering for team quizzes
- Question analytics and difficulty ratings
- Auto-generated feedback for common mistakes
- Export results to PDF with detailed breakdown

---

## Support

For questions or issues:
- Check the main README.md
- Review example quizzes in `/examples`
- Open an issue on GitHub

---

## License

Part of the Quiz Server project. See main LICENSE file.
