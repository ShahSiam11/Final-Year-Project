const  sideMenu = document.querySelector('aside');
const menuBtn = document.querySelector('#menu_bar');
const closeBtn = document.querySelector('#close_btn');
const themeToggler = document.querySelector('.theme-toggler');
const sidebarLinks = document.querySelectorAll('.sidebar a'); // Select all the sidebar links


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
      const recentRecords = data.recentAttendance.slice(0, 5);

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
fetch('/user-profile')
  .then((response) => {
    if (!response.ok) {
      throw new Error('Unauthorized');
    }
    return response.json();
  })
  .then((data) => {
    const recentOrderBody = document.querySelector('.recent_order tbody');

    if (data.userProfile.length > 0) {
      recentOrderBody.innerHTML = ''; // Clear previous table rows

      data.userProfile.forEach((profile) => {
        const row = document.createElement('tr');

        // Create table cells with dynamic data
        const subjectIDCell = document.createElement('td');
        subjectIDCell.textContent = profile.subjectID;

        const subjectNameCell = document.createElement('td');
        subjectNameCell.textContent = profile.subjectName;

        const subjectCell = document.createElement('td');
        subjectCell.textContent = profile.subject;

        const startTimeCell = document.createElement('td');
        startTimeCell.textContent = profile.startTime;

        const semesterCell = document.createElement('td');
        semesterCell.textContent = profile.semester;

        const subjectStatusCell = document.createElement('td');
        subjectStatusCell.classList.add(
          profile.subjectStatus === 'Active' ? 'success' : 'warning'
        );
        subjectStatusCell.textContent = profile.subjectStatus;

        // Append the cells to the row
        row.appendChild(subjectIDCell);
        row.appendChild(subjectNameCell);
        row.appendChild(subjectCell);
        row.appendChild(startTimeCell);
        row.appendChild(semesterCell);
        row.appendChild(subjectStatusCell);

        // Append the row to the table body
        recentOrderBody.appendChild(row);
      });
    } else {
      // If no records found, display a message
      const row = document.createElement('tr');
      const noDataCell = document.createElement('td');
      noDataCell.colSpan = 6;
      noDataCell.textContent = 'No user profile records available.';
      row.appendChild(noDataCell);
      recentOrderBody.appendChild(row);
    }
  })
  .catch((error) => {
    console.error('Error fetching profile info:', error);
  });


document.getElementById("addSubjectForm").addEventListener("submit", function (event) {
    event.preventDefault();

    const subjectID = document.getElementById("subjectID").value;
    const subjectName = document.getElementById("subjectName").value;
    const semester = document.getElementById("semester").value;
    const facultyName = document.getElementById("facultyName").value;

    fetch("/add-subject", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            subjectID: subjectID,
            subjectName: subjectName,
            semester: semester,
            facultyName: facultyName
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            document.getElementById("subjectLimitMessage").textContent = data.error;
        } else {
            // Clear form fields
            document.getElementById("subjectID").value = '';
            document.getElementById("subjectName").value = '';
            document.getElementById("facultyName").value = '';

            // Fetch updated subjects
            fetchSubjects();
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
});

// Function to fetch and display subjects in the user's profile
function fetchSubjects() {
    fetch("/user-profile")
    .then(response => response.json())
    .then(data => {
        const subjectTableBody = document.getElementById("subjectTableBody");
        subjectTableBody.innerHTML = ''; // Clear the table

        data.userProfile.forEach(subject => {
            const row = document.createElement("tr");

            const subjectIDCell = document.createElement("td");
            subjectIDCell.textContent = subject.subjectID;

            const subjectNameCell = document.createElement("td");
            subjectNameCell.textContent = subject.subjectName;

            const startTimeCell = document.createElement("td");
            startTimeCell.textContent = new Date(subject.startTime).toLocaleTimeString();

            const semesterCell = document.createElement("td");
            semesterCell.textContent = subject.semester;

            const statusCell = document.createElement("td");
            statusCell.textContent = subject.subjectStatus;

            row.appendChild(subjectIDCell);
            row.appendChild(subjectNameCell);
            row.appendChild(startTimeCell);
            row.appendChild(semesterCell);
            row.appendChild(statusCell);

            subjectTableBody.appendChild(row);
        });
    });
}

// Call to populate table when the page loads
fetchSubjects();


document.querySelector(".active").addEventListener("mouseenter", function () {
  this.querySelector(".icon").setAttribute("trigger", "in");
});


document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("mouseenter", () => {
        link.querySelector(".icon").setAttribute("trigger", "in");
    });

});
