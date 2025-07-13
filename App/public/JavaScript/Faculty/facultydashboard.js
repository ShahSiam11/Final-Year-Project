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

fetch('/greet')
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
    updateAttendanceProgress_tut(totalMarked, totalNotMarked);
  })
  .catch(error => {
    console.error('Error fetching attendance info:', error);
    document.getElementById('tut-info').textContent = 'No Tutorials Attended.';
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
    document.getElementById('lecture-info').textContent = 'No lectures Attended';
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
    document.getElementById('lab-info').textContent = 'No Lab Attended';
  });

// Fetch subjects from the backend and display them
function fetchSubjects() {
    fetch("/user-profile")  // Assuming this endpoint gives a list of subjects
    .then(response => response.json())
    .then(data => {
        const subjects = data.userProfile; // Array of subjects
        const subjectsList = document.getElementById("subjectsList");
        subjectsList.innerHTML = ''; // Clear existing content

        // Iterate over the subjects and create a block for each one
        subjects.forEach((subject, index) => {
            const subjectBlock = document.createElement("div");
            subjectBlock.classList.add("item", "onlion");

            subjectBlock.innerHTML = `
                <div class="icon">
                    <span class="material-symbols-sharp">menu_book</span>
                </div>
                <div class="right_text">
                    <div class="info">
                        <h3>${subject.subjectName}</h3>
                        <small class="text-muted">Semester: ${subject.semester}</small>
                    </div>
                    <h5 class="${subject.subjectStatus === 'Pending' ? 'danger' : 'success'}">${subject.subjectStatus}</h5>
                    <h3>${subject.subjectID}</h3>
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


      async function fetchData() {
            const response = await fetch('http://localhost:3030/api/facultyattendance');
            const data = await response.json();
            return data;
        }

        async function renderChart() {
            const data = await fetchData();
            const ctx = document.getElementById('attendanceChart').getContext('2d');
            const myChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.map(item => item.subject),
                    datasets: [{
                        label: 'Presents',
                        data: data.map(item => item.presents),
                        backgroundColor: '#E89CFA'
                    }, {
                        label: 'Missed',
                        data: data.map(item => item.missed),
                        backgroundColor: '#D455E6'
                    }, {
                        label: 'Missed More Than 3 Times',
                        data: data.map(item => item.missed_more_than_3),
                        backgroundColor: '#A040B3'
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }

        renderChart();


        document.getElementById('startButton').addEventListener('click', async () => {
            const subject = document.getElementById('subject').value;
            const classType = document.getElementById('classType').value;

            const response = await fetch('/start-attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject, classType }),
            });

            const result = await response.text();
            document.getElementById('output').textContent = result;

            document.getElementById('stopButton').disabled = false; // Enable Stop button
        });

        document.getElementById('stopButton').addEventListener('click', async () => {
            const response = await fetch('/stop-attendance', { method: 'POST' });

            const result = await response.text();
            document.getElementById('output').textContent = result;

            document.getElementById('stopButton').disabled = true; // Disable Stop button
        });


// script.js
document.addEventListener("DOMContentLoaded", () => {
  fetch('/subject-summary')
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch subject summary');
      }
      return response.json();
    })
    .then(data => {
      const container = document.getElementById('subject-summary-container');
      const totalSubjectsElement = document.getElementById('total-subjects');

      // Clear any loading text
      container.innerHTML = '';

      // For each subject, create a summary card
      data.subjects.forEach(subject => {
        const card = document.createElement('div');
        card.classList.add('subject-card');
        card.innerHTML = `
          <h4><span class="underline">${subject.subject_name}</span> <span class="subject-code">(${subject.subject_code})</span></h4>
          <p>Total Students: <strong>${subject.total_students}</strong></p>
          <p>At Risk: <strong>${subject.at_risk_count}</strong></p>
          <p>Avg. Attendance: <strong>${subject.avg_attendance_percentage}%</strong></p>
        `;
        container.appendChild(card);
      });

      totalSubjectsElement.textContent = `Total Subjects: ${data.subjects.length}`;
    })
    .catch(error => {
      console.error('Error fetching subject summary:', error);
      document.getElementById('subject-summary-container').innerHTML =
        `<p class="error">Unable to load subject summary information.</p>`;
    });
});

document.querySelector(".active").addEventListener("mouseenter", function () {
  this.querySelector(".icon").setAttribute("trigger", "in");
});


document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("mouseenter", () => {
        link.querySelector(".icon").setAttribute("trigger", "in");
    });

});