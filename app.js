process.env.NODE_ENV !== "production" && require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const { notFound, errorHandler } = require("./middleware/errorHandlers.js");

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());
app.use(morgan("combined"));

app.use("/api/1", require("./api/router.js"));

// Error handlers
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log("Mordax started on port: ", PORT));
