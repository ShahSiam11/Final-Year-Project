// Copyright (c) 2025 Ahsan Latif (@GittyCandy)  
// All Rights Reserved.  
//  
// Unauthorized access, use, reproduction, modification, distribution,  
// or creation of derivative works based on this code is strictly prohibited  
// without the prior explicit written permission of the owner.  
//  
// Violators may be subject to legal action.  

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
const themeInput = document.getElementById('input');

themeInput.addEventListener('change', () => {
  // When the checkbox is checked, apply the dark theme;
  // when unchecked, remove it.
  document.body.classList.toggle('dark-theme-variables', themeInput.checked);
});


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
    console.log(data); // Debugging: Log the response data
    const greeting = document.getElementById('greeting');
    const roleElement = document.getElementById('role');
    const nameElement = document.getElementById('name');
    const recentOrderBody = document.querySelector('.recent_order tbody');

    // Determine the greeting based on the user's role
    let greetingMessage = '';
    if (data.role === 'user') {
      greetingMessage = `Good morning ${data.name} (Waiting for Approval)`;
      // Show the popup if the role is "user"
      const popupContainer = document.getElementById('popupContainer');
      if (popupContainer) {
        popupContainer.style.display = 'flex'; // Show the popup
      }
    } else {
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

      greetingMessage = `${timeOfDayGreeting}, ${data.name}`;
    }

    // Set the greeting and other user info
    greeting.textContent = greetingMessage;
    nameElement.textContent = `Name: ${data.name}`;
    roleElement.textContent = `Role: ${data.role}`;

    // Clear previous table rows (if any)
    recentOrderBody.innerHTML = '';

    // Check the user's role and populate table accordingly
    if (data.role === 'user') {
      // Hardcoded table values for a user with role 'user'
      const hardcodedAttendance = [
        {
          date: '2023-01-01',
          time_joined: '09:00 AM',
          subject: 'English',
          class_type: 'Lecture',
          time_stayed: '60 mins',
          attendance: 'Marked'
        },
        {
          date: '2023-01-02',
          time_joined: '10:00 AM',
          subject: 'History',
          class_type: 'Seminar',
          time_stayed: '55 mins',
          attendance: 'Marked'
        },
        {
          date: '2023-01-03',
          time_joined: '11:00 AM',
          subject: 'Math',
          class_type: 'Lab',
          time_stayed: '50 mins',
          attendance: 'Not Marked'
        }
      ];

      hardcodedAttendance.forEach((attendance) => {
        const row = document.createElement('tr');

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
        detailsCell.innerHTML = '';

        row.appendChild(dateCell);
        row.appendChild(timeJoinedCell);
        row.appendChild(subjectCell);
        row.appendChild(classTypeCell);
        row.appendChild(timeStayedCell);
        row.appendChild(attendanceCell);
        row.appendChild(detailsCell);

        recentOrderBody.appendChild(row);
      });
    } else {
      // For non-'user' roles, populate table using dynamic data if available
      if (data.recentAttendance && data.recentAttendance.length > 0) {
        const recentRecords = data.recentAttendance.slice(0, 5);
        recentRecords.forEach((attendance) => {
          const row = document.createElement('tr');

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
          detailsCell.innerHTML = '';

          row.appendChild(dateCell);
          row.appendChild(timeJoinedCell);
          row.appendChild(subjectCell);
          row.appendChild(classTypeCell);
          row.appendChild(timeStayedCell);
          row.appendChild(attendanceCell);
          row.appendChild(detailsCell);

          recentOrderBody.appendChild(row);
        });
      } else {
        // Display a message if no attendance records are available
        const row = document.createElement('tr');
        const noDataCell = document.createElement('td');
        noDataCell.colSpan = 7;
        noDataCell.textContent = 'No More recent attendance records available.';
        row.appendChild(noDataCell);
        recentOrderBody.appendChild(row);
      }
    }
  })
  .catch((error) => {
    console.error('Error fetching user info:', error);
    document.getElementById('greeting').textContent = "Hi, Guest";
  });

