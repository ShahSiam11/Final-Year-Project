// Copyright (c) 2025 Ahsan Latif (@GittyCandy)  
// All Rights Reserved.  
//  
// Unauthorized access, use, reproduction, modification, distribution,  
// or creation of derivative works based on this code is strictly prohibited  
// without the prior explicit written permission of the owner.  
//  
// Violators may be subject to legal action.  

const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const db = require('./Config/DataBaseConfig.js');


const RegisterRoute = require('./Routes/RegisterRoute.js');
const LoginRoute = require('./Routes/LoginRoute.js');
const DashboardRoute = require('./Routes/DashBoardRoute.js');
const TimeTableRoute = require('./Routes/TimeTableRoute.js');
const AnalysisRoute = require('./Routes/AnalysisRoute.js');
const ProfileRoute = require('./Routes/ProfileRoute.js');
const NotificationRoute = require('./Routes/NotificationRoute.js');
const SettingsRoute = require('./Routes/SettingsRoute.js');

const AttendanceRoute = require('./Routes/AttendanceRoute.js');
const FacultyDashBoardRoute = require('./Routes/FacultyDashBoardRoute.js');
const FacultyAnalysisRoute = require('./Routes/FacultyAnalysisRoute.js');
const ManagementRoute = require('./Routes/ManagementRoute.js');

const AdminDashBoardRoute = require('./Routes/AdminDashBoardRoute.js');
const AdminManagementRoute = require('./Routes/AdminManagementRoute.js');
const InfoLogsRoute = require('./Routes/InfoLogsRoute.js');
const ConfigureRoute = require('./Routes/ConfigureRoute.js');


const LogoutRoute = require('./Routes/LogoutRoute.js');
const NotFoundRoute = require('./Routes/404Route.js');

const logFilePath = path.join(__dirname, 'face_recognition.log');



const { logFileMiddleware, dataMiddleware } = require('./MiddleWares/FileMiddleWare.js'); // Modularized middlewares
const upload = require('./MiddleWares/UploadMiddleWare.js');

//API
const Logs_Health = require('./API/Logs_Health.js');
const Real_Fake_Analysis = require('./API/Real_Fake_Analysis.js');
const Logs_General = require('./API/Logs_General.js');
const Admin_User_Management = require('./API/Admin_User_Management.js');
const Admin_Configure = require('./API/Admin_Configure.js');
const Add_Users = require('./API/Add_Users.js');

const ClassType_Info = require('./API/ClassType_Info.js');
const Faculty_Analysis = require('./API/Faculty_Analysis.js');
const Faculty_User_Management = require('./API/Faculty_User_Management.js');
const Python_Start_Stop = require('./API/Python_Start_Stop.js');
const FacultyDashabordAPI = require('./API/FacultyDashabordAPI.js');


const Greet = require('./API/Greet.js');
const User_Profile = require('./API/User_Profile.js');
const User_Analysis = require('./API/User_Analysis.js');
const User_Dashboard = require('./API/User_Dashboard.js');
const User_Notification = require('./API/User_Notification.js');
const EmailHandler = require('./API/EmailHandler.js');

// npm install express, csv-parser, mysql2, body-parser, bcryptjs, express-session, multer, dotenv, fs, nodemailer

// Create an Express app
const app = express();
const port = 3030;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: false,
}));

// Static file routes
app.get('/', (req, res) => res.sendFile(__dirname + '/public/HTML/index.html'));


//APIs
app.use("/", Logs_Health); //Health Analysis - admin
app.use("/", Real_Fake_Analysis); //Number of real or face faces Analysis - admin
app.use("/", Logs_General); // Infologs, debug bla bla - admin
app.use("/", Admin_User_Management); //Update, manage, delte user/subject - admin
app.use("/", Admin_Configure); //Update, manage, delte user/subject - admin
app.use("/", Add_Users); //Update, manage, delte user/subject - admin

