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
    const roleElement = document.getElementById('role');
    const nameElement = document.getElementById('name');

    nameElement.textContent = `Name: ${data.name}`;
    roleElement.textContent = `Role: ${data.role}`;
  })
  .catch((error) => {
    console.error('Error fetching user info:', error);
  });

document.addEventListener('DOMContentLoaded', () => {
  const loadingSpinner = document.getElementById('loadingSpinner');
  const tableBody = document.querySelector("#attendanceTable tbody");
  const errorMessage = document.getElementById('errorMessage');
  const chartToggleButton = document.getElementById('chartToggle');
  let currentChartType = 'line';

  const fetchAndRenderData = async () => {
    loadingSpinner.style.display = 'block';
    errorMessage.style.display = 'none';

    try {
      const response = await fetch('/attendance-data');
      if (!response.ok) throw new Error("Failed to fetch data");

      const data = await response.json();
      if (data.attendanceData) {
        tableBody.innerHTML = ""; // Clear table

        const subjects = data.attendanceData.map(record => record.subject);
        const attendance = data.attendanceData.map(record => ({
          value: record.attendance === "Marked" ? 1 : record.attendance === "Late" ? 0.5 : 0,
          attendanceStatus: record.attendance,
          class_type: record.class_type
        }));

        renderChart(subjects, attendance);
      } else {
        throw new Error('No attendance data found.');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      errorMessage.textContent = '';
      errorMessage.style.display = 'block';

      // Default data
      const defaultSubjects = ["Math Lab 1", "Science Lab 2", "History Tutorial 2", "English Class 1", "Art Lecture 2"];
      const defaultAttendance = [
        { attendanceStatus: "Marked", value: 1, class_type: "Lecture" },
        { attendanceStatus: "Late", value: 0.5, class_type: "Lecture" },
        { attendanceStatus: "Not Marked", value: 0, class_type: "Lab" },
        { attendanceStatus: "Marked", value: 1, class_type: "Lecture" },
        { attendanceStatus: "Late", value: 0.5, class_type: "Lab" }
      ];

      renderChart(defaultSubjects, defaultAttendance);
    } finally {
      loadingSpinner.style.opacity = 0;
    }
  };

  const renderChart = (subjects, attendance) => {
    const existingChart = Chart.getChart("attendanceChart");
    if (existingChart) existingChart.destroy();

    const ctx = document.getElementById('attendanceChart').getContext('2d');

    if (currentChartType === 'pie') {
      const statusCounts = { "Marked": 0, "Late": 0, "Not Marked": 0 };
      attendance.forEach(item => statusCounts[item.attendanceStatus] = (statusCounts[item.attendanceStatus] || 0) + 1);

      new Chart(ctx, {
        type: 'pie',
        data: {
          labels: Object.keys(statusCounts),
          datasets: [{
            label: 'Attendance Distribution',
            data: Object.values(statusCounts),
            backgroundColor: ['#E89CFA', '#D455E6', '#A040B3'],
            borderColor: ['magenta', 'magenta', 'magenta'],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: true, position: 'top' }
          }
        }
      });
    } else {
      new Chart(ctx, {
        type: currentChartType,
        data: {
          labels: subjects,
          datasets: [{
            label: 'Attendance Status',
            data: attendance.map(item => item.value),
            borderColor: '#A040B3',
            borderWidth: 2,
            pointBackgroundColor: 'magenta',
            backgroundColor: '#E89CFA',
            fill: currentChartType === 'bar'
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: true, position: 'top' }
          },
          scales: {
            x: { title: { display: true, text: 'Subject', font: { size: 14 } } },
            y: {
              title: { display: true, text: 'Attendance Status', font: { size: 14 } },
              ticks: {
                stepSize: 0.5,
                callback: value => value === 1 ? "Marked" : value === 0.5 ? "Late" : "Not Marked"
              }
            }
          }
        }
      });
    }
  };

  chartToggleButton.addEventListener('click', () => {
    currentChartType = currentChartType === 'line' ? 'bar' : currentChartType === 'bar' ? 'pie' : 'line';
    fetchAndRenderData();
  });

  fetchAndRenderData();
});

function fetchSubjectAnalytics() {
    // Default hardcoded data
    const defaultData = {
        subjectAnalytics: [
            {
                subjectName: "Mathematics",
                facultyName: "Dr. Smith",
                semester: "Fall 2023",
                lectureClasses: 20,
                markedLectures: 15,
                lateLectures: 3,
                unmarkedLectures: 2,
                labClasses: 10,
                markedLabs: 8,
                lateLabs: 1,
                unmarkedLabs: 1,
                tutorialClasses: 5,
                markedTutorials: 4,
                lateTutorials: 0,
                unmarkedTutorials: 1
            },
            {
                subjectName: "Physics",
                facultyName: "Dr. Johnson",
                semester: "Fall 2023",
                lectureClasses: 18,
                markedLectures: 16,
                lateLectures: 1,
                unmarkedLectures: 1,
                labClasses: 8,
                markedLabs: 7,
                lateLabs: 0,
                unmarkedLabs: 1,
                tutorialClasses: 4,
                markedTutorials: 3,
                lateTutorials: 1,
                unmarkedTutorials: 0
            }
        ]
    };

    fetch("/subject-analytics")
        .then(response => response.json())
        .then(data => {
            // Use fetched data if available, otherwise use default data
            const analyticsData = data.subjectAnalytics ? data : defaultData;
            renderSubjectAnalytics(analyticsData);
        })
        .catch(error => {
            console.error('Error fetching subject analytics:', error);
            // Use default data in case of an error
            renderSubjectAnalytics(defaultData);
        });
}

function renderSubjectAnalytics(data) {
    const analyticsList = document.getElementById("subjectAnalyticsList");
    analyticsList.innerHTML = '';

    data.subjectAnalytics.forEach(subject => {
        const subjectBlock = document.createElement("div");
        subjectBlock.classList.add("item", "onlion");

        subjectBlock.innerHTML = `
            <div class="icon">
                <span class="material-symbols-sharp">menu_book</span>
            </div>
            <div class="right_text">
                <div class="info">
                    <h3>${subject.subjectName}</h3>
                    <small class="text-muted">Faculty: ${subject.facultyName}</small>
                    <small class="text-muted">Semester: ${subject.semester}</small>
                </div>
                <div>
                    <p>Lectures: ${subject.lectureClasses} (Marked: ${subject.markedLectures}, Late: ${subject.lateLectures}, Not Marked: ${subject.unmarkedLectures})</p>
                    <p>Labs: ${subject.labClasses} (Marked: ${subject.markedLabs}, Late: ${subject.lateLabs}, Not Marked: ${subject.unmarkedLabs})</p>
                    <p>Tutorials: ${subject.tutorialClasses} (Marked: ${subject.markedTutorials}, Late: ${subject.lateTutorials}, Not Marked: ${subject.unmarkedTutorials})</p>
                </div>
            </div>
        `;

        analyticsList.appendChild(subjectBlock);
    });
}

// Call the function on page load
document.addEventListener("DOMContentLoaded", fetchSubjectAnalytics);

document.querySelector(".active").addEventListener("mouseenter", function () {
    this.querySelector(".icon").setAttribute("trigger", "in");
});


document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("mouseenter", () => {
        link.querySelector(".icon").setAttribute("trigger", "in");
    });

});
