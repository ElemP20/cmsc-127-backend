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

// get adviser Routes
const adviserRoutes = require("./routes/adviserRoutes");

// APIS
app.use("/advisers", adviserRoutes);

app.listen(process.env.PORT || 8000);
module.exports = app;