
import * as utils from './utils.mjs';

// these imports are circular to kick off the ui:
import { renderFamiliesTable, onSearchFamiliesInput } from './familyTab.mjs';
import { renderStaffTable, onSearchStaffInput } from './staffTab.mjs';
import { renderClassroomsTable, onSearchClassroomsInput } from './classroomsTab.mjs';
import { renderSettingsTable } from './settingsTab.mjs';

/*****************************************************************************/
// Setup app
/*****************************************************************************/

// active tab
UIkit.util.on('#tab-content', 'shown', function () {
  const userState = utils.getUserState()
  const searchInputValues = userState.searchInputValues;
  let activeTabIndex = userState.activeTabIndex;

  searchInputValues[activeTabIndex] = searchInput.value;

  const activeTab = document.querySelector('.uk-switcher li.uk-active');
  activeTabIndex = Array.from(activeTab.parentNode.children).indexOf(activeTab);
  

  window.scrollTo(0, 0);
  searchInput.value = searchInputValues[activeTabIndex];

  userState.searchInputValues = searchInputValues;
  userState.activeTabIndex = activeTabIndex;
  utils.setUserState(userState);
});

function setActiveTab(tabIndex) {
  const tabsRoot = document.getElementById('tabs-root');
  UIkit.tab(tabsRoot).show(tabIndex);
}

// search input
const searchInput = document.getElementById('search-input');

searchInput.addEventListener('input', event => {
  const userState = utils.getUserState()
  let activeTabIndex = userState.activeTabIndex;

  if (activeTabIndex == 0) {
    onSearchFamiliesInput(event);
  } else if (activeTabIndex == 1) {
    onSearchStaffInput(event);
  } else if (activeTabIndex == 2) {
    onSearchClassroomsInput(event);
  }
});

document.getElementById('search-clear-button').addEventListener('click', event => {
  searchInput.value = '';
  searchInput.focus();
  searchInput.dispatchEvent(new Event('input'));
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
  const currentEditionYear = utils.getUserState().currentEditionYear;
  if (currentEditionYear) {
    document.getElementById('app-title').innerHTML = `Montebook ${currentEditionYear}`;
    const data = utils.getEdition(currentEditionYear);
    initializeTables();
  } else {
    setActiveTab(3);
    renderSettingsTable();
  }
  // UIkit.modal('#login-modal').show();
}

export function switchToEdition(selectedYear) {
  const currentEdition = utils.getEdition(selectedYear);
  if (currentEdition) {
    let userState = utils.getUserState();
    userState.currentEditionYear = selectedYear;
    utils.setUserState(userState);
    document.getElementById('app-title').innerHTML = `Montebook ${selectedYear || ''}`;
    initializeTables();
    setActiveTab(0);
  } else {
    document.querySelector('#login-modal').setAttribute('data-selected-year', selectedYear);
    UIkit.modal('#login-modal').show();
  }
}

// login form
document.getElementById('login-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const modalElement = document.querySelector('#login-modal');
  const selectedYear = modalElement.getAttribute('data-selected-year');

  loginAndFetch(email, password, selectedYear);
});

async function loginAndFetch(email, password, selectedYear) {
  document.getElementById('spinner').style.display = 'flex';
  try {
    const currentEdition = await fetchEdition(password, selectedYear);
    utils.setEdition(selectedYear, currentEdition);
    switchToEdition(selectedYear)
    UIkit.modal('#login-modal').hide();
  } catch (error) {
    console.error('Error on fetch', error);
    showLoginAlert('Unable to login.')
  } finally {
    document.getElementById('spinner').style.display = 'none';
  }
}

async function fetchEdition(password, year) {
  try {
    const response = await fetch(`https://montebackup-server.onrender.com/data\?year=${year}`, {
      headers: {
        'x-secret-key': password
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error, status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
}

function showLoginAlert(message) {
  const container = document.getElementById('login-alert-container');
  container.innerHTML = `
    <div class="uk-alert-danger" uk-alert>
        <a href class="uk-alert-close" uk-close></a>
        <p>${message}</p>
    </div>
  `;
}


function initializeTables() {
  renderFamiliesTable()
  renderClassroomsTable();
  renderStaffTable();
  renderSettingsTable();
}

/*****************************************************************************/
// Detail container
/*****************************************************************************/

export function setDetailContainerHidden(hidden) {
  const detailContainer = document.getElementById('detail-container');
  if (hidden) {
    detailContainer.classList.remove('show');
  } else {
    detailContainer.classList.add('show');
  }
}