// Add event listeners for the popup close and accept buttons
document.addEventListener('DOMContentLoaded', function () {
  const popupContainer = document.getElementById('popupContainer');
  if (popupContainer) {
    const closeBtn = popupContainer.querySelector('.close');
    const acceptBtn = popupContainer.querySelector('.accept');

    // Function to hide the popup
    function hidePopup() {
      popupContainer.style.display = 'none';
    }

    // Attach event listeners to both buttons
    closeBtn.addEventListener('click', hidePopup);
    acceptBtn.addEventListener('click', hidePopup);
  }
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

function updateAttendanceProgress_tut(totalMarked, totalNotMarked) {
  const percentage = Math.round((totalMarked / (totalMarked + totalNotMarked)) * 100);
  const circle = document.getElementById('progress-circle_tut');
  const percentageElement = document.getElementById('attendance-percentage_tut');

  // Update the circle's progress
  const circlePerimeter = 2 * Math.PI * 30; // 30 is the radius
  const offset = circlePerimeter - (percentage / 100) * circlePerimeter;

  circle.style.strokeDasharray = circlePerimeter;
  circle.style.strokeDashoffset = offset;

  // Update the percentage text
  percentageElement.textContent = `${percentage}%`;
}
function loadNotifications() {
  fetch("/get-notifications") // Fetch notifications from backend API
    .then(res => res.json())
    .then(data => {
      const container = document.querySelector(".updates");
      container.innerHTML = ""; // Clear previous content

      if (data.critical.length === 0) {
        // No critical notifications: display a friendly message with an icon
        const updateDiv = document.createElement("div");
        updateDiv.classList.add("update");
        updateDiv.innerHTML = `
          <div class="profile-photo">
            <lord-icon
              src="https://cdn.lordicon.com/utpmnzxz.json"
              trigger="in"
              colors="primary:#00FF00"
              class="critical-icon"
              style="width:40px;height:40px">
            </lord-icon>
          </div>
          <div class="message">
            <p style="color: green; padding-left: 15px; font-weight: bold;">
              Nothing important at the moment. Keep up the good work!
            </p>
          </div>`;
        container.appendChild(updateDiv);
      } else {
        // Display each critical notification with the standard red icon
        data.critical.forEach((subject, index) => {
          const updateDiv = document.createElement("div");
          updateDiv.classList.add("update");
          updateDiv.innerHTML = `
            <div class="profile-photo">
              <lord-icon
                src="https://cdn.lordicon.com/vihyezfv.json"
                trigger="in"
                colors="primary:#FF004C"
                class="critical-icon"
                data-id="critical-${index}"
                style="width:40px;height:40px">
              </lord-icon>
            </div>
            <div class="message">
              <p style="color: red; padding-left: 15px;">
                <b>${subject.name}</b> attendance alert:
                Missed Labs: ${subject.missedLabs}, Missed Tutorials: ${subject.missedTutorials}.
              </p>
            </div>`;
          container.appendChild(updateDiv);
        });
      }

      // Restart critical icon animations periodically
      setInterval(() => {
        document.querySelectorAll(".critical-icon").forEach(icon => {
          icon.setAttribute("trigger", "loop");
          setTimeout(() => {
            icon.setAttribute("trigger", "in");
          }, 10);
        });
      }, 3000);
    })
    .catch(err => console.error("Error loading notifications:", err));
}

document.addEventListener("DOMContentLoaded", loadNotifications);


// Fetch attendance info from the server and update dashboard
// Fetch tutorial attendance info from the server and update dashboard
fetch('/attend-tut-info')
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to fetch tutorial attendance info');
    }
    return response.json();
  })
  .then(data => {
    const tutInfo = document.getElementById('tut-info');
    const numInfo = document.getElementById('number_t-info');

    // Calculate attendance stats
    const totalMarked = data.recentAttendance.filter(record => record.attendance === 'Marked').length;
    const totalNotMarked = data.recentAttendance.length - totalMarked;
    const totalTutorials = totalMarked + totalNotMarked;
    const progress = totalTutorials > 0 ? Math.round((totalMarked / totalTutorials) * 100) : 0;

    tutInfo.textContent = "Tutorials";
numInfo.innerHTML = `You have attended <b style="color:#D455E6;">${totalMarked}</b> Tutorials so far out of <b style="color:#D455E6;">${totalTutorials}</b> scheduled Tutorials.`;

    // Update attendance progress
    updateAttendanceProgress_tut(totalMarked, totalNotMarked);
  })
  .catch(error => {
    console.error('Error fetching tutorial attendance info:', error);
    document.getElementById('tut-info').textContent = 'No Tutorials Attended.';
  });


  // Fetch lecture attendance info from the server and update dashboard
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

    // Calculate attendance stats
    const totalMarked = data.recentAttendance.filter(record => record.attendance === 'Marked').length;
    const totalNotMarked = data.recentAttendance.length - totalMarked;
    const totalLectures = totalMarked + totalNotMarked;
    const progress = totalLectures > 0 ? Math.round((totalMarked / totalLectures) * 100) : 0;

    lectureInfo.textContent = "Lectures";
