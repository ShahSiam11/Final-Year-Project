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

function loadAllNotifications() {
  fetch("/fetch-notifications")
    .then((res) => res.json())
    .then((data) => {
      const container = document.querySelector(".notifications");
      container.innerHTML = ""; // Clear previous content

      // Update notification count
      const unreadCount = data.totalNotifications;
      const unreadCountElement = document.getElementById("unread-count");
      if (unreadCountElement) {
        unreadCountElement.textContent = unreadCount > 0 ? unreadCount : ''; // Show the count or hide it
      }

      // Critical Notifications
      if (data.critical.length > 0) {
        container.innerHTML += `
          <h3>Critical Notifications</h3>
          <p class="notification-subtitle">The following subjects have missed classes. Please address them as soon as possible.</p>
        `;
        data.critical.forEach((subject) => {
          container.innerHTML += `
            <div class="notification critical">
              <p>
                <strong>${subject.name}</strong> - Missed Classes:
                <b>Labs: ${subject.missedLabs}</b>,
                <b>Tutorials: ${subject.missedTutorials}</b>
              </p>
            </div>
          `;
        });
      }

      // Today's Classes
      if (data.todaysAttendance.length > 0) {
        container.innerHTML += `
          <h3>Today's Classes</h3>
          <p class="notification-subtitle">Here's the status of your attendance for today.</p>
        `;
        data.todaysAttendance.forEach((att) => {
          container.innerHTML += `
            <div class="notification ${att.marked ? "marked" : "not-marked"}">
              <p>
                <strong>${att.subject}</strong> (${att.type}) -
                ${att.marked ? "Marked" : "Not Marked"}
              </p>
            </div>
          `;
        });
      }

      // No notifications message
      if (!data.critical.length && !data.todaysAttendance.length) {
        container.innerHTML += `
          <p class="no-notifications">No notifications at the moment!</p>
        `;
      }
    })
    .catch((err) => console.error("Error loading notifications:", err));
}

document.addEventListener("DOMContentLoaded", loadAllNotifications);


document.querySelector(".active").addEventListener("mouseenter", function () {
  this.querySelector(".icon").setAttribute("trigger", "in");
});


document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("mouseenter", () => {
        link.querySelector(".icon").setAttribute("trigger", "in");
    });

});
