import * as utils from './utils.mjs';

/*****************************************************************************/
// Staff detail
/*****************************************************************************/

function renderDetailControlWithStaff(staff) {
  const tableBody = document.getElementById('staff-table-body');
  tableBody.innerHTML = '';
}

/*****************************************************************************/
// Staff tab 
/*****************************************************************************/

function setAllComputedStaffProps() {
  const currentEditionYear = utils.getUserState().currentEditionYear;
  const currentEdition = utils.getEdition(currentEditionYear);
  const staff = currentEdition.staff;

  if (!currentEdition.hasStaffComputedProps) {
    for (let staffID in staff) {
      const s = staff[staffID];
      s.searchString = `${s.firstName} ${s.lastName}`.toLowerCase();
    }
    currentEdition.hasStaffComputedProps = true;
    utils.setEdition(currentEditionYear, currentEdition);
  }
}

export function renderStaffTable(searchText) {

  const staffRow = staff => `
    <tr>
      <td>
        <div class="table-row-title uk-margin-remove-bottom">${staff.firstName} ${staff.lastName}</div>
        <div class="table-row-subtitle uk-margin-remove-top uk-margin-remove-bottom">${utils.prettyPhone(staff.mobile)}</div>
        <div class="table-row-subtitle uk-margin-remove-top">${staff.email}</div>
      </td>
    </tr>
  `;


  setAllComputedStaffProps();

  const currentEditionYear = utils.getUserState().currentEditionYear;
  const currentEdition = utils.getEdition(currentEditionYear);
  let staff = Object.values(currentEdition.staff);

  if (searchText) {
    staff = staff.filter(s => s.searchString.includes(searchText.toLowerCase()));
  }

  const tableBody = document.getElementById('staff-table-body');
  tableBody.innerHTML = '';

  const principal = staff.find(s => s.title == 'principal');
  const teachers = staff.filter(s => s.title == 'teacher');
  const nonCert = staff.filter(s => s.title == 'staff');
  const office = staff.filter(s => s.title == 'office staff');

  if (principal) {
    tableBody.innerHTML += `<tr><td class="table-divider uk-flex uk-flex-middle">Principal</td></tr>`;
    tableBody.innerHTML += staffRow(principal);
  }

  if (office.length) {
    tableBody.innerHTML += `<tr><td class="table-divider uk-flex uk-flex-middle">Office Staff</td></tr>`;
    office.forEach(o => {
      tableBody.innerHTML += staffRow(o);
    });
  }

  if (teachers.length) {
    tableBody.innerHTML += `<tr><td class="table-divider uk-flex uk-flex-middle">Teachers</td></tr>`;
    teachers.forEach(teacher => {
      tableBody.innerHTML += staffRow(teacher);
    });
  }

  if (nonCert.length) {
    tableBody.innerHTML += `<tr><td class="table-divider uk-flex uk-flex-middle">Staff</td></tr>`;
    nonCert.forEach(nc => {
      tableBody.innerHTML += staffRow(nc);
    });
  }

}

export function onSearchStaffInput(event) {
  const searchText = event.target.value.toLowerCase();
  renderStaffTable(searchText);
}
