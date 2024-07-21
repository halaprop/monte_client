/*****************************************************************************/
// Setup app
/*****************************************************************************/

const ROOT_DATA_KEY = 'montebookData';
let currentEditionYear = 2013;
let activeTabIndex = 0;

// active tab
UIkit.util.on('#tab-content', 'shown', function () {
  activeTabIndex = UIkit.tab('#tab-content').index();
});

// login form
document.getElementById('login-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  loginAndFetch(email, password);
});

// search input
document.getElementById('search-input').addEventListener('input', event => {
  if (activeTabIndex == 0) {
    onSearchFamiliesInput(event);
  }
});

// search input
document.getElementById('detail-back-button').addEventListener('click', event => {
  setDetailContainerHidden(true);
});

/*****************************************************************************/
// App startup
/*****************************************************************************/

start();

function start() {
  const data = getCurrentEdition();
  if (data) {
    initializeTables();
  } else {
    UIkit.modal('#login-modal').show();
  }
}

async function loginAndFetch(email, password) {
  document.getElementById('spinner').style.display = 'flex';
  UIkit.modal('#login-modal').hide(); // Close the modal on successful login
  try {
    const currentEdition = await fetchCurrentEdition(password);
    if (currentEdition) {
      setCurrentEdition(currentEdition);
      initializeTables();
    }
  } catch (error) {
    console.error('Error during login and data fetch:', error);
  } finally {
    document.getElementById('spinner').style.display = 'none';
    start();
  }
}

// current edition is the edition for the current dataYear
async function fetchCurrentEdition(password) {
  try {
    const response = await fetch(`https://montebackup-server.onrender.com/data\?year=${currentEditionYear}`, {
      headers: {
        'x-secret-key': password
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

function initializeTables() {
  renderFamiliesTable()
}

/*****************************************************************************/
// Utils (might move to its own module)
/*****************************************************************************/

// storage
function getRootData() {
  const str = localStorage.getItem(ROOT_DATA_KEY);
  const value = str ? JSON.parse(str) : null;
  return value;
}

function setRootData(value) {
  localStorage.setItem(ROOT_DATA_KEY, JSON.stringify(value));
}

function getCurrentEdition() {
  const data = getRootData();
  return data ? data[currentEditionYear] : null;
}

function setCurrentEdition(edition) {
  const data = getRootData() || {};
  data[currentEditionYear] = edition;
  setRootData(data);
}

// other utils
function joinWithCommasAndAmp(strings) {
  if (strings.length === 1) return strings[0];
  if (strings.length === 2) return strings.join(' & ');
  return strings.slice(0, -1).join(', ') + ', & ' + strings[strings.length - 1];
}

/*****************************************************************************/
// Detail container
/*****************************************************************************/

function setDetailContainerHidden(hidden) {
  const detailContainer = document.getElementById('detail-container');
  if (hidden) {
    detailContainer.classList.remove('show');
  } else {
    detailContainer.classList.add('show');
  }
}



/*****************************************************************************/
// Families tab (might move to its own module)
/*****************************************************************************/

function setComputedProps(family) {
  const searchTerms = [];

  const uniqueParents = parentObject => {
    const uniqueMobiles = new Set();
    const parents = [];

    for (let key in parentObject) {
      const parent = parentObject[key];
      if (!uniqueMobiles.has(parent.mobile)) {
        uniqueMobiles.add(parent.mobile);
        parents.push(parent);
        searchTerms.push(parent.firstName, parent.lastName);
      }
    }
    return parents;
  }

  const familyName = parentObject => {
    const parents = uniqueParents(parentObject);
    const lastNames = parents.map(parent => parent.lastName);
    const uniqueLastNames = [...new Set(lastNames)];

    if (parents.length === 1) {
      const parent = parents[0];
      return `${parent.firstName} ${parent.lastName}`;
    }

    if (uniqueLastNames.length === 1) {
      if (parents.length === 2) {
        return `${joinWithCommasAndAmp(parents.map(parent => parent.firstName))} ${uniqueLastNames[0]}`;
      } else {
        return `The ${uniqueLastNames[0]} Family`;
      }
    }

    if (parents.length === 2) {
      return joinWithCommasAndAmp(parents.map(parent => `${parent.firstName} ${parent.lastName}`));
    } else {
      return `The ${uniqueLastNames.join(', ')} Family`;
    }
  }

  const studentsNames = studentObject => {
    const students = Object.values(studentObject);
    const firstNames = students.map(student => student.firstName);
    searchTerms.push(...firstNames);
    return firstNames;
  };

  family.familyName = familyName(family.parents);
  family.studentsNames = studentsNames(family.students).join(', ');
  family.searchString = Array.from(new Set(searchTerms)).join(' ').toLowerCase();
}

function familiesWithComputedProps() {
  const currentEdition = getCurrentEdition();
  const families = currentEdition.families;

  if (!currentEdition.hasFamiliesComputedProps) {
    for (let familyId in families) {
      const family = families[familyId];
      setComputedProps(family);
    }
    currentEdition.hasFamiliesComputedProps = true;
    setCurrentEdition(currentEdition);
  }
  return Object.values(families);
}

function renderFamiliesTable(searchText) {
  let families = familiesWithComputedProps();

  if (searchText) {
    families = families.filter(family => family.searchString.includes(searchText.toLowerCase()));
  }

  const tableBody = document.getElementById('family-table-body');
  tableBody.innerHTML = families.map(family => `
        <tr class="family-row" data-family-id="${family.id}">
          <td>
            <div class="table-row-title">${family.familyName}</div>
            <div class="table-row-subtitle">${family.studentsNames}</div>
          </td>
        </tr>
      `).join('\n');

  document.querySelectorAll('.family-row').forEach(row => {
    row.addEventListener('click', function () {
      const familyId = this.dataset.familyId;
      setDetailContainerHidden(false);
    });
  });
}


function filterFamilies(searchText) {
  let result = {};
  const families = getCurrentEdition().families;
  for (let familyId in families) {
    const family = families[familyId];
    const familyMembers = [...Object.values(family.parents), ...Object.values(family.students)];
    const membersString = familyMembers.map(person => `${person.firstName} ${person.lastName}`).join(' ').toLowerCase();
    const match = membersString.includes(searchText);
    if (match) {
      result[familyId] = family;
    }
  }
  return result;
}

function onSearchFamiliesInput(event) {
  const searchText = event.target.value.toLowerCase();
  renderFamiliesTable(searchText);
}


