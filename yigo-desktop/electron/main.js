const { app, BrowserWindow, ipcMain, clipboard, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const si = require('systeminformation');
const screenshot = require('screenshot-desktop');

const configPath = path.join(app.getPath('userData'), 'yigo_config.json');

function getStoreVal(key) {
  try {
    const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return data[key];
  } catch (err) {
    return null;
  }
}

function setStoreVal(key, val) {
  try {
    let data = {};
    if (fs.existsSync(configPath)) {
      data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
    data[key] = val;
    fs.writeFileSync(configPath, JSON.stringify(data));
  } catch (err) {}
}

let mainWindow;

// Enable Auto Launch
app.setLoginItemSettings({
  openAtLogin: true,
  path: app.getPath('exe')
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    frame: false,
    thickFrame: true, // Fixes taskbar overlap on Windows when maximized
    icon: path.join(__dirname, '../public/yigo-logo-cropped.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  const { session } = require('electron');
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    // Automatically grant permissions
    if (permission === 'media' || permission === 'display-capture' || permission === 'camera' || permission === 'microphone') {
      callback(true);
    } else {
      callback(false);
    }
  });

  session.defaultSession.setPermissionCheckHandler((webContents, permission) => {
    if (permission === 'media' || permission === 'display-capture' || permission === 'camera' || permission === 'microphone') {
      return true;
    }
    return false;
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Settings & Config Handlers
ipcMain.handle('get-store-val', (event, key) => getStoreVal(key));
ipcMain.handle('set-store-val', (event, key, val) => setStoreVal(key, val));

ipcMain.handle('get-desktop-source', async () => {
  const { desktopCapturer } = require('electron');
  const sources = await desktopCapturer.getSources({ types: ['screen'] });
  return sources.length > 0 ? sources[0].id : null;
});

ipcMain.handle('get-tts-audio', async (event, text) => {
  try {
    const googleTTS = require('google-tts-api');
    // getAllAudioUrls handles long text by splitting it into chunks
    const audioUrls = googleTTS.getAllAudioUrls(text, {
      lang: 'hi',
      slow: false,
      host: 'https://translate.google.com',
      splitPunct: ',.!?'
    });
    const nodeFetch = (await import('node-fetch')).default;
    // Download all chunks and concat
    const buffers = [];
    for (const { url } of audioUrls) {
      const res = await nodeFetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      if (res.ok) buffers.push(Buffer.from(await res.arrayBuffer()));
    }
    if (buffers.length === 0) return null;
    return Buffer.concat(buffers).toString('base64');
  } catch (err) {
    console.error('TTS IPC Error:', err);
    return null;
  }
});

// System Telemetry
ipcMain.handle('get-system-stats', async () => {
  try {
    const [cpu, mem, battery, temp] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.battery(),
      si.cpuTemperature()
    ]);
    
    return {
      cpuLoad: cpu.currentLoad ? `${cpu.currentLoad.toFixed(1)}%` : '0%',
      memUsage: mem.total ? `${((mem.active / mem.total) * 100).toFixed(1)}%` : '0%',
      battery: battery.hasBattery ? `${battery.percent}%` : 'N/A',
      temp: temp.main ? `${Math.round(temp.main)}°C` : 'N/A'
    };
  } catch (err) {
    return { cpuLoad: 'Err', memUsage: 'Err', temp: 'Err', battery: 'Err' };
  }
});

// Native Window Controls
ipcMain.on('window-control', (event, command) => {
  if (!mainWindow) return;
  if (command === 'minimize') mainWindow.minimize();
  if (command === 'maximize') {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  }
  if (command === 'close') app.quit();
});

ipcMain.on('open-app', (event, appName) => {
  const name = appName.toLowerCase();
  let cmd = `start ${name}:`; // Try URL scheme first (works for whatsapp:, ms-settings:, etc)
  
  if (name.includes('youtube')) cmd = 'start https://youtube.com';
  else if (name.includes('google') || name.includes('browser')) cmd = 'start https://google.com';
  else if (name.includes('note') || name.includes('text')) cmd = 'notepad';
  else if (name.includes('calc')) cmd = 'calc';
  else if (name.includes('whatsapp')) cmd = 'start whatsapp:';
  
  require('child_process').exec(cmd, (err) => {
    if (err) {
      // Fallback
      require('child_process').exec(`start ${name}`, () => {});
    }
  });
});

// Media Vault (Screenshots)
const mediaDir = app.getPath('pictures');
if (!fs.existsSync(mediaDir)) {
  fs.mkdirSync(mediaDir, { recursive: true });
}

ipcMain.handle('take-screenshot', async () => {
  try {
    const imgBuffer = await screenshot();
    const filename = `YIGO_Capture_${Date.now()}.png`;
    const filepath = path.join(mediaDir, filename);
    fs.writeFileSync(filepath, imgBuffer);
    return { success: true, filepath, filename };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('get-media-files', () => {
  try {
    const files = fs.readdirSync(mediaDir)
      .filter(f => f.endsWith('.png') || f.endsWith('.jpg'))
      .map(f => {
        const filepath = path.join(mediaDir, f);
        const ext = path.extname(f).toLowerCase();
        let base64 = null;
        try {
          base64 = fs.readFileSync(filepath, 'base64');
        } catch(e) { return null; }
        return { name: f, data: `data:image/${ext === '.jpg' ? 'jpeg' : 'png'};base64,${base64}` };
      }).filter(Boolean);
    return files;
  } catch (err) {
    return [];
  }
});
