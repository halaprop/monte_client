import { currentEditionYear } from "./index.mjs";
import { cachedEditions } from "./utils.mjs";


export function renderSettingsTable() {

  const settingsRow = year => {
    const icon = cachedEditions().includes(year) ? '' : '<span uk-icon="icon: download"></span>';
    const checked = year == currentEditionYear ? 'checked' : '';
    return `
      <tr>
        <td>
          <div class="uk-flex uk-flex-between uk-flex-middle">
            <div class="uk-flex uk-flex-left uk-flex-middle">
              <input type="radio" name="edition" id="year-${year}" value="${year}" ${checked}>&nbsp;  ${year}
              
            </div>
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
  })


}
