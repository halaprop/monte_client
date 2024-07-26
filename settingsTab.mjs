import * as utils from './utils.mjs';
import { switchToEdition } from './index.mjs';


export function renderSettingsTable() {
  const currentEditionYear = utils.getUserState().currentEditionYear;
  const settingsRow = year => {
    const icon = utils.cachedEditions().includes(year) ? '' : '<span uk-icon="icon: download"></span>';
    const checked = year == currentEditionYear ? 'checked' : '';
    return `
      <tr class="settings-row">
        <td>
          <div class="uk-flex uk-flex-between">
            <span><input type="radio" name="edition" value="${year}" ${checked}> ${year}</span>
            ${icon}
          </div>
        </td>
      </tr>
    `;
  }

  const tableBody = document.getElementById('settings-table-body');
  tableBody.innerHTML = '';

  ['2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021'].forEach(year => {
    tableBody.innerHTML += settingsRow(year);
  });

  document.querySelectorAll('input[name="edition"]').forEach((radio) => {
    radio.addEventListener('change', event => {
      const selectedYear = event.target.value;
      switchToEdition(selectedYear)
    });
  });

}
