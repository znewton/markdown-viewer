const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const marked = require('marked');
const { JSDOM } = require('jsdom');
const highlightJS = require('highlight.js');

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

function openMarkdownFile(file, callback, error) {
  if (!file) return false;

  if (!/\.md$/.test(file)) {
    error(`
File must be of type "Markdown" (.md).

Supplied filename: ${file}
`);
    return;
  } else {
    const mdFilePath = path.resolve(file);
    fs.readFile(mdFilePath, 'utf8', (err, data) => {
      if (err) {
        error(`
Failed to read ${mdFilePath}.

${err}
`);
        return;
      }

      const tmpFilePath = path.join(app.getPath('temp'), 'temp.index.html');
      const generatedHTML = marked(data, {
        highlight: function(code, lang) {
          try {
            return highlightJS.highlight(lang ? lang : 'plaintext', code).value;
          } catch (e) {
            return highlightJS.highlight('plaintext', code).value;
          }
        },
      });

      const dom = new JSDOM(generatedHTML);
      const doc = dom.window.document;
      const mdCSSTag = createCSSTag('../md-resources/md.css', doc);
      const mdJSTag = createJSTag('../md-resources/md.js', doc);
      const highlightCSSTag = createCSSTag(
        '../md-resources/highlight.css',
        doc
      );
      doc.head.appendChild(mdCSSTag);
      doc.head.appendChild(highlightCSSTag);
      doc.body.appendChild(mdJSTag);

      fs.writeFile(tmpFilePath, dom.serialize(), err => {
        if (err) {
          error(`
Failed to write parsed HTML.

${err}
`);
          return;
        }
        callback(tmpFilePath);
      });
    });
  }
}

module.exports = { openMarkdownFile };
