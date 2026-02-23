const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // Fiddle 환경에서는 path.join(__dirname, 'preload.js')가 안전합니다.
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadFile('index.html');
  
  
  // mainWindow.webContents.openDevTools();
}


ipcMain.handle('get-song-list', async () => {
  
  const songsPath = 'C:/Users/정형균(CB2영업국영업1팀)/OneDrive - Sindoh/바탕 화면/MyRhythmGame/songs';

  if (!fs.existsSync(songsPath)) {
    try {
      fs.mkdirSync(songsPath);
    } catch (e) {
      return []; 
    }
  }

  const files = fs.readdirSync(songsPath);
  return files
    .filter(file => file.endsWith('.mp3'))
    .map(file => ({
      name: file.replace('.mp3', ''),
      path: `songs/${file}`, 
      bpm: 120 
    }));
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
const mainWindow = new BrowserWindow({
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    webSecurity: false, 
    preload: path.join(__dirname, 'preload.js')
  }
});
