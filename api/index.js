process.env.NODE_ENV !== "production" && require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const { connectDb } = require("../db/mongo.js");

const { notFound, errorHandler } = require("../middleware/errorHandlers.js");

const app = express();

// Connect to database
connectDb();

// Middlewares
app.use(express.json());
app.use(cors());
app.use(morgan("combined"));

app.use((req, res, next) => {
  // Sets the cache for Vercel https://vercel.com/guides/using-express-with-vercel#standalone-express
  res.setHeader("Cache-Control", "s-max-age=1, stale-while-revalidate");
  next();
});

// Home route
app.get("/", (req, res) => {
  const host = process.env.NODE_ENV === "development" ? "http://" : "https://";
  res.json({
    status: "ok",
    message: "Greetings from Mordax!",
    docs: host + req.get("host") + "/api/1/docs"
  });
});

// Routes
app.use("/api/1", require("./router.js"));

// Error handlers
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log("Mordax started on port: ", PORT));
