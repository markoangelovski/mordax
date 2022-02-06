const path = require("path");
const router = require("express").Router();
const xlsx = require("xlsx");
const multer = require("multer");
const upload = multer();

const Brand = require("./brand.model");

// Path: /api/1/sc/sku-list?key=123456789&brand=Herbal Essences&locale=en-us&url=https://www.herbalessences.com&scButtonKey=12ed8c04-265f-4c6b-838e-bd390431accd&scCarouselKey=1234
// Desc: Uploads product sku-list
router.post("/sku-list", upload.single("skuList"), async (req, res, next) => {
  try {
    const { key, brand, locale, url, scButtonKey, scCarouselKey } = req.query;
    const buffer = req.file?.buffer;

    const newBrand = {
      createdBy: key,
      brand,
      locale,
      url,
      scButtonKey,
      scCarouselKey,
      skuList: []
    };

    // If SKU list is uploaded, parse the spreadsheet and populate the skuList array
    if (buffer) {
      const workbook = xlsx.read(buffer, { type: "buffer" });

      // Convert first sheet to json
      const products = xlsx.utils.sheet_to_json(
        workbook.Sheets[workbook.SheetNames[0]]
      );

      products.forEach(product => {
        newBrand.skuList.push({
          title: {
            value: product.Title,
            creationDate: new Date().toISOString()
          },
          url: {
            value: product.URL,
            creationDate: new Date().toISOString()
          },
          sku: {
            value: product.SKU,
            creationDate: new Date().toISOString()
          },
          scMpId: {
            value: product.mpId,
            creationDate: new Date().toISOString()
          },
          scApiId: {
            value: product.apiId,
            creationDate: new Date().toISOString()
          }
        });
      });
    }

    const existingBrand = await Brand.findOne({ url });

    let createdBrand;

    if (existingBrand) {
      // TODO: napravi provjeru ako brend postoji, da se updateaju proizvodi po SKU broju
    } else {
      createdBrand = await Brand.create(newBrand);
    }

    res.json({
      status: "ok",
      brand: createdBrand
    });
  } catch (error) {
    console.warn("Error occurred in POST /api/1/sc/sku-list route", error);
    next(error);
  }
});

// Path: /api/1/sc/sku-list?key=123456789&url=https://www.herbalessences.com&download=all/noSellers
// Desc: Fetches the product sku-list for a single locale
router.get("/sku-list", async (req, res, next) => {
  const { url, download } = req.query;

  try {
    const existingBrand = await Brand.findOne({ url });

    if (existingBrand) {
      // TODO: napravi da se može downloadat ili cijela SKU lista kao exelica, ili samo proizvodi bez sellera
      res.json({
        status: "ok",
        brand: existingBrand
      });
    } else {
      res.status(404);
      next({
        message: `Locale ${url} not found.`
      });
    }
  } catch (error) {
    console.warn("Error occurred in GET /api/1/sc/sku-list route", error);
    next(error);
  }
});

// Path: /api/1/sc/sku-list?key=123456789&url=https://www.herbalessences.com
// Desc: Deletes the locale and related product list
router.delete("/sku-list", async (req, res, next) => {
  const { url } = req.query;

  try {
    const { deletedCount } = await Brand.deleteOne({ url });

    if (deletedCount) {
      res.json({
        status: "ok",
        message: `Locale ${url} deleted successfully.`
      });
    } else {
      res.status(404);
      next({
        message: `Locale ${url} not found.`
      });
    }
  } catch (error) {
    console.warn("Error occurred in DELETE /api/1/sc/sku-list route", error);
    next(error);
  }
});

// Path: /api/1/sc/sku-list/template
// Desc: Downloads the SKU List template
router.get("/sku-list-template", async (req, res, next) => {
  res.download(
    path.join(__dirname, "../../public/Test Herbal Essences en-us.xlsx")
  );
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
router.get("/brands", async (req, res, next) => {
  try {
    const brands = await Brand.find().select("-_id brand locale url");

    if (brands) {
      res.json({
        status: "ok",
        brandsCount: brands.length,
        brands
      });
    } else {
      res.status(404);
      next({
        message: `No brands found.`
      });
    }
  } catch (error) {
    console.warn("Error occurred in GET /api/1/sc/brands route", error);
    next(error);
  }
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
