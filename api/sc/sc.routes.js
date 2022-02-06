const path = require("path");
const router = require("express").Router();
const xlsx = require("xlsx");
const axios = require("axios");
const multer = require("multer");
const upload = multer();

const Brand = require("./brand.model");

const { scButtonUrl, scCarouselUrl } = require("../../config");

// Path: /api/1/sc/sku-list?key=123456789&brand=Herbal Essences&locale=en-us&url=https://www.herbalessences.com&scButtonKey=12ed8c04-265f-4c6b-838e-bd390431accd&scCarouselKey=1234
// Desc: Uploads product sku-list
router.post("/sku-list", upload.single("skuList"), async (req, res, next) => {
  try {
    const { key, brand, locale, url, newUrl, scButtonKey, scCarouselKey } =
      req.query;
    const buffer = req.file?.buffer;

    const newBrand = {
      createdBy: key,
      brand: {
        value: brand,
        createdAt: new Date().toISOString()
      },
      locale: {
        value: locale,
        createdAt: new Date().toISOString()
      },
      url: {
        value: url,
        createdAt: new Date().toISOString()
      },
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
            createdAt: new Date().toISOString()
          },
          url: {
            value: product.URL,
            createdAt: new Date().toISOString()
          },
          sku: {
            value: product.SKU,
            createdAt: new Date().toISOString()
          },
          scMpId: {
            value: product.mpId,
            createdAt: new Date().toISOString()
          },
          scApiId: {
            value: product.apiId,
            createdAt: new Date().toISOString()
          }
        });
      });
    }

    const existingBrand = await Brand.findOne({ "url.value": url });

    if (existingBrand) {
      let brandUpdated = false;
      if (existingBrand.skuList.length !== newBrand.skuList.length) {
        // TODO: napravi provjeru ako brend postoji, da se updateaju proizvodi po SKU broju
        existingBrand.skuList = newBrand.skuList;
        brandUpdated = true;
      }

      // Updates the Brand name and stores the previous value in history
      if (brand && existingBrand.brand.value !== brand) {
        existingBrand.brand.history.push({
          previousValue: existingBrand.brand.value,
          updatedValue: brand,
          updatedAt: new Date().toISOString(),
          updatedBy: key
        });
        existingBrand.brand.value = brand;
        brandUpdated = true;
      }

      // Updates the Locale and stores the previous value in history
      if (locale && existingBrand.locale.value !== locale) {
        existingBrand.locale.history.push({
          previousValue: existingBrand.locale.value,
          updatedValue: locale,
          updatedAt: new Date().toISOString(),
          updatedBy: key
        });
        existingBrand.locale.value = locale;
        brandUpdated = true;
      }

      // Updates the Locale and stores the previous value in history
      if (newUrl && existingBrand.url.value !== newUrl) {
        existingBrand.url.history.push({
          previousValue: existingBrand.url.value,
          updatedValue: newUrl,
          updatedAt: new Date().toISOString(),
          updatedBy: key
        });
        existingBrand.url.value = newUrl;
        brandUpdated = true;
      }

      res.json({
        status: "ok",
        brand: brandUpdated ? await existingBrand.save() : existingBrand
      });
    } else {
      res.json({
        status: "ok",
        brand: await Brand.create(newBrand)
      });
    }
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
    const existingBrand = await Brand.findOne({ "url.value": url });

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
    const { deletedCount } = await Brand.deleteOne({ "url.value": url });

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
        brands: brands.map(brand => ({
          brand: brand.brand.value,
          locale: brand.locale.value,
          url: brand.url.value
        }))
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

// Path: /api/1/sc/sc-data-product?url=https://herbalessences.com/en-us/&sku=1
// Desc: Fetches the SC data for a single product for single locale in one SKU List
router.get("/sc-data-product", async (req, res, next) => {
  const { url, sku } = req.query;

  // Detect if Vercel app is being used and forward the request to Heroku app
  // Vercel app does not fetch retailer links so Heroku app needs to be used
  if (req.headers["x-vercel-forwarded-for"]) {
    const query = new URLSearchParams(req.query);
    return axios(require("../../config").hostHeroku + "?" + query);
  }

  const brand = await Brand.findOne({ "url.value": url });

  const product = brand.skuList.filter(skuData => skuData.sku.value === sku);

  if (product.length > 1) {
    res.status(422);
    return next({
      message: `Multiple products with SKU ${sku} found.`,
      products: product
    });
  }

  const [buttonData, carouselData] = await Promise.all([
    axios(
      scButtonUrl
        .replace("{{scButtonKey}}", brand.scButtonKey)
        .replace("{{scMpId}}", product[0].scMpId.value)
    ),
    axios(
      scCarouselUrl
        .replace("{{scCarouselKey}}", brand.scCarouselKey)
        .replace("{{scMpId}}", product[0].scMpId.value)
    )
  ]);

  // scCarouselUrl
  res.json({
    brand: brand.brand.value,
    locale: brand.locale.value,
    url: brand.url.value,
    product: product[0].title.value,
    productUrl: product[0].url.value,
    sku: product[0].sku.value,
    scMpId: product[0].scMpId.value,
    scApiId: product[0].scApiId.value,
    buttonData: buttonData.data,
    carouselData: carouselData.data
  });
});

module.exports = router;
