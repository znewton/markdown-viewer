const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');
const marked = require('marked');
const { JSDOM } = require('jsdom');
const highlightJS = require('highlight.js');

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
const fileArg = process.argv[2];

let win;

function createWindow(file) {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: { nodeIntegration: true, webSecurity: true },
  });
  if (file) {
    if (!/\.md$/.test(file)) {
      errorAndExit(`
File must be of type "Markdown" (.md).

Supplied filename: ${file}
`);
      return;
    } else {
      const mdFilePath = path.resolve(file);
      fs.readFile(mdFilePath, 'utf8', (err, data) => {
        if (err) {
          errorAndExit(`
Failed to read ${mdFilePath}.

${err}
`);
          return;
        }

        const tmpFilePath = path.join(app.getPath('temp'), 'temp.index.html');
        const generatedHTML = marked(data, {
          highlight: function(code, lang) {
            try {
              return highlightJS.highlight(lang ? lang : 'plaintext', code)
                .value;
            } catch (e) {
              return highlightJS.highlight('plaintext', code).value;
            }
          },
        });
        const dom = new JSDOM(generatedHTML);
        const document = dom.window.document;
        const cssFilePath = path.join(__dirname, 'index.css');
        const cssTag = document.createElement('link');
        cssTag.setAttribute('rel', 'stylesheet');
        cssTag.setAttribute('href', path.resolve(cssFilePath));
        const highlightCssFilePath = path.join(__dirname, 'highlight.css');
        const highlightCssTag = document.createElement('link');
        highlightCssTag.setAttribute('rel', 'stylesheet');
        highlightCssTag.setAttribute(
          'href',
          path.resolve(highlightCssFilePath)
        );
        const jsFilePath = path.join(__dirname, 'index.js');
        const jsTag = document.createElement('script');
        jsTag.setAttribute('type', 'application/javascript');
        jsTag.setAttribute('src', path.resolve(jsFilePath));
        document.head.appendChild(cssTag);
        document.head.appendChild(highlightCssTag);
        document.body.appendChild(jsTag);
        fs.writeFile(tmpFilePath, dom.serialize(), err => {
          if (err) {
            errorAndExit(`
Failed to write parsed HTML.

${err}
`);
            return;
          }
          win.loadURL(
            url.format({
              pathname: tmpFilePath,
              protocol: 'file:',
              slashes: true,
            })
          );
        });
      });
    }
  } else {
    const filePath = path.join(__dirname, 'index.html');
    win.loadURL(
      url.format({
        pathname: filePath,
        protocol: 'file:',
        slashes: true,
      })
    );
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
    for (let i = 1; i < process.argv.length; i++) {
      const arg = process.argv[i];
      if (/(--file|-f)/.test(arg)) {
        createWindow(process.argv[++i]);
      } else if (/(--help|-h)/.test(arg)) {
        console.log(`
Usage: md [file] [options]
`);
        app.quit();
        return;
      }
    }
  } else {
    createWindow();
  }
});
