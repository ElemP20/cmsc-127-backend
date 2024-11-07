const express = require("express");
const router = express.Router();

const { SQLconnection } = require("../utility");

// Authentication of Token
const jwt = require("jsonwebtoken");
const { authenticateToken } = require("../utility")

// get all advisee account
router.get("/getAllAdvisees", authenticateToken, async (req, res) => {
  try {
    const { user } = req.user;
    const connection = SQLconnection();
    const query = `SELECT
    Student_account.student_id,
    Program.program_name, 
    Student_account.first_name, 
    Student_account.middle_name, 
    Student_account.last_name, 
    Student_account.email 
    FROM Student_account 
    JOIN Program 
    ON Student_account.program_id = Program.program_id WHERE adviser_id = '${user.adviser_id}';`;
    const [data] = await connection.query(query);
    return res.json({advisees:data});
  } catch (err) {
    console.error("Error fetching details: ", err);
    res.status(500).send("Error fetching details.");
  }
});

// get user info
router.get("/getUser", authenticateToken, async (req, res) => {
  const { user } = req.user;
  const connection = SQLconnection();
  const query = `SELECT * FROM Advisor_account WHERE adviser_id = '${user.adviser_id}'`;
  const [isUser] = await connection.query(query);
  if(isUser.length < 1) return res.sendStatus(403);
  return res.json({
    user
  });
});


// log in adviser
router.post("/login", async (req, res) => {
  try {
    const {adviser_id, password} = req.body;
    const connection = SQLconnection();
    const query = `
    SELECT
      adviser_id, 
      Advisor_account.teacher_id, 
      password, 
      first_name, 
      middle_name, 
      last_name, 
      position, 
      department 
    FROM Advisor_account 
    JOIN teacher 
    ON Advisor_account.teacher_id = teacher.teacher_id  WHERE adviser_id = '${adviser_id}'`;
    const [user] = await connection.query(query);
    if(user.length == 0) return res.json({error: true, message:"User does not exist"});
    const validPassword = (user[0].password === password);
    if(!validPassword) return res.json({error: true, message:"Incorrect password"});
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
    return res.json({error: false, message:"User Logged In", accessToken});
  } catch (err) {
    console.error("Error fetching details: ", err);
    res.status(500).send("Error fetching details.")
  }
});

module.exports = router;