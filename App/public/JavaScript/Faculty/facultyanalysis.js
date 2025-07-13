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


       let myChart;

        // Fetch subjects and populate the dropdown
        async function fetchSubjects() {
            const response = await fetch('http://localhost:3030/api/faculty-subject-analytics');
            const data = await response.json();
            const subjectSelect = document.getElementById('subjectSelect');
            data.forEach(subject => {
                const option = document.createElement('option');
                option.value = subject.subject;
                option.textContent = subject.subject;
                subjectSelect.appendChild(option);
            });
        }

        // Fetch detailed user attendance data for the selected subject
        async function fetchUserDetails(subject) {
            const response = await fetch(`http://localhost:3030/api/subject-user-analytics/${subject}`);
            const data = await response.json();
            return data;
        }

        // Render the pie chart
        function renderPieChart(subject, data) {
            const ctx = document.getElementById('attendanceChart').getContext('2d');
            if (myChart) {
                myChart.destroy(); // Destroy existing chart
            }
            myChart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: ['Marked', 'Not Marked', 'Late', 'Excused'],
                    datasets: [{
                        label: 'Attendance Distribution',
                        data: [data.marked, data.not_marked, data.late, data.excused],
                        backgroundColor: [
                            'rgba(75, 192, 192, 0.6)', // Marked (green)
                            'rgba(255, 99, 132, 0.6)', // Not Marked (red)
                            'rgba(255, 206, 86, 0.6)', // Late (yellow)
                            'rgba(153, 102, 255, 0.6)' // Excused (purple)
                        ],
                        borderColor: [
                            'rgba(75, 192, 192, 1)',
                            'rgba(255, 99, 132, 1)',
                            'rgba(255, 206, 86, 1)',
                            'rgba(153, 102, 255, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: false,
                    plugins: {
                        title: {
                            display: true,
                            text: `Subject: ${subject}`,
                            font: {
                                size: 16
                            }
                        }
                    }
                }
            });
        }

        // Render the user details table
        function renderUserDetailsTable(data) {
            const tbody = document.querySelector('#userDetailsTable tbody');
            tbody.innerHTML = ''; // Clear existing rows
            data.forEach(user => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${user.userid}</td>
                    <td>${user.name}</td>
                    <td>${user.marked}</td>
                    <td>${user.not_marked}</td>
                    <td>${user.late}</td>
                    <td>${user.excused}</td>
                `;
                tbody.appendChild(row);
            });
        }

        // Handle subject selection
        async function handleSubjectChange() {
            const subject = document.getElementById('subjectSelect').value;
            if (!subject) return;

            // Fetch subject analytics
            const subjectResponse = await fetch(`http://localhost:3030/api/faculty-subject-analytics`);
            const subjectData = await subjectResponse.json();
            const selectedSubjectData = subjectData.find(item => item.subject === subject);

            // Render pie chart
            renderPieChart(subject, selectedSubjectData);

            // Fetch and render user details
            const userDetails = await fetchUserDetails(subject);
            renderUserDetailsTable(userDetails);
        }

        // Initialize
        async function init() {
            await fetchSubjects();
            document.getElementById('subjectSelect').addEventListener('change', handleSubjectChange);
        }

        init();



document.querySelector(".active").addEventListener("mouseenter", function () {
  this.querySelector(".icon").setAttribute("trigger", "in");
});


document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("mouseenter", () => {
        link.querySelector(".icon").setAttribute("trigger", "in");
    });

});
