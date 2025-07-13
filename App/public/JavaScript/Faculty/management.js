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

document.getElementById('searchBtn').addEventListener('click', async () => {
  const userId = document.getElementById('userId').value;
  const subject = document.getElementById('subjectFilter').value;
  const classType = document.getElementById('classTypeFilter').value;

  if (userId) {
    const response = await fetch(`/search/${userId}?subject=${subject}&classType=${classType}`);
    const data = await response.json();

    if (data.success) {
      const tbody = document.querySelector('table tbody');
      tbody.innerHTML = '';

data.attendanceInfo.forEach(row => {
  const formattedDate = new Date(row.date).toISOString().split('T')[0]; // Format date to YYYY-MM-DD
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${formattedDate}</td>
    <td>${row.name}</td>
    <td>${row.userid}</td>
    <td>${row.subject}</td>
    <td>${row.class_type}</td>
    <td>${row.time_joined}</td>
    <td>
      <select class="attendance-select">
        <option value="Marked" ${row.attendance === 'Marked' ? 'selected' : ''}>Marked</option>
        <option value="Not Marked" ${row.attendance === 'Not Marked' ? 'selected' : ''}>Not Marked</option>
        <option value="Late" ${row.attendance === 'Late' ? 'selected' : ''}>Late</option>
        <option value="Excused" ${row.attendance === 'Excused' ? 'selected' : ''}>Excused</option>
      </select>
    </td>
    <td>
      <button class="save-btn" data-recordid="${row.id}">Save</button>
    </td>
  `;
  tbody.appendChild(tr);
});

    } else {
      alert("No data found for this user.");
    }
  } else {
    alert("Please enter a user ID.");
  }
});

// Populate the filters with available subjects and class types
async function populateFilters() {
  const response = await fetch('/filters');
  const data = await response.json();

  const subjectFilter = document.getElementById('subjectFilter');
  const classTypeFilter = document.getElementById('classTypeFilter');

  // Populate subject filter
  data.subjects.forEach(subject => {
    const option = document.createElement('option');
    option.value = subject;
    option.textContent = subject;
    subjectFilter.appendChild(option);
  });

  // Populate class type filter
  data.classTypes.forEach(classType => {
    const option = document.createElement('option');
    option.value = classType;
    option.textContent = classType;
    classTypeFilter.appendChild(option);
  });
}

// Call populateFilters when the page loads
populateFilters();
// Add event listeners to the save buttons
document.querySelector('table tbody').addEventListener('click', async (e) => {
  if (e.target.classList.contains('save-btn')) {
    // Retrieve the unique record id from the button's data attribute
    const recordId = e.target.getAttribute('data-recordid');
    const attendance = e.target.closest('tr').querySelector('.attendance-select').value;

    const response = await fetch('/update-attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recordId, attendance })
    });

    const result = await response.json();
    if (result.success) {
      alert('Attendance updated successfully.');
    } else {
      alert('Failed to update attendance.');
    }
  }
});


document.querySelector(".active").addEventListener("mouseenter", function () {
  this.querySelector(".icon").setAttribute("trigger", "in");
});


document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("mouseenter", () => {
        link.querySelector(".icon").setAttribute("trigger", "in");
    });

});