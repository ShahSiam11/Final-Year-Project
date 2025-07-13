const  sideMenu = document.querySelector('aside');
const menuBtn = document.querySelector('#menu_bar');
const closeBtn = document.querySelector('#close_btn');
const themeToggler = document.querySelector('.theme-toggler');
const sidebarLinks = document.querySelectorAll('.sidebar a');


menuBtn.addEventListener('click',()=>{
       sideMenu.style.display = "block"
})
closeBtn.addEventListener('click',()=>{
    sideMenu.style.display = "none"
})

themeToggler.addEventListener('click',()=>{
     document.body.classList.toggle('dark-theme-variables')
     themeToggler.querySelector('span:nth-child(1').classList.toggle('active')
     themeToggler.querySelector('span:nth-child(2').classList.toggle('active')
})

sidebarLinks.forEach(link => {
    link.addEventListener('click', () => {
        // Remove "active" class from all links
        sidebarLinks.forEach(link => link.classList.remove('active'));
        // Add "active" class to the clicked link
        link.classList.add('active');
    });
});

fetch('/attend-info')
  .then((response) => {
    if (!response.ok) {
      throw new Error('Unauthorized');
    }
    return response.json();
  })
  .then((data) => {
    const greeting = document.getElementById('greeting');
    const roleElement = document.getElementById('role');
    const nameElement = document.getElementById('name');
    const recentOrderBody = document.querySelector('.recent_order tbody'); // Get the table body

    // Get the current time of the user's local timezone
    const currentHour = new Date().getHours();
    let timeOfDayGreeting = '';

    // Determine the time of day for the greeting
    if (currentHour >= 5 && currentHour < 12) {
      timeOfDayGreeting = 'Good morning';
    } else if (currentHour >= 12 && currentHour < 18) {
      timeOfDayGreeting = 'Good afternoon';
    } else {
      timeOfDayGreeting = 'Good evening';
    }

    // Set the greeting and other user info
    greeting.textContent = `${timeOfDayGreeting}, ${data.name}`;
    nameElement.textContent = `Name: ${data.name}`;
    roleElement.textContent = `Role: ${data.role}`;

    // Populate the recent attendance table
    if (data.recentAttendance.length > 0) {
      // Clear previous table rows (if any)
      recentOrderBody.innerHTML = '';

      // Get the most recent three attendance records
      const recentRecords = data.recentAttendance.slice(0, 3);

      recentRecords.forEach((attendance) => {
        const row = document.createElement('tr');

        // Create table cells with dynamic data
        const dateCell = document.createElement('td');
        dateCell.textContent = attendance.date;

        const timeJoinedCell = document.createElement('td');
        timeJoinedCell.textContent = attendance.time_joined;

        const subjectCell = document.createElement('td');
        subjectCell.textContent = attendance.subject;

        const classTypeCell = document.createElement('td');
        classTypeCell.textContent = attendance.class_type;

        const timeStayedCell = document.createElement('td');
        timeStayedCell.textContent = attendance.time_stayed;

        const attendanceCell = document.createElement('td');
        attendanceCell.classList.add(attendance.attendance === 'Marked' ? 'success' : 'warning');
        attendanceCell.textContent = attendance.attendance;

        const detailsCell = document.createElement('td');
        detailsCell.classList.add('primary');
        detailsCell.innerHTML = '<a href="#">Details</a>';

        // Append the cells to the row
        row.appendChild(dateCell);
        row.appendChild(timeJoinedCell);
        row.appendChild(subjectCell);
        row.appendChild(classTypeCell);
        row.appendChild(timeStayedCell);
        row.appendChild(attendanceCell);
        row.appendChild(detailsCell);

        // Append the row to the table body
        recentOrderBody.appendChild(row);
      });
    } else {
      // If no records found, display a message
      const row = document.createElement('tr');
      const noDataCell = document.createElement('td');
      noDataCell.colSpan = 7;
      noDataCell.textContent = 'No recent attendance records available.';
      row.appendChild(noDataCell);
      recentOrderBody.appendChild(row);
    }
  })
  .catch((error) => {
    console.error('Error fetching user info:', error);
    document.getElementById('greeting').textContent = "Hi, Guest";
  });

// Function to update attendance progress dynamically
function updateAttendanceProgress_lec(totalMarked, totalNotMarked) {
  const percentage = Math.round((totalMarked / (totalMarked + totalNotMarked)) * 100);
  const circle = document.getElementById('progress-circle_lec');
  const percentageElement = document.getElementById('attendance-percentage_lec');

  // Update the circle's progress
  const circlePerimeter = 2 * Math.PI * 30; // 30 is the radius
  const offset = circlePerimeter - (percentage / 100) * circlePerimeter;

  circle.style.strokeDasharray = circlePerimeter;
  circle.style.strokeDashoffset = offset;

  // Update the percentage text
  percentageElement.textContent = `${percentage}%`;
}


// Function to update attendance progress dynamically
function updateAttendanceProgress_lab(totalMarked, totalNotMarked) {
  const percentage = Math.round((totalMarked / (totalMarked + totalNotMarked)) * 100);
  const circle = document.getElementById('progress-circle_lab');
  const percentageElement = document.getElementById('attendance-percentage_lab');

  // Update the circle's progress
  const circlePerimeter = 2 * Math.PI * 30; // 30 is the radius
  const offset = circlePerimeter - (percentage / 100) * circlePerimeter;

  circle.style.strokeDasharray = circlePerimeter;
  circle.style.strokeDashoffset = offset;

  // Update the percentage text
  percentageElement.textContent = `${percentage}%`;
}

