const path = require("path");
const router = require("express").Router();
const xlsx = require("xlsx");
const multer = require("multer");
const upload = multer();

const Brand = require("./locale.model.js");

const { readOnly, readWrite } = require("../../middleware/auth.js");

// Path: /api/1/locale/all
// Desc: Fetches all brands and locales
router.get("/brands", readOnly, async (req, res, next) => {
  try {
    const brands = await Brand.find().select("-_id brand locale url");

    if (brands) {
      res.json({
        status: "ok",
        brandsCount: brands.length,
        brands: brands
          .map(brand => ({
            brand: brand.brand.value,
            locale: brand.locale.value,
            url: brand.url.value
          }))
          .sort((first, second) => {
            var A = first.brand.toUpperCase();
            var B = second.brand.toUpperCase();
            if (A < B) {
              return -1;
            }
            if (A > B) {
              return 1;
            }
            return 0;
          })
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

// Path: /api/1/locale/single?key=123456789&brand=Herbal Essences&locale=en-us&url=https://www.herbalessences.com&scButtonKey=12ed8c04-265f-4c6b-838e-bd390431accd&scCarouselKey=1234
// Desc: Uploads pages data in excel spreadsheet
router.post(
  "/single",
  readWrite,
  upload.single("skuList"),
  async (req, res, next) => {
    try {
      const { key, brand, locale, url, newUrl, scButtonKey, scCarouselKey } =
        req.query;
      const buffer = req.file?.buffer;

      const newBrand = {
        createdBy: req.admin ? "admin" : key,
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

        products.sort((first, second) => {
          var A = first.Title.toUpperCase();
          var B = second.Title.toUpperCase();
          if (A < B) {
            return -1;
          }
          if (A > B) {
            return 1;
          }
          return 0;
        });

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

      const mapResult = result => ({
        brand: result._doc.brand.value,
        locale: result._doc.locale.value,
        url: result._doc.url.value,
        createdBy: result._doc.createdBy,
        scButtonKey: result._doc.scButtonKey,
        scCarouselKey: result._doc.scCarouselKey,
        skuList: result._doc.skuList.map(skuItem => ({
          title: skuItem.title.value,
          url: skuItem.url.value,
          sku: skuItem.sku.value,
          scMpId: skuItem.scMpId.value,
          scApiId: skuItem.scApiId.value
        }))
      });

      if (existingBrand) {
        let brandUpdated = false;
        if (existingBrand.skuList.length !== newBrand.skuList.length) {
          // TODO: napravi provjeru ako brend postoji, da se updateaju proizvodi po SKU broju
          existingBrand.skuList = newBrand.skuList;
          brandUpdated = true;
        }

        // Updates the Brand name and stores the previous value in brand.history
        if (brand && existingBrand.brand.value !== brand) {
          existingBrand.brand.history.push({
            previousValue: existingBrand.brand.value,
            updatedValue: brand,
            updatedAt: new Date().toISOString(),
            updatedBy: req.admin ? "admin" : key
          });
          existingBrand.brand.value = brand;
          brandUpdated = true;
        }

        // Updates the Locale and stores the previous value in locale.history
        if (locale && existingBrand.locale.value !== locale) {
          existingBrand.locale.history.push({
            previousValue: existingBrand.locale.value,
            updatedValue: locale,
            updatedAt: new Date().toISOString(),
            updatedBy: req.admin ? "admin" : key
          });
          existingBrand.locale.value = locale;
          brandUpdated = true;
        }

        // Updates the URL and stores the previous value in url.history
        if (newUrl && existingBrand.url.value !== newUrl) {
          existingBrand.url.history.push({
            previousValue: existingBrand.url.value,
            updatedValue: newUrl,
            updatedAt: new Date().toISOString(),
            updatedBy: req.admin ? "admin" : key
          });
          existingBrand.url.value = newUrl;
          brandUpdated = true;
        }

        const result = brandUpdated
          ? await existingBrand.save()
          : existingBrand;

        res.json({
          status: "ok",
          productsCount: result._doc.skuList.length,
          result: mapResult(result)
        });
      } else {
        const result = await Brand.create(newBrand);

        res.json({
          status: "ok",
          productsCount: result._doc.skuList.length,
          result: mapResult(result)
        });
      }
    } catch (error) {
      console.warn("Error occurred in POST /api/1/sc/sku-list route", error);
      next(error);
    }
  }
);

// Path: /api/1/locale/single?key=123456789&url=https://www.herbalessences.com&download=all/noSellers
// Desc: Fetches the pages data for a single locale
router.get("/single", readOnly, async (req, res, next) => {
  const { url, download } = req.query;

  try {
    const existingBrand = await Brand.findOne({ "url.value": url }).select(
      "-_id -__v -skuList._id -skuList.carouselSellers._id"
    );

    if (existingBrand) {
      // TODO: napravi da se može downloadat ili cijela SKU lista kao exelica, ili samo proizvodi bez sellera
      res.json({
        status: "ok",
        result: existingBrand
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

// Path: /api/1/locale/single?key=123456789&url=https://www.herbalessences.com
// Desc: Deletes the locale and related pages list
router.delete("/single", readWrite, async (req, res, next) => {
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

// Path: /api/1/locale/template
// Desc: Downloads the Pages List template
router.get("/template", async (req, res, next) => {
  res.download(
    path.join(__dirname, "../../public/Test Herbal Essences en-us.xlsx")
  );
});

module.exports = router;
