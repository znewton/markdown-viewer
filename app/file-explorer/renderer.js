const fs = require('fs');
const path = require('path');
const { app } = require('electron').remote;
const { setTempPath, openMarkdownFile } = require('../lib/md2html.js');

function clearElementChildren(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

async function listDirectory(dirPath) {
  return new Promise((res, rej) => {
    fs.readdir(
      dirPath,
      {
        withFileTypes: true,
      },
      (err, files) => {
        if (err) {
          rej(`
Failed to read directory: ${dirPath}

${err}
`);
        }
        const directories = [];
        if (dirPath !== '/') {
          directories.push('..');
        }
        const mdFiles = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (file.isDirectory()) {
            directories.push(file.name);
          } else if (file.isFile() && /\.md$/.test(file.name)) {
            mdFiles.push(file.name);
          }
        }
        res({
          base: dirPath,
          directories,
          files: mdFiles,
        });
      }
    );
  });
}

async function openFileInViewer(filePath) {
  const placeholder = document.getElementById('fv-placeholder');
  placeholder.style = 'display: none';
  const iframewrapper = document.getElementById('fv-iframewrapper');
  iframewrapper.style = '';
  clearElementChildren(iframewrapper);
  const iframe = document.createElement('iframe');

  setTempPath(app);
  const tmpFilePath = await openMarkdownFile(filePath);

  iframe.setAttribute('src', tmpFilePath);
  iframewrapper.appendChild(iframe);
}

async function buildFileTree(dir = '.', ...args) {
  const dirPath = path.resolve(dir, ...args);
  let dirListing;
  try {
    dirListing = await listDirectory(dirPath);
  } catch (e) {
    console.error(e);
    return;
  }
  const filetree = document.getElementById('filetree');
  clearElementChildren(filetree);
  const { base, directories, files } = dirListing;
  for (let d = 0; d < directories.length; d++) {
    const dirName = directories[d];
    const dirElement = document.createElement('button');
    dirElement.innerText = `${dirName}/`;
    dirElement.className = 'FileTree__directory';
    dirElement.addEventListener('click', () => {
      buildFileTree(base, dirName);
    });
    filetree.appendChild(dirElement);
  }
  const fileElements = [];
  for (let f = 0; f < files.length; f++) {
    const fileName = files[f];
    const fileElement = document.createElement('button');
    fileElement.innerText = `${fileName}`;
    fileElement.className = 'FileTree__file';
    fileElement.addEventListener('click', () => {
      for (let i = 0; i < fileElements.length; i++) {
        fileElements[i].classList.remove('open');
      }
      fileElement.classList.add('open');
      openFileInViewer(path.resolve(base, fileName));
    });
    fileElements.push(fileElement);
    filetree.appendChild(fileElement);
  }
}

buildFileTree();
