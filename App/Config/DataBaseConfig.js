// Copyright (c) 2025 Ahsan Latif (@GittyCandy)
// All Rights Reserved.
//
// Unauthorized access, use, reproduction, modification, distribution,  
// or creation of derivative works based on this code is strictly prohibited  
// without the prior explicit written permission of the owner.  
//
// Violators may be subject to legal action.


const mysql = require('mysql2');
const bcrypt = require('bcryptjs');

const config = {
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'AttendEase_Database_System'
};

// Function to initialize database and tables
async function initializeDatabase() {
  // Connect without a database specified
  const initConnection = mysql.createConnection({
    host: config.host,
    user: config.user,
    password: config.password
  });

  return new Promise((resolve, reject) => {
    initConnection.connect(async (err) => {
      if (err) {
        console.error('🛑 Error connecting to MySQL for initialization:', err);
        return reject(err);
      }

      try {
        console.info('🔧 Creating database if it does not exist...');
        await initConnection.promise().query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\``);
        console.info('✅ Database created or already exists.');

        await initConnection.promise().query(`USE \`${config.database}\``);
        console.info('🔄 Switched to database.');

        console.info('🔧 Creating table "users"...');
        await initConnection.promise().query(`
          CREATE TABLE IF NOT EXISTS users (
            id INT NOT NULL AUTO_INCREMENT,
            userid VARCHAR(50) NOT NULL,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL,
            password VARCHAR(100) NOT NULL,
            role ENUM('student','admin','faculty','user','demoFaculty','demoAdmin') DEFAULT 'user',
            PRIMARY KEY (id),
            UNIQUE KEY (userid)
          )
        `);
        console.info('✅ Table "users" created.');

        console.info('🔧 Creating table "attendance_info"...');
        await initConnection.promise().query(`
          CREATE TABLE IF NOT EXISTS attendance_info (
            id INT NOT NULL AUTO_INCREMENT,
            subject VARCHAR(100) NOT NULL,
            date DATE NOT NULL,
            user_id INT NOT NULL,
            time_joined TIME NOT NULL,
            time_stayed TIME NOT NULL,
            attendance ENUM('Marked','Not Marked','Late','Excused') NOT NULL,
            class_type VARCHAR(100) NOT NULL,
            PRIMARY KEY (id),
            KEY (user_id),
            CONSTRAINT attendance_info_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
          )
        `);
        console.info('✅ Table "attendance_info" created.');

        console.info('🔧 Creating table "events"...');
        await initConnection.promise().query(`
          CREATE TABLE IF NOT EXISTS events (
            id INT NOT NULL AUTO_INCREMENT,
            user_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            date DATE NOT NULL,
            start_minutes INT NOT NULL,
            end_minutes INT NOT NULL,
            notification_email VARCHAR(255) NOT NULL,
            PRIMARY KEY (id),
            KEY (user_id),
            CONSTRAINT events_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
          )
        `);
        console.info('✅ Table "events" created.');

        console.info('🔧 Creating table "profile"...');
        await initConnection.promise().query(`
          CREATE TABLE IF NOT EXISTS profile (
            id INT NOT NULL AUTO_INCREMENT,
            user_id INT NOT NULL,
            subject_code VARCHAR(50) NOT NULL,
            subject_name VARCHAR(100) NOT NULL,
            subject_status ENUM('Active','Completed','Dropped','Pending') NOT NULL,
            start_time TIME NOT NULL,
            end_time TIME DEFAULT NULL,
            credits INT DEFAULT NULL,
            faculty_name VARCHAR(100) DEFAULT NULL,
            semester ENUM('Autumn','Winter','Spring','Summer') NOT NULL,
            PRIMARY KEY (id),
            KEY (user_id),
            CONSTRAINT profile_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
          )
        `);
        console.info('✅ Table "profile" created.');

        console.info('🔧 Creating table "user_settings"...');
        await initConnection.promise().query(`
          CREATE TABLE IF NOT EXISTS user_settings (
            id INT NOT NULL AUTO_INCREMENT,
            user_id INT NOT NULL,
            timezone VARCHAR(50) NOT NULL,
            time_format ENUM('12-hour','24-hour') NOT NULL,
            updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY (user_id),
            CONSTRAINT user_settings_ibfk_1 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
          )
        `);
        console.info('✅ Table "user_settings" created.');

        console.log('🎉 Database and all tables initialized successfully.');
        resolve();
      } catch (err) {
        console.error('🛑 Error during database initialization:', err);
        reject(err);
      } finally {
        initConnection.end();
      }
    });
  });
}

// Function to create a default admin user if it doesn't exist
async function createDefaultAdmin() {
  // Default admin details
  const adminUserId = '10000000012121';
  const adminName = 'Default Admin';
  const adminEmail = 'admin@example.com';
  const plainPassword = 'password'; // Plain text password that will be hashed
  const adminRole = 'admin';

  try {
    // Check if the admin user already exists
    const [rows] = await db.promise().query('SELECT * FROM users WHERE userid = ?', [adminUserId]);
    if (rows.length === 0) {
      // Hash the password before storing it
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      await db.promise().query(
        'INSERT INTO users (userid, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
        [adminUserId, adminName, adminEmail, hashedPassword, adminRole]
      );
      console.info('✅ Default admin user created.');
    } else {
    }
  } catch (error) {
    console.error('🛑 Error creating default admin user:', error);
  }
}

// Create the main database connection
let db = mysql.createConnection(config);

db.connect(async (err) => {
  if (err) {
    if (err.code === 'ER_BAD_DB_ERROR') {
      console.warn('⚠️  Database not found. Attempting automatic creation...');
      try {
        await initializeDatabase();
        console.log('---------------------------------------------------------------------------------------------------');
        console.info('🔄 Database initialized. Please re-run the project to apply the new configuration. Exiting now...');
        console.log('---------------------------------------------------------------------------------------------------');
        process.exit(0);
      } catch (initErr) {
        console.error('🛑 Failed to initialize database:', initErr);
        process.exit(1);
      }
    } else {
      console.error('🛑 Database connection error:', err);
      process.exit(1);
    }
  } else {
    console.log('--------------------------------------------');
    console.log('🚀 Connected to database.');
    console.log('--------------------------------------------');
    // Create the default admin user once connected
    await createDefaultAdmin();
  }
});

module.exports = db;
