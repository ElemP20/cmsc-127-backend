const express = require("express");
const router = express.Router();

const { SQLconnection } = require("../utility");

// Authentication of Token
const jwt = require("jsonwebtoken");
const { authenticateToken } = require("../utility")

// Introduce Encryption
const bcrypt = require("bcrypt");

// Add Student
router.post("/addStudent", async (req, res) => {
  const {studentID, first_name, middle_name, last_name, adviser_id, program_id, date_of_birth, year, address, contact, email, password} = req.body;
  const connection = SQLconnection();
  try {
    let query = `
    INSERT INTO Student_Account (student_id, first_name, middle_name, last_name, adviser_id, program_id, date_of_birth, year, address, phone_number, email, password) 
    VALUES ('${studentID}', '${first_name}', '${middle_name}', '${last_name}', '${adviser_id}', '${program_id}', '${date_of_birth}', '${year}', '${address}', '${contact}', '${email}', '${password}')`;
    await connection.query(query);
    query = `INSERT INTO Checklist_Record (checklist_record_id, course_id, student_id, status)
              SELECT 
                  (SELECT COUNT(*) FROM Checklist_Record) + ROW_NUMBER() OVER() AS checklist_id,
                  course_id, 
                  student_id, 
                  0
              FROM (
                  SELECT course_id, sub.student_id
                  FROM Checklist
                  JOIN (SELECT student_id
                        FROM Student_Account
                        WHERE student_id = ${studentID}) AS sub
                  WHERE program_id = ${program_id}
              ) AS subsub;`;
    await connection.query(query);
    query = `INSERT INTO Advising_Record (advising_id, adviser_id, student_id, status)
            SELECT 
                (SELECT COUNT(*) FROM Advising_Record) + ROW_NUMBER() OVER(),
                '${adviser_id}',  
                '${studentID}', 
                0 
            FROM (SELECT 1) as sub`;
    await connection.query(query);
    connection.end();
    return res.json({Error: false, message:"Student Added Successfully"});
  } catch (err) {
    console.error("Error fetching details: ", err);
    res.status(500).send("Error fetching details.");
  }
})

// Delete Student
router.delete("/delete/:student_id", authenticateToken, async (req, res) => {
  try {
    const { student_id } = req.params;
    const connection = SQLconnection();
    let query = `DELETE FROM Advising_Record WHERE student_id = '${student_id}'`;
    await connection.query(query);
    query = `DELETE FROM Checklist_Record WHERE student_id = '${student_id}'`;
    await connection.query(query);
    query = `DELETE FROM Student_Account WHERE student_id = '${student_id}'`;
    await connection.query(query);
    connection.end();
    return res.json({Error: false, message:"Student Deleted Successfully"});
  } catch (err) {
    console.error("Error fetching details: ", err);
    res.status(500).send("Error fetching details.");
  }
});

// Get All Advisees API
router.get("/getAllAdvisees", authenticateToken, async (req, res) => {
  try {
    const { user } = req.user;
    const connection = SQLconnection();
    const query = `
    SELECT sub.student_id, sub.program_name, first_name, middle_name, last_name, email, year, Record.status
    FROM (SELECT
            Student.student_id,
            Program.program_name, 
            Student.first_name, 
            Student.middle_name, 
            Student.last_name, 
            Student.email,
            Student.year
          FROM Student_Account as Student 
          JOIN Program 
          ON Student.program_id = Program.program_id WHERE 1) as sub
    INNER JOIN Advising_Record as Record
    ON sub.student_id = Record.student_id
    WHERE Record.adviser_id = '${user.adviser_id}';`;
    const [data] = await connection.query(query);
    connection.end();
    return res.json({advisees:data});
  } catch (err) {
    console.error("Error fetching details: ", err);
    res.status(500).send("Error fetching details.");
  }
});

// Get User Info
router.get("/getUser", authenticateToken, async (req, res) => {
  try {
  const { user } = req.user;
  const connection = SQLconnection();
  const query = `SELECT * FROM Adviser_Account WHERE adviser_id = '${user.adviser_id}'`;
  const [isUser] = await connection.query(query);
  if(isUser.length < 1) return res.sendStatus(403);
  connection.end();
  return res.json({
    user
  });
  } catch (err) {
    console.error("Error fetching details: ", err);
    res.status(500).send("Error fetching details.");
  }
});

