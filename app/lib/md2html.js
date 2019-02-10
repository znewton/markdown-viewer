const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const marked = require('marked');
const { JSDOM } = require('jsdom');
const highlightJS = require('highlight.js');

let tempPath = '';

function setTempPath(app) {
  console.log(app.constructor.name);
  tempPath = app.getPath('temp');
}

function createCSSTag(relPath, document) {
  const filepath = path.join(__dirname, relPath);
  const tag = document.createElement('link');
  tag.setAttribute('rel', 'stylesheet');
  tag.setAttribute('href', path.resolve(filepath));
  return tag;
}

function createJSTag(relPath, document) {
  const filepath = path.join(__dirname, relPath);
  const tag = document.createElement('script');
  tag.setAttribute('type', 'application/javascript');
  tag.setAttribute('src', path.resolve(filepath));
  return tag;
}

function generateHtmlFromMarkdown(file) {
  return new Promise((res, rej) => {
    if (!file) {
      return rej(false);
    }
    if (!file || !/\.md$/.test(file)) {
      return rej(`
File must be of type "Markdown" (.md).

Supplied filename: ${file}
`);
    } else {
      const mdFilePath = path.resolve(file);
      fs.readFile(mdFilePath, 'utf8', (err, data) => {
        if (err) {
          return rej(`
Failed to read ${mdFilePath}.

${err}
`);
        }

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
        const doc = dom.window.document;
        doc.body.classList.add('Markdown');
        res(dom);
      });
    }
  });
}

function addMarkdownStylingDependenciesToDom(dom) {
  let doc;
  if (dom instanceof JSDOM) {
    doc = dom.window.document;
  } else if (dom instanceof HTMLDocument) {
    doc = dom;
  } else {
    throw new Error(`
Invalid type: argument dom in function addMarkdownStylingDependenciesToDom in md2html.js

Expected: JSDOM or HTMLDocument
Found: ${dom.constructor.name}
`);
  }

  const mdCSSTag = createCSSTag('../md-viewer/md.css', doc);
  const mdJSTag = createJSTag('../md-viewer/md.js', doc);
  const highlightCSSTag = createCSSTag('../md-viewer/highlight.css', doc);
  doc.head.appendChild(mdCSSTag);
  doc.head.appendChild(highlightCSSTag);
  doc.body.appendChild(mdJSTag);

  return dom;
}

function writeTemporaryHtmlFile(dom) {
  if (!(dom instanceof JSDOM)) {
    throw new Error('dom argument must be an instance of JSDOM');
  }
  return new Promise((res, rej) => {
    if (!tempPath && !app) {
      rej('Temp path must be set or app must be accessible');
    }
    const tmpFilePath = path.join(
      tempPath || app.getPath('temp'),
      'temp.index.html'
    );

    fs.writeFile(tmpFilePath, dom.serialize(), err => {
      if (err) {
        rej(`
  Failed to write parsed HTML.

  ${err}
  `);
        return;
      }
      res(tmpFilePath);
    });
  });
}

async function openMarkdownFile(filepath) {
  const dom = await generateHtmlFromMarkdown(filepath);
  const domWithStyleDeps = await addMarkdownStylingDependenciesToDom(dom);
  const tmpFilepath = await writeTemporaryHtmlFile(domWithStyleDeps);
  return tmpFilepath;
}

module.exports = { setTempPath, openMarkdownFile };