function updateAttendanceProgress_t(totalMarked, totalNotMarked) {
  const percentage = Math.round((totalMarked / (totalMarked + totalNotMarked)) * 100);
  const circle = document.getElementById('progress-circle_t');
  const percentageElement = document.getElementById('attendance-percentage_t');

  // Update the circle's progress
  const circlePerimeter = 2 * Math.PI * 30; // 30 is the radius
  const offset = circlePerimeter - (percentage / 100) * circlePerimeter;

  circle.style.strokeDasharray = circlePerimeter;
  circle.style.strokeDashoffset = offset;

  // Update the percentage text
  percentageElement.textContent = `${percentage}%`;
}


// Fetch attendance info from the server and update dashboard
fetch('/attend-tut-info')
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to fetch attendance info');
    }
    return response.json();
  })
  .then(data => {
    const lectureInfo = document.getElementById('tut-info');
    const numInfo = document.getElementById('number_t-info');

    // Populate lectures from class_type
const classTypes = data.recentAttendance.map(record => record.class_type).join(', ');
const number = classTypes.split(', ').length;
lectureInfo.textContent = "Tutorials";
numInfo.textContent = `Total Number of Tutorials: ${number}`;


    // Calculate total marked and not marked attendance
    const totalMarked = data.recentAttendance.filter(record => record.attendance === 'Marked').length;
    const totalNotMarked = data.recentAttendance.length - totalMarked;

    // Update attendance progress
    updateAttendanceProgress_t(totalMarked, totalNotMarked);
  })
  .catch(error => {
    console.error('Error fetching attendance info:', error);
    document.getElementById('tut-info').textContent = 'Error loading lectures.';
  });

  // Fetch lecture attendance info from the server and update dashboard
fetch('/attend-lecture-info')
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to fetch lecture attendance info');
    }
    return response.json();
  })
  .then(data => {
    const lectureInfo = document.getElementById('lecture-info');
    const numInfo = document.getElementById('number_lec-info');

    // Populate lectures from class_type
    const classTypes = data.recentAttendance.map(record => record.class_type).join(', ');
    const number = classTypes.split(', ').length;
    lectureInfo.textContent = "Lectures";
    numInfo.textContent = `Total Number of Lectures: ${number}`;

    // Calculate total marked and not marked attendance
    const totalMarked = data.recentAttendance.filter(record => record.attendance === 'Marked').length;
    const totalNotMarked = data.recentAttendance.length - totalMarked;

    // Update attendance progress
    updateAttendanceProgress_lec(totalMarked, totalNotMarked);
  })
  .catch(error => {
    console.error('Error fetching lecture attendance info:', error);
    document.getElementById('lecture-info').textContent = 'Error loading lectures.';
  });

// Fetch lab attendance info from the server and update dashboard
fetch('/attend-lab-info')
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to fetch lab attendance info');
    }
    return response.json();
  })
  .then(data => {
    const labInfo = document.getElementById('lab-info');
    const numInfo = document.getElementById('number_lab-info');

    // Populate labs from class_type
    const classTypes = data.recentAttendance.map(record => record.class_type).join(', ');
    const number = classTypes.split(', ').length;
    labInfo.textContent = "Labs";
    numInfo.textContent = `Total Number of Labs: ${number}`;

    // Calculate total marked and not marked attendance
    const totalMarked = data.recentAttendance.filter(record => record.attendance === 'Marked').length;
    const totalNotMarked = data.recentAttendance.length - totalMarked;

    // Update attendance progress
    updateAttendanceProgress_lab(totalMarked, totalNotMarked);
  })
  .catch(error => {
    console.error('Error fetching lab attendance info:', error);
    document.getElementById('lab-info').textContent = 'Error loading labs.';
  });

    const calendarElement = document.getElementById('calendar');
    const timetableBody = document.getElementById('timetable-body');
    let selectedDate = null;
    let timetable = [];

    function renderCalendar() {
        const today = new Date();
        const month = today.getMonth();
        const year = today.getFullYear();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const firstDayOfWeek = firstDay.getDay();

        calendarElement.innerHTML = '';
        for (let i = 0; i < firstDayOfWeek; i++) {
            calendarElement.innerHTML += '<div></div>';
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.classList.add('day');
            dayElement.innerText = day;
            dayElement.onclick = () => selectDay(day);

            calendarElement.appendChild(dayElement);
        }
    }

    function selectDay(day) {
        const selectedDay = document.querySelector('.day.selected');
        if (selectedDay) {
            selectedDay.classList.remove('selected');
        }

        const dayElement = Array.from(calendarElement.getElementsByClassName('day')).find(d => d.innerText == day);
        dayElement.classList.add('selected');
        selectedDate = day;
    }

    function addTimetable() {
        const subject = document.getElementById('subject').value;
        const time = document.getElementById('time').value;

        if (!selectedDate || !subject || !time) {
            alert('Please select a date, subject, and time.');
            return;
        }

        const timetableEntry = {
            date: selectedDate,
            subject,
            time,
        };

        timetable.push(timetableEntry);
        renderTimetable();
    }

    function renderTimetable() {
        timetableBody.innerHTML = '';
        timetable.forEach(entry => {
            const entryElement = document.createElement('tr');
            entryElement.innerHTML = `
                <td>${entry.date}</td>
                <td>${entry.subject}</td>
                <td>${entry.time}</td>
                <td><button class="remove-btn" onclick="removeTimetable(${entry.date})">Remove</button></td>
            `;
            timetableBody.appendChild(entryElement);
        });
    }

    function removeTimetable(date) {
        timetable = timetable.filter(entry => entry.date !== date);
        renderTimetable();
    }

    renderCalendar();

document.querySelector(".active").addEventListener("mouseenter", function () {
  this.querySelector(".icon").setAttribute("trigger", "in");
});


document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("mouseenter", () => {
        link.querySelector(".icon").setAttribute("trigger", "in");
    });

});