// Get Checklist of Student
router.get("/getChecklist/:student_id", authenticateToken, async (req, res) => {
  try {
    const { student_id } = req.params;
    const connection = SQLconnection();
    const query = `SELECT DISTINCT subsub.course_id,
       subsub.name,
       subsub.description,
       subsub.category,
       subsub.units,
       subsub.status,
       Checklist.term,
       Checklist.year
FROM (SELECT sub.course_id,
             sub.name,
             sub.description,
             sub.units,
             sub.category,
             sub.status,
             Student_Account.program_id
      FROM (SELECT Checklist_Record.course_id,
                   Course_Catalogue.name,
                   Course_Catalogue.description,
                   Course_Catalogue.units,
                   Course_Catalogue.category,
                   Checklist_Record.status,
                   Checklist_Record.student_id
            FROM Checklist_Record
            JOIN Course_Catalogue
            ON Checklist_Record.course_id = Course_Catalogue.course_id
            WHERE Checklist_Record.student_id = ${student_id}) as sub
      JOIN Student_Account ON sub.student_id = Student_Account.student_id) as subsub
JOIN Checklist WHERE
Checklist.program_id = subsub.program_id AND Checklist.course_id = subsub.course_id`;
    const [checklist] = await connection.query(query);
    connection.end();
    return res.json({checklist});
  } catch (err) {
    console.error("Error fetching details: ", err);
    res.status(500).send("Error fetching details.");
  }
});

// Add Student to Checklist Record
router.post("/addChecklist", authenticateToken, async (req, res) => {
  try {
    const { student_id, course_id } = req.body;
    const connection = SQLconnection();
    const query = `INSERT INTO Checklist_Record (student_id, course_id, status) VALUES ('${student_id}', '${course_id}', FALSE)`;
    const [data] = await connection.query(query);
    connection.end();
    return res.json({data});
  } catch (err) {
    console.error("Error fetching details: ", err);
    res.status(500).send("Error fetching details.");
  }
});

// Log In for Adviser
router.post("/login", async (req, res) => {
  try {
    const {adviser_id, password} = req.body;
    const connection = SQLconnection();
    const query = `
    SELECT
      adviser_id, 
      Adviser_Account.teacher_id,
      password, 
      first_name, 
      middle_name, 
      last_name, 
      position, 
      department 
    FROM Adviser_Account 
    JOIN Teacher 
    ON Adviser_Account.teacher_id = Teacher.teacher_id  WHERE adviser_id = '${adviser_id}'`;
    const [user] = await connection.query(query);
    if(user.length == 0) return res.json({error: true, message:"User does not exist"});

    const passCheck = bcrypt.compare(password, user[0].password);

    if(!passCheck) return res.json({error: true, message:"Incorrect password"});
    const account = {
      user:{
        adviser_id: user[0].adviser_id,
        teacher_id: user[0].teacher_id,
        first_name: user[0].first_name,
        middle_name: user[0].middle_name,
        last_name: user[0].last_name,
        position: user[0].position,
        department: user[0].department
      }
    }
    const accessToken = jwt.sign(account, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'});
    connection.end();
    return res.json({error: false, message:"User Logged In", accessToken});
  } catch (err) {
    console.error("Error fetching details: ", err);
    res.status(500).send("Error fetching details.")
  }
});

// Tag Student
router.post("/tagStudent/", authenticateToken, async (req, res) => {
  try {
    const { student_id, status } = req.body;
    const connection = SQLconnection();
    const query = `UPDATE Advising_Record SET status = '${status?0:1}' WHERE student_id = '${student_id}'`;
    const [data] = await connection.query(query);
    connection.end();
    return res.json({Error: false, message:status?"Student Untagged":"Student Tagged"});
  } catch (err) {
    console.error("Error fetching details: ", err);
    res.status(500).send("Error fetching details.");
  }
});

module.exports = router;