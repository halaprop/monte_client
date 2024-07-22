/*****************************************************************************/
// Setup app
/*****************************************************************************/

const ROOT_DATA_KEY = 'montebookData';
let currentEditionYear = 2013;
let activeTabIndex = 0;

// active tab
UIkit.util.on('#tab-content', 'shown', function () {
  const activeTab = document.querySelector('.uk-switcher li.uk-active');
  activeTabIndex = Array.from(activeTab.parentNode.children).indexOf(activeTab);
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
  renderClassroomsTable();
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

function prettyPhone(string) {
  const digits = string.replace(/\D/g, '');
  if (digits.length < 10) return '';
  return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
}

function prettyAddress(obj) {
  const address = [];

  const line1 = [obj.street, obj.number].filter(Boolean).join(' ');
  address.push(line1 || null);

  const line2 = [obj.city, obj.state].filter(Boolean).join(', ');
  const line2WithZip = [line2, obj.zip].filter(Boolean).join(' ');
  address.push(line2WithZip || null);

  address.push(prettyPhone(obj.phone) || null);

  return address;
}

function prettyGrade(number, units="grade") {
  if (number === 0) return "Kinder";
  const suffix = number === 1 ? "st" : number === 2 ? "nd" : number === 3 ? "rd" : "th";
  return `${number}${suffix} ${units}`;
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

function renderDetailControlWithFamily(family) {
  const tableRow = (title, subtitle, subtitle1, separator, firstTag = "h3") => {
    let titleMarkdown = '', subtitleMarkdown = '', subtitle1Markdown = '';

    if (title) titleMarkdown = `<${firstTag} class="uk-margin-remove-bottom">${title}</${firstTag}>`;
    if (subtitle) subtitleMarkdown = `<p class="uk-margin-remove-top uk-margin-remove-bottom">${subtitle}</p>`;
    if (subtitle1) subtitle1Markdown = `<p class="uk-margin-remove-top">${subtitle1}</p>`

    return `
      <tr>
        <td ${separator ? 'class="detail-table-separator"' : ''}>
          ${titleMarkdown} ${subtitleMarkdown} ${subtitle1Markdown}
        </td>
      </tr>
    `;
  }

  const roomName = path => {
    const segments = path.split('/');
    const roomSegment = segments[segments.length - 1];
    return roomSegment.replace(/([A-Za-z]+)(\d+)/, '$1 $2');
  };

  const tableBody = document.getElementById('detail-table-body');
  tableBody.innerHTML = '';
  Object.values(family.parents).forEach((parent, i, arr) => {
    let name = `${parent.firstName} ${parent.lastName}`;
    let mobile = prettyPhone(parent.mobile)
    tableBody.innerHTML += tableRow(name, parent.email, mobile, i == arr.length - 1)
  })

  Object.values(family.students).forEach((student, i, arr) => {
    let name = `${student.firstName} ${student.lastName}`;
    let gradeRoom = `${prettyGrade(student.grade)}, ${roomName(student.classroom)}`;
    tableBody.innerHTML += tableRow(name, gradeRoom, null, i == arr.length - 1)
  })

  if (family.address) {
    tableBody.innerHTML += tableRow(...prettyAddress(family.address), false, 'h5');
  }
}

function renderDetailControlWithClassroom(classroom) {
  const tableBody = document.getElementById('detail-table-body');
  tableBody.innerHTML = 'Room ' + classroom.roomNumber;
}


/*****************************************************************************/
// Families tab (might move to its own module)
/*****************************************************************************/

function setAllComputedFamilyProps() {
  const currentEdition = getCurrentEdition();
  const families = currentEdition.families;

  if (!currentEdition.hasFamiliesComputedProps) {
    for (let familyId in families) {
      const family = families[familyId];
      setComputedFamilyProps(family);
    }
    currentEdition.hasFamiliesComputedProps = true;
    setCurrentEdition(currentEdition);
  }
}

function setComputedFamilyProps(family) {
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

function renderFamiliesTable(searchText) {
  setAllComputedFamilyProps();
  const currentEdition = getCurrentEdition();
  let families = Object.values(currentEdition.families);

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
      const family = families.find(family => family.id == familyId);
      renderDetailControlWithFamily(family);
      setDetailContainerHidden(false);
    });
  });
}