app.use("/", ClassType_Info); //Update, manage, delte user/subject - admin
app.use("/", Faculty_Analysis); //Update, manage, delte user/subject - admin
app.use("/", Faculty_User_Management); //Update, manage, delte user/subject - admin
app.use("/", Python_Start_Stop); //Update, manage, delte user/subject - admin
app.use("/", FacultyDashabordAPI);

app.use("/", Greet); //Update, manage, delte user/subject - admin
app.use("/", User_Profile); //Update, manage, delte user/subject - admin
app.use("/", User_Analysis); //Update, manage, delte user/subject - admin
app.use("/", User_Dashboard); //Update, manage, delte user/subject - admin
app.use("/", User_Notification); //Update, manage, delte user/subject - admin
app.use("/", EmailHandler); //Update, manage, delte user/subject - admin


/*---------------*/

const { spawn } = require('child_process');

app.get('/run-tests', (req, res) => {
  // Set headers for SSE
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  });

  // Spawn the test process (make sure 'npm test' is defined)
  const testProcess = spawn('npm', ['test']);

  // When data is received from stdout, send it to the client.
  testProcess.stdout.on('data', (data) => {
    res.write(`data: ${data.toString()}\n\n`);
  });

  // When data is received from stderr, send error information.
  testProcess.stderr.on('data', (data) => {
    res.write(`data: ERROR: ${data.toString()}\n\n`);
  });

  // When the process exits, inform the client.
  testProcess.on('close', (code) => {
    res.write(`data: Tests completed with exit code ${code}\n\n`);
    res.end();
  });
});


// Dynamic file routes
app.get('/log-files', logFileMiddleware);
app.get('/data/:logFile', dataMiddleware);


 // api for timezone

 app.post("/save-settings", (req, res) => {
    const { user_id, timezone, time_format } = req.body;

    if (!user_id || !timezone || !time_format) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Insert or update settings
    const sql = `
        INSERT INTO user_settings (user_id, timezone, time_format)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE timezone = VALUES(timezone), time_format = VALUES(time_format)`;

    db.query(sql, [user_id, timezone, time_format], (err, result) => {
        if (err) {
            console.error(" Error saving settings:", err);
            return res.status(500).json({ success: false, message: "Database error" });
        }
        res.json({ success: true, message: "Settings saved successfully!" });
    });
});

// *API to Get User Settings*
app.get("/get-settings/:user_id", (req, res) => {
    const { user_id } = req.params;

    const sql = "SELECT timezone, time_format FROM user_settings WHERE user_id = ?";
    db.query(sql, [user_id], (err, results) => {
        if (err) {
            console.error(" Error fetching settings:", err);
            return res.status(500).json({ success: false, message: "Database error" });
        }
        if (results.length === 0) {
            return res.json({ success: false, message: "No settings found" });
        }
        res.json({ success: true, settings: results[0] });
    });
});



app.use('/upload', upload);

// Routes
app.use("/login", LoginRoute);
app.use("/Register", RegisterRoute);

app.use("/Dashboard", DashboardRoute);
app.use("/TimeTable", TimeTableRoute);
app.use("/Analysis", AnalysisRoute);
app.use("/Profile", ProfileRoute);
app.use("/Notification", NotificationRoute);
app.use("/Settings", SettingsRoute);


app.use("/logout", LogoutRoute);

app.use("/Attendance_fac", AttendanceRoute); //this one shuold be only allowed to users with role "faculty"
app.use("/Faculty_Dashboard", FacultyDashBoardRoute);
app.use("/Faculty_Analysis", FacultyAnalysisRoute);
app.use("/Management", ManagementRoute);

app.use("/Admin_Dashboard", AdminDashBoardRoute);
app.use("/Admin_Management", AdminManagementRoute);
app.use("/Info_Logs", InfoLogsRoute);
app.use("/Configure", ConfigureRoute);

app.use('*', NotFoundRoute);


app.listen(port, () => {
    console.clear();
    process.stdout.write('\x1Bc'); 
    console.log('--------------------------------------------');
    console.log(`Server running on http://localhost:${port}`);
});

