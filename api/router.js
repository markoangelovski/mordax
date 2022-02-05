const path = require("path");

const router = require("express").Router();

// User routes

// PriceSpider routes

// Smartcommerce routes
router.use("/sc", require("./sc/sc.routes.js"));

// Documentation route
router.get("/docs", (req, res) => {
  res.download(path.join(__dirname, "../docs/Mordax.postman_collection.json"));
});

module.exports = router;
