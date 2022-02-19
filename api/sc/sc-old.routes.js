const router = require("express").Router();
const axios = require("axios");

const Locale = require("../locale/locale.model.js");

const { scButtonUrl, scCarouselUrl } = require("../../config");
const { readOnly, readWrite } = require("../../middleware/auth.js");

// Path: /api/1/sc/product
// Desc: Uploads a single product
router.post("/product", readWrite, async (req, res, next) => {
  const { key, url, productTitle, productUrl, sku, scMpId, scApiId } =
    req.query;

  try {
    const locale = await Locale.findOne({
      "url.value": url
    });

    if (!locale) {
      res.status(404);
      next({
        message: `URL ${url} not found.`
      });
    }

    const productExists = locale.skuList.findIndex(
      product => product.sku.value === sku
    );

    if (locale && productExists === -1) {
      const product = {
        title: {
          value: productTitle,
          createdAt: new Date().toISOString(),
          history: [
            {
              previousValue: "{{New product}}",
              updatedValue: productTitle,
              updatedAt: new Date().toISOString(),
              updatedBy: req.admin ? "admin" : key
            }
          ]
        },
        url: {
          value: productUrl,
          createdAt: new Date().toISOString(),
          history: [
            {
              previousValue: "{{New product}}",
              updatedValue: productUrl,
              updatedAt: new Date().toISOString(),
              updatedBy: req.admin ? "admin" : key
            }
          ]
        },
        sku: {
          value: sku,
          createdAt: new Date().toISOString(),
          history: [
            {
              previousValue: "{{New product}}",
              updatedValue: sku,
              updatedAt: new Date().toISOString(),
              updatedBy: req.admin ? "admin" : key
            }
          ]
        },
        scMpId: {
          value: scMpId,
          createdAt: new Date().toISOString(),
          history: [
            {
              previousValue: "{{New product}}",
              updatedValue: scMpId,
              updatedAt: new Date().toISOString(),
              updatedBy: req.admin ? "admin" : key
            }
          ]
        },
        scApiId: {
          value: scApiId,
          createdAt: new Date().toISOString(),
          history: [
            {
              previousValue: "{{New product}}",
              updatedValue: scApiId,
              updatedAt: new Date().toISOString(),
              updatedBy: req.admin ? "admin" : key
            }
          ]
        }
      };

      brand.skuList.push(product);
      brand.skuList.sort((first, second) => {
        var A = first.title.value.toUpperCase();
        var B = second.title.value.toUpperCase();
        if (A < B) {
          return -1;
        }
        if (A > B) {
          return 1;
        }
        return 0;
      });

      await brand.save();

      res.json({
        status: "ok",
        result: product
      });
    } else {
      res.status(422);
      next({
        message: `SKU ${sku} already exists.`
      });
    }
  } catch (error) {
    console.warn("Error occurred in GET /api/1/sc/product route", error);
    next(error);
  }
});

