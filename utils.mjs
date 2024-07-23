/*****************************************************************************/
// Utils
/*****************************************************************************/

const ROOT_DATA_KEY = 'montebookData';

// storage
function getRootData() {
  const str = localStorage.getItem(ROOT_DATA_KEY);
  const value = str ? JSON.parse(str) : null;
  return value;
}

function setRootData(value) {
  localStorage.setItem(ROOT_DATA_KEY, JSON.stringify(value));
}

export function getEdition(year) {
  const data = getRootData();
  return data ? data[year] : null;
}

export function setEdition(year, edition) {
  const data = getRootData() || {};
  data[year] = edition;
  setRootData(data);
}

// other utils
export function joinWithCommasAndAmp(strings) {
  if (strings.length === 1) return strings[0];
  if (strings.length === 2) return strings.join(' & ');
  return strings.slice(0, -1).join(', ') + ', & ' + strings[strings.length - 1];
}

export function prettyPhone(string) {
  if (!string) return '';
  const digits = string.replace(/\D/g, '');
  if (digits.length < 10) return '';
  return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
}

export function prettyAddress(obj) {
  const address = [];

  const line1 = [obj.street, obj.number].filter(Boolean).join(' ');
  address.push(line1 || null);

  const line2 = [obj.city, obj.state].filter(Boolean).join(', ');
  const line2WithZip = [line2, obj.zip].filter(Boolean).join(' ');
  address.push(line2WithZip || null);

  address.push(prettyPhone(obj.phone) || null);

  return address;
}

export function prettyGrade(number, gradeSuffix = true) {
  if (number === 0) return "Kinder";
  const suffix = number === 1 ? "st" : number === 2 ? "nd" : number === 3 ? "rd" : "th";
  return `${number}${suffix}${gradeSuffix ? ' grade' : ''}`;
}
