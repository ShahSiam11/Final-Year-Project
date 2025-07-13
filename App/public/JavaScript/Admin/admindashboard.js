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



function loadNotifications() {
  fetch("/get-notifications") // Backend API
    .then(res => res.json())
    .then(data => {
      const container = document.querySelector(".updates");
      container.innerHTML = ""; // Clear previous content

      // Critical Subjects
      data.critical.forEach(subject => {
        container.innerHTML += `
          <div class="update">
            <div class="profile-photo">
              <span class="material-symbols-sharp">warning</span>
            </div>
            <div class="message">
              <p style="color: #ff4edc;">
                <b>${subject.name}</b> is critical! Missed Classes:
                Labs: ${subject.missedLabs}, Tutorials: ${subject.missedTutorials}.
              </p>
            </div>
          </div>`;
      });

    });
}


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



        const cpuCircle = document.getElementById('progress-circle-cpu');
        const memoryCircle = document.getElementById('progress-circle-memory');
        const diskCircle = document.getElementById('progress-circle-disk');

        const cpuPercentage = document.getElementById('cpu-percentage');
        const memoryPercentage = document.getElementById('memory-percentage');
        const diskPercentage = document.getElementById('disk-percentage');

        const cpuUsage = document.getElementById('cpu-usage');
        const memoryUsage = document.getElementById('memory-usage');
        const diskUsage = document.getElementById('disk-usage');

        const ctx = document.getElementById('attendanceChart').getContext('2d');
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Faces Processed',
                    data: [],
                    borderColor: '#D455E6',
                    fill: false
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

        function updateProgress(circle, percentage, value) {
            const offset = 188.4 - (188.4 * (value / 100));
            circle.style.strokeDashoffset = offset;
            percentage.textContent = `${value}%`;
        }

        async function fetchData() {
            const response = await fetch('/api/health');
            const data = await response.json();

            // Update CPU, Memory, and Disk usage
            cpuUsage.textContent = `${data.cpuUsage}%`;
            memoryUsage.textContent = `${data.memoryUsage}%`;
            diskUsage.textContent = `${data.diskUsage}%`;

            updateProgress(cpuCircle, cpuPercentage, data.cpuUsage);
            updateProgress(memoryCircle, memoryPercentage, data.memoryUsage);
            updateProgress(diskCircle, diskPercentage, data.diskUsage);

            // Update the chart
            chart.data.labels.push(new Date().toLocaleTimeString());
            chart.data.datasets[0].data.push(data.aiMetrics.facesProcessed);
            if (chart.data.labels.length > 10) {
                chart.data.labels.shift();
                chart.data.datasets[0].data.shift();
            }
            chart.update();
        }

        setInterval(fetchData, 10000);
        fetchData(); // Initial fetch


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



document.querySelector(".active").addEventListener("mouseenter", function () {
  this.querySelector(".icon").setAttribute("trigger", "in");
});


document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("mouseenter", () => {
        link.querySelector(".icon").setAttribute("trigger", "in");
    });

});