function onSearchFamiliesInput(event) {
  const searchText = event.target.value.toLowerCase();
  renderFamiliesTable(searchText);
}


/*****************************************************************************/
// Rooms tab (might move to its own module)
/*****************************************************************************/

function setAllComputedClassroomProps() {
  const currentEdition = getCurrentEdition();
  const classrooms = currentEdition.classrooms;

  if (!currentEdition.hasClassroomsComputedProps) {
    const families = currentEdition.families;
    const staff = currentEdition.staff;

    Object.values(staff).forEach(staff => {
      if (staff.classroom) {
        const segments = staff.classroom.split('/');
        const roomID = segments[segments.length - 1];
        const classroom = classrooms[roomID];

        classroom.teachers ??= [];
        classroom.teachers.push(staff);
        classroom.searchString ??= '';
        classroom.searchString += `${staff.firstName} ${staff.lastName} `;
      }
    });

    Object.values(families).forEach(family => {
      family.students.forEach(student => {
        const segments = student.classroom.split('/');
        const roomID = segments[segments.length - 1];
        const classroom = classrooms[roomID];
        classroom.students ??= [];
        classroom.grades ??= [];
        classroom.students.push(student);
        if (!classroom.grades.includes(student.grade)) classroom.grades.push(student.grade);
      });
    });

    Object.values(classrooms).forEach(classroom => {
      if (classroom.teachers) {
        classroom.teachers.sort((a, b) => a.lastName.localeCompare(b.lastName));
        classroom.teacherNames = classroom.teachers.map(teacher => `${teacher.firstName} ${teacher.lastName}`).join(', ');
      }
      if (classroom.students) {
        classroom.students.sort((a, b) => a.lastName.localeCompare(b.lastName));
      }
      if (classroom.grades) classroom.grades.sort((a, b) => a - b);
    });
    currentEdition.hasClassroomsComputedProps = true;
    setCurrentEdition(currentEdition);
  }
}

function renderClassroomsTable(searchText) {
  setAllComputedClassroomProps();

  const currentEdition = getCurrentEdition();
  const classrooms = Object.values(currentEdition.classrooms);

  if (searchText) {
    classrooms = classrooms.filter(classroom => classroom.searchString.includes(searchText.toLowerCase()));
  }

  const byGrade = classrooms.reduce((acc, classroom) => {
    const grade = classroom.grades.length <= 2 ? prettyGrade(classroom.grades[0]) : "Multigrade";
    acc[grade] ??= [];
    acc[grade].push(classroom);
    return acc;
  }, {});

  const tableBody = document.getElementById('classrooms-table-body');
  tableBody.innerHTML = '';

  ["Kinder", "1st grade", "2nd grade", "3rd grade", "4th grade", "5th grade", "Multigrade"].forEach(key => {
    const gradeRooms = byGrade[key].sort((a, b) => a.roomNumber - b.roomNumber);
    tableBody.innerHTML += `<tr><td class="table-divider">${key}</td></tr>`;
    gradeRooms.forEach((classroom, i) => {
      let gradesString = '';
      if (classroom.grades.length > 1) {
        const gradeNumbers = joinWithCommasAndAmp(classroom.grades.map(g => prettyGrade(g, '')));
        gradesString =  `, ${gradeNumbers} grades`
      }
      tableBody.innerHTML += `
          <tr class="classroom-row" data-classroom-id="${classroom.id}">
            <td>
              <div class="table-row-title">${classroom.teacherNames}</div>
              <div class="table-row-subtitle">Room ${classroom.roomNumber}${gradesString}</div>
            </td>
          </tr>
      `;
    });
  });

  document.querySelectorAll('.classroom-row').forEach(row => {
    row.addEventListener('click', function () {
      const classroomID = this.dataset.classroomId;
      const classroom = classrooms.find(classroom => classroom.id == classroomID);
      renderDetailControlWithClassroom(classroom);
      setDetailContainerHidden(false);
    });
  });

}