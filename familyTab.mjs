import * as utils from './utils.mjs'; 
import { setDetailContainerHidden } from './index.mjs'; 


/*****************************************************************************/
// Family detail
/*****************************************************************************/


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
    let mobile = utils.prettyPhone(parent.mobile)
    tableBody.innerHTML += tableRow(name, parent.email, mobile, i == arr.length - 1)
  })

  Object.values(family.students).forEach((student, i, arr) => {
    let name = `${student.firstName} ${student.lastName}`;
    let gradeRoom = `${utils.prettyGrade(student.grade)}, ${roomName(student.classroom)}`;
    tableBody.innerHTML += tableRow(name, gradeRoom, null, i == arr.length - 1)
  })

  if (family.address) {
    tableBody.innerHTML += tableRow(...utils.prettyAddress(family.address), false, 'h5');
  }
}

/*****************************************************************************/
// Families tab
/*****************************************************************************/

function setAllComputedFamilyProps() {
  const currentEditionYear = utils.getUserState().currentEditionYear;
  const currentEdition = utils.getEdition(currentEditionYear);
  const families = currentEdition.families;

  if (!currentEdition.hasFamiliesComputedProps) {
    for (let familyId in families) {
      const family = families[familyId];
      setComputedFamilyProps(family);
    }
    currentEdition.hasFamiliesComputedProps = true;
    utils.setEdition(currentEditionYear, currentEdition);
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
        return `${utils.joinWithCommasAndAmp(parents.map(parent => parent.firstName))} ${uniqueLastNames[0]}`;
      } else {
        return `The ${uniqueLastNames[0]} Family`;
      }
    }

    if (parents.length === 2) {
      return utils.joinWithCommasAndAmp(parents.map(parent => `${parent.firstName} ${parent.lastName}`));
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

export function renderFamiliesTable(searchText) {
  setAllComputedFamilyProps();
  const currentEditionYear = utils.getUserState().currentEditionYear;
  const currentEdition = utils.getEdition(currentEditionYear);
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

export function onSearchFamiliesInput(event) {
  const searchText = event.target.value.toLowerCase();
  renderFamiliesTable(searchText);
}
