const jwt = require("jsonwebtoken");
const mysql = require('mysql2/promise');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.sendStatus(401);
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

const SQLconnection = () => {
  try {
    const connectionConfiguration = {
      host : process.env.DB_HOST,
      user : process.env.DB_USER,
      password : process.env.DB_PASSWORD,
      database : process.env.DB_NAME,
      port : process.env.DB_PORT,
    }

    const connection = mysql.createPool(connectionConfiguration);
    return connection;
    
  } catch (err) {
    console.error("Error connecting to the database", err);
    throw err;
  }
};

module.exports = { authenticateToken, SQLconnection}