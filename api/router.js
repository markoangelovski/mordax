const path = require("path");

const router = require("express").Router();

// KEY routes
router.use("/keys", require("./keys/keys.routes.js"));

// PriceSpider routes

// Smartcommerce routes
router.use("/sc", require("./sc/sc.routes.js"));

// Documentation route
router.get("/docs", (req, res) => {
  res.download(
    path.join(__dirname, "../docs/Mordax Documentation.postman_collection.json")
  );
});

module.exports = router;