// Path: /api/1/sc/product
// Desc: Updates a single product
router.patch("/product", readWrite, async (req, res, next) => {
  const { key, url, productTitle, productUrl, sku, newSku, scMpId, scApiId } =
    req.query;

  try {
    const existingProduct = await Locale.findOne({
      "url.value": url,
      "skuList.sku.value": sku
    });

    if (existingProduct) {
      let product;

      existingProduct.skuList.map(skuItem => {
        if (skuItem.sku.value === sku) {
          // Updates the Product title and stores the previous value in title.history
          if (productTitle && skuItem.title.value !== productTitle) {
            skuItem.title.history.push({
              previousValue: skuItem.title.value || "{{empty parameter}}",
              updatedValue: productTitle,
              updatedAt: new Date().toISOString(),
              updatedBy: req.admin ? "admin" : key
            });
            skuItem.title.value = productTitle;
          }

          // Updates the Product url and stores the previous value in url.history
          if (productUrl && skuItem.url.value !== productUrl) {
            skuItem.url.history.push({
              previousValue: skuItem.url.value || "{{empty parameter}}",
              updatedValue: productUrl,
              updatedAt: new Date().toISOString(),
              updatedBy: req.admin ? "admin" : key
            });
            skuItem.url.value = productUrl;
          }

          // Updates the SKU and stores the previous value in url.history
          if (newSku && skuItem.sku.value !== newSku) {
            skuItem.sku.history.push({
              previousValue: skuItem.sku.value || "{{empty parameter}}",
              updatedValue: newSku,
              updatedAt: new Date().toISOString(),
              updatedBy: req.admin ? "admin" : key
            });
            skuItem.sku.value = newSku;
          }

          // Updates the scMpId and stores the previous value in url.history
          if (scMpId && skuItem.scMpId.value !== scMpId) {
            skuItem.scMpId.history.push({
              previousValue: skuItem.scMpId.value || "{{empty parameter}}",
              updatedValue: scMpId,
              updatedAt: new Date().toISOString(),
              updatedBy: req.admin ? "admin" : key
            });
            skuItem.scMpId.value = scMpId;
          }

          // Updates the scApiId and stores the previous value in url.history
          if (scApiId && skuItem.scApiId.value !== scApiId) {
            skuItem.scApiId.history.push({
              previousValue: skuItem.scApiId.value || "{{empty parameter}}",
              updatedValue: scApiId,
              updatedAt: new Date().toISOString(),
              updatedBy: req.admin ? "admin" : key
            });
            skuItem.scApiId.value = scApiId;
          }

          product = skuItem;
        }
      });

      await existingProduct.save();

      res.json({
        status: "ok",
        result: {
          title: {
            ...product.title,
            history: product.title.history.map(item => ({
              previousValue: item.previousValue,
              updatedValue: item.updatedValue,
              updatedAt: item.updatedAt,
              updatedBy: item.updatedBy
            }))
          },
          url: {
            ...product.url,
            history: product.url.history.map(item => ({
              previousValue: item.previousValue,
              updatedValue: item.updatedValue,
              updatedAt: item.updatedAt,
              updatedBy: item.updatedBy
            }))
          },
          sku: {
            ...product.sku,
            history: product.sku.history.map(item => ({
              previousValue: item.previousValue,
              updatedValue: item.updatedValue,
              updatedAt: item.updatedAt,
              updatedBy: item.updatedBy
            }))
          },
          scMpId: {
            ...product.scMpId,
            history: product.scMpId.history.map(item => ({
              previousValue: item.previousValue,
              updatedValue: item.updatedValue,
              updatedAt: item.updatedAt,
              updatedBy: item.updatedBy
            }))
          },
          scApiId: {
            ...product.scApiId,
            history: product.scApiId.history.map(item => ({
              previousValue: item.previousValue,
              updatedValue: item.updatedValue,
              updatedAt: item.updatedAt,
              updatedBy: item.updatedBy
            }))
          }
        }
      });
    } else {
      res.status(404);
      next({
        message: `SKU ${sku} not found.`
      });
    }
  } catch (error) {
    console.warn("Error occurred in GET /api/1/sc/product route", error);
    next(error);
  }
});

// Path: /api/1/sc/product
// Desc: Deletes a single product
router.delete("/product", readWrite, async (req, res, next) => {
  const { url, sku } = req.query;
  try {
    // TODO: promijeni sve "brand" u "locale"
    const existingBrand = await Locale.updateOne(
      { "url.value": url, "skuList.sku.value": sku },
      { $pull: { skuList: { "sku.value": sku } } }
    );

    if (existingBrand.modifiedCount > 0) {
      res.json({
        status: "ok",
        message: `SKU ${sku} deleted successfully.`
      });
    } else {
      res.status(404);
      next({
        message: `Locale ${url} or SKU ${sku} not found.`
      });
    }
  } catch (error) {
    console.warn("Error occurred in GET /api/1/sc/product route", error);
    next(error);
  }
});

// Path: /api/1/sc/brands
// Desc: Fetches all brands and locales
// router.get("/brands", readOnly, async (req, res, next) => {
//   try {
//     const brands = await Brand.find().select("-_id brand locale url");

//     if (brands) {
//       res.json({
//         status: "ok",
//         brandsCount: brands.length,
//         brands: brands
//           .map(brand => ({
//             brand: brand.brand.value,
//             locale: brand.locale.value,
//             url: brand.url.value
//           }))
//           .sort((first, second) => {
//             var A = first.brand.toUpperCase();
//             var B = second.brand.toUpperCase();
//             if (A < B) {
//               return -1;
//             }
//             if (A > B) {
//               return 1;
//             }
//             return 0;
//           })
//       });
//     } else {
//       res.status(404);
//       next({
//         message: `No brands found.`
//       });
//     }
//   } catch (error) {
//     console.warn("Error occurred in GET /api/1/sc/brands route", error);
//     next(error);
//   }
// });

// Path: /api/1/sc/sc-data
// Desc: Fetches the SC data for all products for single locale in one SKU List
router.get("/sc-data", readOnly, (req, res, next) => {
  res.json({
    description:
      "Fetches the SC data for all products for single locale in one SKU List",
    path: req.originalUrl
  });
});

