const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // ---- Networking (server) ----
  getIPs: () => ipcRenderer.send('get-ips'),
  onAvailableIPs: (callback) => ipcRenderer.on('available-ips', (event, data) => callback(data)),
  startServer: (selectedIP) => ipcRenderer.send('start-server', selectedIP),
  onServerStarted: (callback) => ipcRenderer.on('server-started', (event, data) => callback(data)),

  // ---- Quiz Management ----
  saveQuiz: (quizData) => ipcRenderer.send('save-quiz', quizData),
  getQuizzes: () => ipcRenderer.invoke('get-quizzes'),
  getQuizResults: (quizFile) => ipcRenderer.invoke('get-quiz-results', quizFile),
  startQuiz: (quizName) => ipcRenderer.send('start-quiz', quizName),
  onQuizStarted: (callback) => ipcRenderer.on('quiz-started', (event, quiz) => callback(quiz))
});

