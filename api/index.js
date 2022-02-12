process.env.NODE_ENV !== "production" && require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const { connectDb } = require("../db/mongo.js");

const { checkKey } = require("../middleware/auth.js");
const { analytics } = require("../middleware/analytics.js");
const { notFound, errorHandler } = require("../middleware/errorHandlers.js");

const app = express();

// App start date, used for calculating request time for analytics
const appStart = Date.now(),
  buffer = [];

// Connect to database
connectDb();

// Middlewares
app.use(express.json());
app.use(cors());
app.use(morgan("combined"));
app.use(checkKey);
app.use(analytics(appStart, buffer));
app.use((req, res, next) => {
  // Sets the cache for Vercel https://vercel.com/guides/using-express-with-vercel#standalone-express
  res.setHeader("Cache-Control", "s-max-age=1, stale-while-revalidate");
  next();
});

// Home route
app.get("/", (req, res) => {
  const protocol =
    process.env.NODE_ENV === "development" ? "http://" : "https://";
  res.json({
    status: "ok",
    message: "Greetings from Mordax!",
    docs: protocol + req.get("host") + "/api/1/docs"
  });
});

// Routes
app.use("/api/1", require("./router.js"));

// Error handlers
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log("Mordax started on port: ", PORT));
