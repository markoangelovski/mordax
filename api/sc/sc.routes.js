const router = require("express").Router();

// Path: /api/1/sc/sku-list
// Desc: Uploads product sku-list
router.post("/sku-list", (req, res, next) => {
  res.json({
    description: "Uploads SKU list",
    path: req.originalUrl
  });
});

// Path: /api/1/sc/sku-list
// Desc: Fetches the product sku-list for a single locale
router.get("/sku-list", (req, res, next) => {
  res.json({
    description: "Fetches the product sku-list for a single locale",
    path: req.originalUrl
  });
});

// Path: /api/1/sc/sku-list
// Desc: Deletes the locale and related product list
router.delete("/sku-list", (req, res, next) => {
  res.json({
    description: "Deletes the locale and related product list",
    path: req.originalUrl
  });
});

// Path: /api/1/sc/product
// Desc: Uploads a single product
router.post("/product", (req, res, next) => {
  res.json({
    description: "Uploads a single product",
    path: req.originalUrl
  });
});

// Path: /api/1/sc/product
// Desc: Updates a single product
router.patch("/product", (req, res, next) => {
  res.json({
    description: "Updates a single product",
    path: req.originalUrl
  });
});

// Path: /api/1/sc/product
// Desc: Deletes a single product
router.delete("/product", (req, res, next) => {
  res.json({
    description: "Deletes a single product or multiple products",
    path: req.originalUrl
  });
});

// Path: /api/1/sc/brands
// Desc: Fetches all brands and locales
router.get("/brands", (req, res, next) => {
  res.json({
    description: "Fetches all brands and locales",
    path: req.originalUrl
  });
});

// Path: /api/1/sc/sc-data
// Desc: Fetches the SC data for all products for single locale in one SKU List
router.get("/sc-data", (req, res, next) => {
  res.json({
    description:
      "Fetches the SC data for all products for single locale in one SKU List",
    path: req.originalUrl
  });
});

// Path: /api/1/sc/sc-data-product
// Desc: Fetches the SC data for a single product for single locale in one SKU List
router.get("/sc-data-product", (req, res, next) => {
  res.json({
    description:
      "Fetches the SC data for a single product for single locale in one SKU List",
    path: req.originalUrl
  });
});

module.exports = router;
