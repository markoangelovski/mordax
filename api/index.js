process.env.NODE_ENV !== "production" && require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const { connectDb } = require("../db/mongo.js");

const { host } = require("../config");

const { checkKey } = require("../middleware/auth.js");
const { analytics } = require("../middleware/analytics.js");
const { notFound, errorHandler } = require("../middleware/errorHandlers.js");
const { pagination } = require("../middleware/pagination.js");

const app = express();

// Connect to database
connectDb();

// Middlewares
app.use(express.json());
app.use(cors());
app.use(morgan("combined"));
const savedKeys = [];
app.use(checkKey(savedKeys));
app.use(analytics);
app.use(pagination);

// Home route
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Greetings from Mordax!",
    docs: host + "/1/docs"
  });
});

// Routes
app.use("/1", require("./router.js"));

// Error handlers
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log("Mordax started on port: ", PORT));
