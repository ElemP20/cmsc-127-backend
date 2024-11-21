const express = require("express");
const router = express.Router();

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

module.exports = router;