// Hala ka Aaron ulit

const express = require("express");
const router = express.Router();

const { SQLconnection } = require("../utility");

const axios = require('axios');

// Authentication of Token
const jwt = require("jsonwebtoken");
const { authenticateToken } = require("../utility")

// Introduce Encryption
const bcrypt = require("bcrypt");

// Delete Student
router.delete("/delete/:student_id", authenticateToken, async (req, res) => {
  try {
    const { student_id } = req.params;
    const connection = SQLconnection();
    let query = `DELETE FROM Advising_Record WHERE student_id = '${student_id}'`;
    await connection.query(query);
    query = `DELETE FROM Checklist_Record WHERE student_id = '${student_id}'`;
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
    const query = `SELECT student_id, status FROM Advising_Record WHERE adviser_id = '${user.adviser_id}'`;
    const [data] = await connection.query(query);
    const students = await axios.get("https://sais-project.vercel.app/api/student/getAllStudents");
    return res.json({advisees: data, students: students.data});
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
    const query = `
    SELECT sub.course_id, sub.term, sub.year, Course_Catalogue.name, Course_Catalogue.category, Course_Catalogue.units, sub.status FROM (SELECT DISTINCT Checklist_Record.course_id, Checklist.term, Checklist.year, status 
    FROM Checklist_Record 
    RIGHT JOIN Checklist 
    ON Checklist_Record.course_id = Checklist.course_id WHERE student_id = ${student_id}) as sub
    RIGHT JOIN Course_Catalogue 
    ON Course_Catalogue.course_id = sub.course_id WHERE 1`;
    const [checklist] = await connection.query(query);
    connection.end();
    return res.json(checklist);
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