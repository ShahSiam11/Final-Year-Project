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



document.addEventListener("DOMContentLoaded", () => {
    const sliders = {
        "spoof-threshold": document.getElementById("spoof-threshold"),
        "frame-sleep-time": document.getElementById("frame-sleep-time"),
        "idle-sleep-time": document.getElementById("idle-sleep-time"),
        "recognition-threshold": document.getElementById("recognition-threshold"),
        "min-score": document.getElementById("min-score"),
    };

    const values = {
        "spoof-threshold": document.getElementById("spoof-threshold-value"),
        "frame-sleep-time": document.getElementById("frame-sleep-time-value"),
        "idle-sleep-time": document.getElementById("idle-sleep-time-value"),
        "recognition-threshold": document.getElementById("recognition-threshold-value"),
        "min-score": document.getElementById("min-score-value"),
    };

    Object.keys(sliders).forEach(key => {
        sliders[key].addEventListener("input", () => {
            values[key].innerText = sliders[key].value;
        });
    });

    document.getElementById("save-config").addEventListener("click", () => {
        const configData = {
            SPOOF_THRESHOLD: sliders["spoof-threshold"].value,
            FRAME_SLEEP_TIME: sliders["frame-sleep-time"].value,
            IDLE_SLEEP_TIME: sliders["idle-sleep-time"].value,
            RECOGNITION_THRESHOLD: sliders["recognition-threshold"].value,
            MIN_SCORE: sliders["min-score"].value,
            MIN_DURATION: document.getElementById("min-duration").value,
        };

        fetch("/api/config", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(configData),
        })
            .then(response => response.json())
            .then(data => {
                alert("Configuration updated successfully!");
            })
            .catch(error => {
                alert("Failed to update configuration.");
                console.error(error);
            });
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
