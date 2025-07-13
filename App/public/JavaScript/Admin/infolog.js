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


    const fetchLogs = async (url, elementId) => {
      try {
        const response = await fetch(url);
        const logs = await response.json();
        const consoleDiv = document.getElementById(elementId);
        consoleDiv.innerHTML = '';
        logs.forEach(log => {
          const [dateTime, , message] = log.split(' - ');
          const logEntry = document.createElement('div');
          logEntry.classList.add('log-entry');
          logEntry.innerHTML = `<span class="log-date">${dateTime}</span>: ${message}`;
          consoleDiv.appendChild(logEntry);
        });
        consoleDiv.scrollTop = consoleDiv.scrollHeight;
      } catch (error) {
        console.error('Error fetching logs:', error);
      }
    };

    setInterval(() => fetchLogs('/logs', 'logs-console'), 5000);
    setInterval(() => fetchLogs('/logs-debug', 'logs-console-debug'), 5000);
    setInterval(() => fetchLogs('/logs-error', 'logs-console-error'), 5000);
    setInterval(() => fetchLogs('/logs-critical', 'logs-console-critical'), 2000);

    window.onload = () => {
      fetchLogs('/logs', 'logs-console');
      fetchLogs('/logs-debug', 'logs-console-debug');
      fetchLogs('/logs-error', 'logs-console-error');
      fetchLogs('/logs-critical', 'logs-console-critical');
    };
const fetchRealFaces = async () => {
  try {
    // Simulated total threshold for real faces
    const TOTAL_REAL_FACES = 100; // Adjust this as needed

    const response = await fetch('/real-faces');
    const { count } = await response.json(); // Assumes your backend responds with { count: <number> }

    // Calculate the percentage
    const percentage = Math.min((count / TOTAL_REAL_FACES) * 100, 100).toFixed(2);

    // Update the DOM elements
    const realInfoElement = document.getElementById('real-info');
    const percentageElement = document.getElementById('percentage_r');
    const numberInfoElement = document.getElementById('number_r-info');
    const progressCircle = document.getElementById('progress-circle_real');

    realInfoElement.innerText = count;
    percentageElement.innerText = `${percentage}%`;
    numberInfoElement.innerText = `Total real faces logged: ${count}`;

    // Animate the progress circle
    const radius = progressCircle.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;

    progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
    progressCircle.style.strokeDashoffset = circumference;

    const offset = circumference - (percentage / 100) * circumference;
    progressCircle.style.transition = 'stroke-dashoffset 1s ease';
    progressCircle.style.strokeDashoffset = offset;
  } catch (error) {
    console.error('Error fetching real faces:', error);
  }
};

// Fetch real faces every 5 seconds
setInterval(fetchRealFaces, 5000);

// Initial fetch on page load
window.onload = () => {
  fetchFakeAttempts();
  fetchRealFaces();
};

  const fetchFakeAttempts = async () => {
    try {
      // Simulated total threshold for fake attempts
      const TOTAL_FAKE_ATTEMPTS = 100; // Adjust this as needed

      const response = await fetch('/fake-attempts');
      const { count } = await response.json(); // Assumes your backend responds with { count: <number> }

      // Calculate the percentage
      const percentage = Math.min((count / TOTAL_FAKE_ATTEMPTS) * 100, 100).toFixed(2);

      // Update the DOM elements
      const fakeInfoElement = document.getElementById('fake-info');
      const percentageElement = document.getElementById('percentage_f');
      const numberInfoElement = document.getElementById('number_f-info');
      const progressCircle = document.getElementById('progress-circle_fake');

      fakeInfoElement.innerText = count;
      percentageElement.innerText = `${percentage}%`;
      numberInfoElement.innerText = `Total fake attempts logged: ${count}`;

      // Animate the progress circle
      const radius = progressCircle.r.baseVal.value;
      const circumference = 2 * Math.PI * radius;

      progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
      progressCircle.style.strokeDashoffset = circumference;

      const offset = circumference - (percentage / 100) * circumference;
      progressCircle.style.transition = 'stroke-dashoffset 1s ease';
      progressCircle.style.strokeDashoffset = offset;
    } catch (error) {
      console.error('Error fetching fake attempts:', error);
    }
  };

  // Fetch fake attempts every 5 seconds
  setInterval(fetchFakeAttempts, 5000);

  // Initial fetch on page load
  window.onload = () => {
    fetchFakeAttempts();
  };



            function showTab(tabId) {
      // Hide all tabs
      const tabs = document.querySelectorAll('.tab-content');
      tabs.forEach(tab => tab.style.display = 'none');

      // Remove active class from all buttons
      const buttons = document.querySelectorAll('.tab-button');
      buttons.forEach(button => button.classList.remove('active'));

      // Show the selected tab and highlight the button
      document.getElementById(tabId).style.display = 'block';
      document.querySelector(`.tab-button[onclick="showTab('${tabId}')"]`).classList.add('active');
    }


    document.querySelector(".active").addEventListener("mouseenter", function () {
  this.querySelector(".icon").setAttribute("trigger", "in");
});


document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("mouseenter", () => {
        link.querySelector(".icon").setAttribute("trigger", "in");
    });

});
