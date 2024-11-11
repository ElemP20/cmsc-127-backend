// read environment variables
require("dotenv").config();

// set-up express server and cors connections
const express = require("express");
const cors = require("cors");
const app = express();
app.use(express.json());
app.use(cors(
  {
    origin: "*",
    credentials: true
  }
));

// MySQL Connection
const { SQLconnection } = require("./utility");

// Get Adviser Routes
const adviserRoutes = require("./routes/adviserRoutes");
const publicRoutes = require("./routes/publicRoutes");

// Private Routes
app.use("/advisers", adviserRoutes);

// Public API ideas
app.use("/APIs", publicRoutes);

app.listen(process.env.PORT || 8000);
module.exports = app;