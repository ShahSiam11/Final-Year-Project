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

document.addEventListener('DOMContentLoaded', function() {
  const searchBar = document.getElementById('searchBar');
  const userTableBody = document.querySelector('#userTable tbody');
  const detailSection = document.getElementById('detailSection');
  const selectedUserName = document.getElementById('selectedUserName');
  const subjectTableBody = document.querySelector('#subjectTable tbody');

  let selectedUserId = null;

  // Fetch and display users in the table
  function fetchUsers(query = '') {
    fetch(`/api/users?search=${query}`)
      .then(response => response.json())
      .then(data => {
        userTableBody.innerHTML = ''; // Clear existing rows
        data.forEach(user => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${user.userid}</td>
            <td><input type="text" value="${user.name}"></td>
            <td><input type="text" value="${user.email}"></td>
            <td>
              <select>
                <option value="student" ${user.role === 'student' ? 'selected' : ''}>Student</option>
                <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                <option value="faculty" ${user.role === 'faculty' ? 'selected' : ''}>Faculty</option>
                <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
              </select>
            </td>
            <td class="attendance-status ${user.attendanceStatus === 'Safe' ? 'safe' : 'critical'}">
              ${user.attendanceStatus || ''}
            </td>
            <td>
              <button class="save" onclick="saveUser('${user.userid}', this)">Save</button>
              <button class="view" onclick="viewSubjects('${user.userid}', '${user.name}')">View Subjects</button>
              <button class="delete" onclick="deleteUser('${user.userid}')">Delete</button>
            </td>
          `;
          userTableBody.appendChild(row);
        });
      });
  }

  // Save changes made to a user
  window.saveUser = function(userid, button) {
    const row = button.closest('tr');
    const data = {
      userid: userid,
      name: row.querySelector('td:nth-child(2) input').value,
      email: row.querySelector('td:nth-child(3) input').value,
      role: row.querySelector('td:nth-child(4) select').value
    };
    fetch('/api/users', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
      alert(data.message);
      fetchUsers(searchBar.value);
    });
  };

  // Delete a user
  window.deleteUser = function(userid) {
    if (confirm('Are you sure you want to delete this user?')) {
      fetch(`/api/users/${userid}`, {
        method: 'DELETE'
      })
      .then(response => response.json())
      .then(data => {
        alert(data.message);
        fetchUsers(searchBar.value);
      });
    }
  };

  // Show the subjects for a specific user
  window.viewSubjects = function(userid, name) {
    selectedUserId = userid;
    selectedUserName.textContent = name;
    detailSection.style.display = 'block';
    fetchSubjects(userid);
  };

function fetchSubjects(userid) {
  fetch(`/api/subjects/${userid}`)
    .then(response => response.json())
    .then(data => {
      subjectTableBody.innerHTML = ''; // Clear existing rows
      data.forEach(subject => {
        const row = document.createElement('tr');
        row.innerHTML = `
       <td>${(subject.formatted_date)}</td>
       <td>${(subject.time_joined)}</td>

          <td>${subject.subject_name}</td>
          <td>
            <select>
              <option value="Active" ${subject.subject_status === 'Active' ? 'selected' : ''}>Active</option>
              <option value="Completed" ${subject.subject_status === 'Completed' ? 'selected' : ''}>Completed</option>
              <option value="Dropped" ${subject.subject_status === 'Dropped' ? 'selected' : ''}>Dropped</option>
              <option value="Pending" ${subject.subject_status === 'Pending' ? 'selected' : ''}>Pending</option>
            </select>
          </td>
          <td>${subject.attendance || ''}</td>
          <td>
            <button class="save" onclick="saveSubjectChanges()">Save</button>
            <button class="delete" onclick="deleteSubject('${subject.id}')">Delete</button>
          </td>
        `;
        subjectTableBody.appendChild(row);
      });
    });
}

window.saveSubjectChanges = function() {
  const rows = subjectTableBody.querySelectorAll('tr');
  const updates = [];
  rows.forEach(row => {
    // Use the correct table cell indexes:
    const subjectName = row.querySelector('td:nth-child(3)').textContent;
    const subjectStatus = row.querySelector('td:nth-child(4) select').value;
    updates.push({ subjectName, subjectStatus });
  });
  fetch(`/api/subjects/${selectedUserId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  })
  .then(response => response.json())
  .then(data => {
    alert(data.message);
    fetchSubjects(selectedUserId);
  });
};


  // Delete a subject
  window.deleteSubject = function(subjectId) {
    if (confirm('Are you sure you want to delete this subject?')) {
      fetch(`/api/subjects/${subjectId}`, {
        method: 'DELETE'
      })
      .then(response => response.json())
      .then(data => {
        alert(data.message);
        fetchSubjects(selectedUserId);
      });
    }
  };

  // Refresh users as you type in the search bar
  searchBar.addEventListener('input', function() {
    fetchUsers(this.value);
  });

  // Initial fetch to populate the user table
  fetchUsers();
});

document.querySelector(".active").addEventListener("mouseenter", function () {
  this.querySelector(".icon").setAttribute("trigger", "in");
});


document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("mouseenter", () => {
        link.querySelector(".icon").setAttribute("trigger", "in");
    });

});
