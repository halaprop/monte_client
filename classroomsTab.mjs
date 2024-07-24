import * as utils from './utils.mjs';
import { currentEditionYear, setDetailContainerHidden } from './index.mjs'; 


/*****************************************************************************/
// Classroom detail
/*****************************************************************************/

function renderDetailControlWithClassroom(classroom) {
  const tableBody = document.getElementById('detail-table-body');
  tableBody.innerHTML = '';

  const teachers = Object.values(classroom.teachers);
  tableBody.innerHTML += `<tr><td class="table-divider uk-flex uk-flex-middle">${teachers.length > 1 ? 'Teachers' : 'Teacher'}</td></tr>`;

  teachers.forEach((teacher, i, arr) => {
    let separator = i == arr.length - 1;
    tableBody.innerHTML += `
      <tr>
        <td>
          <div class="table-row-title uk-margin-remove-bottom">${teacher.firstName} ${teacher.lastName}</div>
          <p class="table-row-subtitle uk-margin-remove-top uk-margin-remove-bottom">${utils.prettyPhone(teacher.mobile)}</p>
          <p class="table-row-subtitle uk-margin-remove-top">${teacher.email}</p>
        </td>
      </tr>
    `;
  });

  const multigrade = classroom.grades.length > 1;
  tableBody.innerHTML += `<tr><td class="table-divider uk-flex uk-flex-middle">Students</td></tr>`;

  classroom.students.forEach(student => {
    const suffix = multigrade ? `<span style="float: right;"><small>${utils.prettyGrade(student.grade)}</small></span>` : '';
    tableBody.innerHTML += `
      <tr>
        <td>
          <p>${student.firstName} ${student.lastName}${suffix}</p>
        </td>
      </tr>
    `;
  })

}

/*****************************************************************************/
// Classrooms tab 
/*****************************************************************************/

function setAllComputedClassroomProps() {
  const currentEdition = utils.getEdition(currentEditionYear);
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
        classroom.searchString += `${staff.firstName} ${staff.lastName} `.toLowerCase();
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

    // remove classrooms which have no students assigned. (these are probably copy-paste errors from prior years' data)
    // teachers assigned to these rooms are probably not on staff in this edition. for now, leave them in the staff collection
    currentEdition.classrooms = Object.fromEntries(
      Object.entries(currentEdition.classrooms).filter(([_, classroom]) => classroom.students)
    );

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
    utils.setEdition(currentEditionYear, currentEdition);
  }
}

export function renderClassroomsTable(searchText) {
  setAllComputedClassroomProps();

  const currentEdition = utils.getEdition(currentEditionYear);
  let classrooms = Object.values(currentEdition.classrooms);
  if (searchText) {
    classrooms = classrooms.filter(classroom => classroom.searchString.includes(searchText.toLowerCase()));
  }

  const byGrade = classrooms.reduce((acc, classroom) => {
    const grade = classroom.grades.length <= 2 ? utils.prettyGrade(classroom.grades[0]) : "Multigrade";
    acc[grade] ??= [];
    acc[grade].push(classroom);
    return acc;
  }, {});

  const edgeKeys = { "Kinder": -1, "Multigrade": 1 };
  const byGradeKeys = Object.keys(byGrade).sort((a, b) => {
    if (a in edgeKeys || b in edgeKeys) {
      return (edgeKeys[a] || 0) - (edgeKeys[b] || 0);
    }
    return a.localeCompare(b);
  });

  const tableBody = document.getElementById('classrooms-table-body');
  tableBody.innerHTML = '';

  byGradeKeys.forEach(key => {
    const gradeRooms = byGrade[key].sort((a, b) => a.roomNumber - b.roomNumber);
    tableBody.innerHTML += `<tr><td class="table-divider uk-flex uk-flex-middle">${key}</td></tr>`;
    gradeRooms.forEach((classroom, i) => {
      let gradesString = '';
      if (classroom.grades.length > 1) {
        const gradeNumbers = utils.joinWithCommasAndAmp(classroom.grades.map(g => utils.prettyGrade(g, false)));
        gradesString = `, ${gradeNumbers} grades`
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

export function onSearchClassroomsInput(event) {
  const searchText = event.target.value.toLowerCase();
  renderClassroomsTable(searchText)
}