numInfo.innerHTML = `You have attended <b style="color:#D455E6;">${totalMarked}</b> Lectures so far out of <b style="color:#D455E6;">${totalLectures}</b> scheduled Lectures.`;


    // Update attendance progress
    updateAttendanceProgress_lec(totalMarked, totalNotMarked);
  })
  .catch(error => {
    console.error('Error fetching lecture attendance info:', error);
    document.getElementById('lecture-info').textContent = 'No Lectures Attended.';
  });


// Fetch lab attendance info from the server and update dashboard

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
    const number = data.recentAttendance.filter(record => record.attendance === 'Marked').length;
    const totalMarked = number;
    const totalNotMarked = data.recentAttendance.length - totalMarked;
    const totalLabs = totalMarked + totalNotMarked;
    const progress = totalLabs > 0 ? Math.round((totalMarked / totalLabs) * 100) : 0;

    labInfo.textContent = "Labs";
numInfo.innerHTML = `You have attended <b style="color:#D455E6;">${totalMarked}</b> Labs so far out of <b style="color:#D455E6;">${totalLabs}</b> scheduled Labs.`;

    // Update attendance progress
    updateAttendanceProgress_lab(totalMarked, totalNotMarked);
  })
  .catch(error => {
    console.error('Error fetching lab attendance info:', error);
    document.getElementById('lab-info').textContent = 'No Lab Attended';
  });



// Fetch subjects from the backend and display them
function fetchSubjects() {
  fetch("/user-profile")  // Assuming this endpoint gives a list of subjects along with a role property
    .then(response => response.json())
    .then(data => {
      const subjectsList = document.getElementById("subjectsList");
      subjectsList.innerHTML = ''; // Clear existing content

      let subjects;
      // If the user's role is 'user', use hardcoded subjects; otherwise, use the backend data
      if (data.role && data.role === 'user') {
        subjects = [
          {
            subjectName: "Mathematics",
            subjectID: "MATH101",
            semester: "Fall 2023",
            subjectStatus: "Approved"
          },
          {
            subjectName: "History",
            subjectID: "HIST102",
            semester: "Spring 2024",
            subjectStatus: "Pending"
          },
          {
            subjectName: "Biology",
            subjectID: "BIO103",
            semester: "Summer 2024",
            subjectStatus: "Approved"
          }
        ];
      } else {
        subjects = data.userProfile; // Dynamic subjects from the backend
      }

      // Iterate over the subjects and create a block for each one
      subjects.forEach((subject) => {
        const subjectBlock = document.createElement("div");
        subjectBlock.classList.add("item", "onlion");

        subjectBlock.innerHTML = `
          <div class="icon">
            <lord-icon
              src="https://cdn.lordicon.com/zyzoecaw.json"
              trigger="hover"
              colors="primary:#D455E6"
              style="width:40px;height:40px">
            </lord-icon>
          </div>
          <div class="right_text">
            <div class="info">
              <h3>${subject.subjectName} (${subject.subjectID})</h3>
              <small class="text-muted">Semester: ${subject.semester}</small>
            </div>
            <h5 class="${subject.subjectStatus === 'Pending' ? 'danger' : 'success'}">
              ${subject.subjectStatus}
            </h5>
          </div>
        `;

        subjectsList.appendChild(subjectBlock);
      });
    })
    .catch(error => {
      console.error('Error fetching subjects:', error);
    });
}

// Call the function to display subjects on page load
document.addEventListener("DOMContentLoaded", fetchSubjects);

function loadNotificationCount() {
  // Fetch the notification summary (count)
  fetch("/fetch-notifications-summary")
    .then((res) => res.json())
    .then((data) => {
      const unreadCount = data.totalNotifications;
      const unreadCountElement = document.getElementById("unread-count");
      if (unreadCountElement) {
        unreadCountElement.textContent = unreadCount > 0 ? unreadCount : ''; // Show the count or hide it
      }
    })
    .catch((err) => console.error("Error loading notification count:", err));
}


document.addEventListener("DOMContentLoaded", () => {
  loadNotificationCount(); // Load notification count on page load
});


document.querySelector(".active").addEventListener("mouseenter", function () {
  this.querySelector(".icon").setAttribute("trigger", "in");
});


document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("mouseenter", () => {
        link.querySelector(".icon").setAttribute("trigger", "in");
    });

});