// Path: /api/1/sc/sc-data-product?url=https://herbalessences.com/en-us/&sku=1
// Desc: Fetches the SC data for a single product for single locale in one SKU List
router.post("/sc-data-product", readOnly, async (req, res, next) => {
  // Detect if Vercel app is being used and forward the request to Heroku app
  // Vercel app does not fetch retailer links so Heroku app needs to be used
  if (req.headers["x-vercel-forwarded-for"])
    return axios(require("../../config").hostHeroku + req.originalUrl)
      .then(response => res.json(response.data))
      .catch(err => next(err));

  const { url, sku } = req.query;

  try {
    let brand = await Brand.findOne({ "url.value": url });

    const selectedProductArr = brand.skuList.filter(
      skuData => skuData.sku.value === sku
    );

    if (selectedProductArr.length > 1) {
      res.status(422);
      return next({
        message: `Multiple products with SKU ${sku} found.`,
        products: product
      });
    } else if (selectedProductArr.length === 0) {
      res.status(404);
      return next({
        message: `SKU ${sku} not found.`
      });
    }

    let carouselData,
      carouselSellersOk = false;

    try {
      carouselData = await axios(
        scCarouselUrl
          .replace("{{scCarouselKey}}", brand.scCarouselKey)
          .replace("{{scMpId}}", selectedProductArr[0].scMpId.value)
      );
      carouselSellersOk = true;
    } catch (error) {
      console.warn("Error occurred fetching SC Carousel data for SKU: ", sku);
      console.warn(error.message);
    }

    const carouselSellers = carouselData
      ? carouselData.data.included["product-retailers"].map(retailer => ({
          retailerName: retailer.attributes["action-attributes"].filter(
            item => {
              if (item.attribute === "data-action-retailer") {
                return item;
              }
            }
          )[0].values[0],
          productName: retailer.attributes.name,
          url: retailer.attributes.link,
          price: retailer.attributes["price-string"]
        }))
      : [];

    await Brand.updateOne(
      { "url.value": url, "skuList.sku.value": sku },
      {
        $set: {
          "skuList.$.carouselSellersOk": carouselSellersOk,
          "skuList.$.carouselSellers": carouselSellers
        }
      }
    );

    res.json({
      brand: brand.brand.value,
      locale: brand.locale.value,
      url: brand.url.value,
      productName: selectedProductArr[0].title.value,
      productUrl: selectedProductArr[0].url.value,
      sku: selectedProductArr[0].sku.value,
      scMpId: selectedProductArr[0].scMpId.value,
      scApiId: selectedProductArr[0].scApiId.value,
      carouselSellersOk,
      carouselSellers
    });
  } catch (error) {
    console.warn(
      "Error occurred in GET /api/1/sc/sc-data-product route",
      error
    );
    next(error);
  }
});

// Path: /api/1/sc/sc-data-button?url=https://herbalessences.com/en-us/&sku=1
// Desc: Fetches the Button SC data for a single product for single locale in one SKU List
router.get("/sc-data-button", readOnly, async (req, res, next) => {
  // Detect if Vercel app is being used and forward the request to Heroku app
  // Vercel app does not fetch retailer links so Heroku app needs to be used
  if (req.headers["x-vercel-forwarded-for"])
    return axios(require("../../config").hostHeroku + req.originalUrl)
      .then(response => res.json(response.data))
      .catch(err => next(err));

  const { url, sku } = req.query;

  const brand = await Brand.findOne({ "url.value": url });

  const product = brand.skuList.filter(skuData => skuData.sku.value === sku);

  if (product.length > 1) {
    res.status(422);
    return next({
      message: `Multiple products with SKU ${sku} found.`,
      products: product
    });
  }

  const buttonData = await axios(
    scButtonUrl
      .replace("{{scButtonKey}}", brand.scButtonKey)
      .replace("{{scMpId}}", product[0].scMpId.value)
  );

  res.json({
    brand: brand.brand.value,
    locale: brand.locale.value,
    url: brand.url.value,
    product: product[0].title.value,
    productUrl: product[0].url.value,
    sku: product[0].sku.value,
    scMpId: product[0].scMpId.value,
    scApiId: product[0].scApiId.value,
    buttonData: buttonData.data
  });
});

// Path: /api/1/sc/sc-data-carousel?url=https://herbalessences.com/en-us/&sku=1&key=1234355
// Desc: Fetches the Carousel SC data for a single product for single locale in one SKU List
router.get("/sc-data-carousel", readOnly, async (req, res, next) => {
  // Detect if Vercel app is being used and forward the request to Heroku app
  // Vercel app does not fetch retailer links so Heroku app needs to be used
  if (req.headers["x-vercel-forwarded-for"])
    return axios(require("../../config").hostHeroku + req.originalUrl)
      .then(response => res.json(response.data))
      .catch(err => next(err));

  const { url, sku } = req.query;

  const brand = await Brand.findOne({ "url.value": url });

  const product = brand.skuList.filter(skuData => skuData.sku.value === sku);

  if (product.length > 1) {
    res.status(422);
    return next({
      message: `Multiple products with SKU ${sku} found.`,
      products: product
    });
  }

  const carouselData = await axios(
    scCarouselUrl
      .replace("{{scCarouselKey}}", brand.scCarouselKey)
      .replace("{{scMpId}}", product[0].scMpId.value)
  );

  res.json({
    brand: brand.brand.value,
    locale: brand.locale.value,
    url: brand.url.value,
    product: product[0].title.value,
    productUrl: product[0].url.value,
    sku: product[0].sku.value,
    scMpId: product[0].scMpId.value,
    scApiId: product[0].scApiId.value,
    carouselData: carouselData.data
  });
});

module.exports = router;
