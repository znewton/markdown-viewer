const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');
const { openMarkdownFile } = require('./main-process/md2html');

function checkIfCalledViaCLI(args) {
  if (args && args.length > 1) {
    return true;
  }
  return false;
}
function errorAndExit(msg) {
  console.error(msg);
  app.quit();
}

let win;

function createWindow(file) {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: { nodeIntegration: true, webSecurity: true },
  });
  const loadFile = filePath => {
    win.loadURL(
      url.format({
        pathname: filePath,
        protocol: 'file:',
        slashes: true,
      })
    );
  };
  if (openMarkdownFile(file, loadFile, errorAndExit)) {
    loadFile(path.join(__dirname, 'index.html'));
  }
  win.on('closed', () => {
    win = null;
  });
}
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
app.on('activate', () => {
  if (win === null) {
    createWindow();
  }
});
app.on('ready', () => {
  const wasCalledViaCLI = checkIfCalledViaCLI(process.argv);
  if (wasCalledViaCLI) {
    // parse args
    let fileArg;
    for (let i = 1; i < process.argv.length; i++) {
      const arg = process.argv[i];
      if (/(--file|-f)/.test(arg)) {
        fileArg = process.argv[++i];
      } else if (/(--help|-h)/.test(arg)) {
        console.log(`
Usage: md [file] [options]
`);
        app.quit();
        return;
      } else {
        fileArg = process.argv[i];
      }
    }
    createWindow(fileArg);
  } else {
    createWindow();
  }
});
