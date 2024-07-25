
import * as utils from './utils.mjs'; 

// these imports are circular to kick off the ui:
import {  renderFamiliesTable, onSearchFamiliesInput } from './familyTab.mjs';
import {  renderStaffTable, onSearchStaffInput } from './staffTab.mjs';
import {  renderClassroomsTable, onSearchClassroomsInput } from './classroomsTab.mjs';
import {  renderSettingsTable } from './settingsTab.mjs';

/*****************************************************************************/
// Setup app
/*****************************************************************************/

export let currentEditionYear = 2017;
let activeTabIndex = 0;
let searchInputValues = { 0: '', 1: '', 2: '', 3: '' };

document.getElementById('app-title').innerHTML = `Montebook ${currentEditionYear}`;

// active tab
UIkit.util.on('#tab-content', 'shown', function () {
  searchInputValues[activeTabIndex] = searchInput.value;

  const activeTab = document.querySelector('.uk-switcher li.uk-active');
  activeTabIndex = Array.from(activeTab.parentNode.children).indexOf(activeTab);

  window.scrollTo(0, 0);
  searchInput.value = searchInputValues[activeTabIndex];
});

// login form
document.getElementById('login-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  loginAndFetch(email, password);
});

// search input
const searchInput = document.getElementById('search-input');
searchInput.addEventListener('input', event => {
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
  const data = utils.getEdition(currentEditionYear);
  if (data) {
    initializeTables();
  } else {
    UIkit.modal('#login-modal').show();
  }
}

async function loginAndFetch(email, password) {
  document.getElementById('spinner').style.display = 'flex';
  try {
    const currentEdition = await fetchCurrentEdition(password);
    utils.setEdition(currentEditionYear, currentEdition);
    initializeTables();
    UIkit.modal('#login-modal').hide();
    start();

  } catch (error) {
    console.error('Error on fetch', error);
    showLoginAlert('Unable to login.')
  } finally {
    document.getElementById('spinner').style.display = 'none';
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

// current edition is the edition for the current dataYear
async function fetchCurrentEdition(password) {
  try {
    const response = await fetch(`https://montebackup-server.onrender.com/data\?year=${currentEditionYear}`, {
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
