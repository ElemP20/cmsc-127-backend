const express = require("express");
const router = express.Router();
const axios = require('axios'); // added axios import

const { SQLconnection } = require("../utility");

router.get("/getProgramCourses/:program_id", async (req, res) => {
  try {
    const {program_id} = req.params;
    const connection = SQLconnection();
    const query = `SELECT course_id, term, year FROM Checklist WHERE program_id = '${program_id}'`;
    const [courses] = await connection.query(query);
    connection.end();
    return res.json(courses);
  } catch (err) {
    console.error("Error fetching advisers: ", err);
    res.status(500).send("Error fetching advisers.");
  }
});

router.get("/getCourseCatalogue", async (req, res) => {
  try {
    const connection = SQLconnection();
    const query = `SELECT * FROM Course_Catalogue WHERE 1`;
    const [courses] = await connection.query(query);
    connection.end();
    return res.json(courses);
  } catch (err) {
    res.status(500).send("Error fetching courses.");
  }
});

router.get("/getAllPrograms", async (req, res) => {
  try {
    const connection = SQLconnection();
    const query = `SELECT * FROM Program WHERE 1`;
    const [courses] = await connection.query(query);
    connection.end();
    return res.json(courses);
  } catch (err) {
    console.error("Error fetching advisers: ", err);
    res.status(500).send("Error fetching advisers.");
  }
});

router.get("/getAllAdvisers", async (req, res) => {
  try {
    const connection = SQLconnection();
    const query = `SELECT adviser_id, first_name, middle_name, last_name, position, department FROM Adviser_Account JOIN Teacher ON Adviser_Account.teacher_id=Teacher.teacher_id WHERE 1`;
    const [advisers] = await connection.query(query);
    connection.end();
    return res.json(advisers);
  } catch (err) {
    console.error("Error fetching advisers: ", err);
    res.status(500).send("Error fetching advisers.");
  }
});

router.post("/createChecklist", async (req, res) => {
  const {studentID, adviser_id, program_id} = req.body;
  const connection = SQLconnection();
  try {
    let query = `INSERT INTO Checklist_Record (checklist_record_id, course_id, student_id, status)
              SELECT 
                ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) + (SELECT COUNT(*) FROM Checklist_Record) AS checklist_id,
                course_id,
                ${studentID} AS student_id,
                0 AS status
              FROM
                Checklist
              WHERE 
                program_id = ${program_id};`;
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

module.exports = router;