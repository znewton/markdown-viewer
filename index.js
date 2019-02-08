function insertTableLineNums() {
  const tables = document.getElementsByTagName('table');
  for (let i = 0; i < tables.length; i++) {
    const table = tables[i];
    const headerRow = table
      .getElementsByTagName('thead')[0]
      .getElementsByTagName('tr')[0];
    const headerCell = document.createElement('th');
    headerCell.innerText = '#';
    headerCell.className = 'tnum';
    headerRow.prepend(headerCell);

    const bodyRows = table
      .getElementsByTagName('tbody')[0]
      .getElementsByTagName('tr');
    for (let j = 0; j < bodyRows.length; j++) {
      const bodyRow = bodyRows[j];
      const cell = document.createElement('td');
      cell.setAttribute('data-key', `${j}`);
      cell.className = 'tnum';
      bodyRow.prepend(cell);
    }
  }
}

function sortTableRowsByColumn(table, col, sort) {
  const tbody = table.getElementsByTagName('tbody')[0];
  const rows = tbody.getElementsByTagName('tr');
  const newRows = [];
  for (let i = 0; i < rows.length; i++) {
    newRows.push(rows[i].cloneNode(true));
  }
  table.removeChild(tbody);

  newRows.sort(function compare(a, b) {
    if (sort == 0) {
      aKey = parseInt(a.getElementsByTagName('td')[0].getAttribute('data-key'));
      bKey = parseInt(b.getElementsByTagName('td')[0].getAttribute('data-key'));
      return aKey - bKey;
    }
    const aCell = a.getElementsByTagName('td')[col].innerText;
    const bCell = b.getElementsByTagName('td')[col].innerText;
    if (aCell < bCell) return -1 * sort;
    if (aCell > bCell) return 1 * sort;
    return 0;
  });

  const newTbody = document.createElement('tbody');
  for (let i = 0; i < newRows.length; i++) {
    newTbody.appendChild(newRows[i]);
  }
  table.appendChild(newTbody);
}

function addTableSortClickEvents() {
  insertTableLineNums();
  const tables = document.getElementsByTagName('table');
  for (let i = 0; i < tables.length; i++) {
    const table = tables[i];
    const tableHeaders = table
      .getElementsByTagName('thead')[0]
      .getElementsByTagName('th');
    for (let j = 1; j < tableHeaders.length; j++) {
      const tableHeader = tableHeaders[j];
      tableHeader.addEventListener(
        'click',
        (function() {
          const colNum = j;
          let sort = 0;
          return function() {
            sort = sort == 1 ? -1 : sort + 1;
            for (let k = 0; k < tableHeaders.length; k++) {
              tableHeaders[k].classList.remove('sort-asc');
              tableHeaders[k].classList.remove('sort-desc');
              if (sort && colNum == k) {
                tableHeader.classList.add(sort == 1 ? 'sort-asc' : 'sort-desc');
              }
            }
            sortTableRowsByColumn(table, colNum, sort);
          };
        })()
      );
    }
  }
}

function addSideNav() {
  const anchors = document.querySelectorAll('body > a[name]');
  if (anchors.length < 1) return;

  const navWrapper = document.createElement('nav');
  navWrapper.className = 'SideNav';
  const navAnchorMap = {};
  let activeAnchor;

  for (let i = 0; i < anchors.length; i++) {
    const anchor = anchors[i];
    const navAnchor = document.createElement('a');
    const anchorName = anchor.getAttribute('name');
    navAnchor.setAttribute('href', `#${anchorName}`);
    navAnchor.innerText = anchorName
      .replace('-', ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
    navAnchorMap[anchorName] = navAnchor;
    navWrapper.appendChild(navAnchor);
  }

  document.body.appendChild(navWrapper);
  document.body.classList.add('has-nav');

  const setActiveAnchor = a => {
    let activeNavAnchor = activeAnchor
      ? navAnchorMap[activeAnchor.getAttribute('name')]
      : null;
    if (activeNavAnchor) {
      activeNavAnchor.classList.remove('active');
    }
    activeAnchor = a;
    activeNavAnchor = activeAnchor
      ? navAnchorMap[activeAnchor.getAttribute('name')]
      : null;
    if (activeNavAnchor) {
      activeNavAnchor.classList.add('active');
    }
  };

  window.addEventListener('scroll', e => {
    let top = window.scrollY;
    if (top < anchors[0].offsetTop) {
      setActiveAnchor(null);
      return;
    }
    if (top + window.innerHeight == document.body.scrollHeight) {
      setActiveAnchor(anchors[anchors.length - 1]);
      return;
    }
    for (let i = 0; i < anchors.length; i++) {
      const anchor = anchors[i];
      const nextAnchor = i + 1 < anchors.length ? anchors[i + 1] : null;
      if (
        top >= anchor.offsetTop &&
        (!nextAnchor || top < nextAnchor.offsetTop)
      ) {
        setActiveAnchor(anchor);
        break;
      }
    }
  });
}

addTableSortClickEvents();
addSideNav();
