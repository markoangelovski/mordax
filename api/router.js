const path = require("path");

const router = require("express").Router();

// Key routes
router.use("/keys", require("./keys/keys.routes.js"));

// Locales routes
router.use("/locales", require("./locales/locales.routes.js"));

// Pages routes
router.use("/pages", require("./pages/pages.routes.js"));

// PriceSpider routes
router.use("/ps", require("./ps/ps.routes.js"));

// Smartcommerce routes
router.use("/sc", require("./sc/sc.routes.js"));

// BIN Lite routes
router.use("/binlite", require("./BINLite/binlite.routes.js"));

// Documentation route
router.get("/docs", (req, res) => {
  res.download(
    path.join(__dirname, "../docs/Mordax Documentation.postman_collection.json")
  );
});

module.exports = router;
