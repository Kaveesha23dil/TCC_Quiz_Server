const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

let currentQuiz = null;
const quizzesDir = path.join(__dirname, 'quizzes');
if (!fs.existsSync(quizzesDir)) fs.mkdirSync(quizzesDir);

ipcMain.on('save-quiz', (event, quizData) => {
  const fileName = `${quizData.name.replace(/\s+/g, '_')}_${Date.now()}.json`;
  const filePath = path.join(quizzesDir, fileName);

  quizData.date = new Date().toISOString();
  quizData.results = [];

  fs.writeFileSync(filePath, JSON.stringify(quizData, null, 2));
  console.log("✅ Quiz saved:", fileName);
});

ipcMain.handle('get-quizzes', () => {
  const files = fs.readdirSync(quizzesDir).filter(f => f.endsWith('.json'));
  return files;
});

ipcMain.handle('get-quiz-results', (event, quizFile) => {
  const filePath = path.join(quizzesDir, quizFile);
  if (fs.existsSync(filePath)) {
    const quizData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return quizData;
  }
  return null;
});

ipcMain.on('start-quiz', (event, quizFile) => {
  const filePath = path.join(quizzesDir, quizFile);
  if (fs.existsSync(filePath)) {
    currentQuiz = JSON.parse(fs.readFileSync(filePath));
    console.log("▶ Quiz started:", currentQuiz.name);

    // Notify renderer (admin dashboard)
    event.sender.send('quiz-started', currentQuiz);

    // Save quiz to temp so server.js can read
    fs.writeFileSync(path.join(__dirname, 'currentQuiz.json'), JSON.stringify(currentQuiz, null, 2));
  }
});

function getAllLocalIPs() {
  const nets = os.networkInterfaces();
  const results = [];

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      const isIPv4 = net.family === 'IPv4' && !net.internal;

      const skip = name.toLowerCase().includes('vmware') ||
                   name.toLowerCase().includes('virtual') ||
                   name.toLowerCase().includes('hyper') ||
                   name.toLowerCase().includes('vbox') ||
                   name.toLowerCase().includes('loopback');

      if (isIPv4 && !skip) {
        results.push({ name, address: net.address });
      }
    }
  }

  return results;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile('public/admin_welcome.html');

  ipcMain.on('get-ips', (event) => {
    const ips = getAllLocalIPs();
    event.sender.send('available-ips', ips);
  });

  ipcMain.on('start-server', (event, selectedIP) => {
    spawn('node', ['server.js'], { shell: true, stdio: 'inherit' });

    const port = 3000;
    event.sender.send('server-started', { ip: selectedIP, port });
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});
