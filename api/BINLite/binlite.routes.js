const axios = require("axios").default;
const router = require("express").Router();

const Locale = require("../locales/locales.model.js");
const Page = require("../pages/pages.model.js");

const { getSellerData } = require("./binlite.helpers.js");
const { BINLiteUrl } = require("./binlite.config.json");

const { calculateLocaleStats } = require("../locales/locales.helpers.js");

const { response } = require("../../lib/helpers.js");

// Path: /api/1/binlite/product-data/single
// Desc: Fetch BIN Lite details for single SKU
router.get("/product-data/single", async (req, res, next) => {
  const { url, id, binliteIdFieldName } = req.query;

  const query = {};

  if (id) query._id = id;
  if (url) query.url = url;

  try {
    let product = await Page.find(query).select(`-__v`);

    if (product.length > 1) {
      res.status(422);
      return next({
        message: "Multiple products found that match the search query.",
        query,
        products: product
      });
    } else if (!product.length) {
      return next({
        message: "No products found that match the search query.",
        query
      });
    }

    const locale = await Locale.findById(product[0].locale).select(
      "BINLite.BINLiteKey.value"
    );

    if (!locale.BINLite?.BINLiteKey?.value) {
      res.status(400);
      return next({
        message: `Locale ${locale.url.value} does not have BIN Lite related data.`
      });
    }

    const { sellersOk, matches, status, message } = await getSellerData(
      product[0].data[binliteIdFieldName].value,
      locale.BINLite.BINLiteKey.value
    );

    const lastScan = new Date().toISOString();

    await Page.updateOne(
      { _id: product[0]._id },
      {
        $set: {
          BINLite: {
            ok: sellersOk,
            lastScan,
            matches
          }
        }
      },
      { upsert: true }
    );

    product[0]._doc.id = product[0]._doc._id;
    delete product[0]._doc._id;
    delete product[0]._doc.locale;

    response(
      res,
      200,
      false,
      {
        sellersOk,
        matchesCount: matches?.length,
        BINLiteAPI: status && { status, message }
      },
      {
        ...product[0]._doc,
        BINLite: {
          ok: sellersOk,
          lastScan,
          matches
        }
      }
    );

    // Update locale stats
    calculateLocaleStats(req.query.url);
  } catch (error) {
    console.warn(
      "Error occurred in GET /api/1/binlite/product-data/single route",
      error
    );
    next({
      message: error.message,
      ...error
    });
  }
});

// Path: /api/1/binlite/product-data?key=1234&url=https://herbalessences.com/en-us/&productUrl=https://&sku=1234
// Desc: Fetches the BIN Lite data for a all products for single locale in one SKU List
router.post("/product-data", async (req, res, next) => {
  const { url, id, binliteIdFieldName } = req.query;

  const productsQuery = { type: "product" };

  if (id) productsQuery.locale = id;
  if (url) productsQuery.localeUrl = url;

  const localeQuery = {};

  if (id) localeQuery._id = id;
  if (url) localeQuery["url.value"] = url;

  try {
    const [products, locale] = await Promise.all([
      Page.find(productsQuery).select(`url data.${binliteIdFieldName}.value`),
      Locale.find(localeQuery).select("BINLite.BINLiteKey.value")
    ]);

    if (!products.length || !locale.length) {
      return next({
        message: "No products or locales found that match the search query.",
        queries: { productsQuery, localeQuery }
      });
    }

    if (!locale[0].BINLite?.BINLiteKey?.value) {
      res.status(400);
      return next({
        message: `Locale ${locale.url.value} does not have BIN Lite related data.`
      });
    }

    const sellerDataQueries = products
      .filter(product => product.data[binliteIdFieldName]?.value !== undefined)
      .map(product =>
        getSellerData(
          product.data[binliteIdFieldName].value,
          locale[0].BINLite.BINLiteKey.value
        )
          .then(result => result)
          .catch(err =>
            console.warn(
              "Error occurred while fetching BIN Lite data for product: ",
              product.url,
              err
            )
          )
      );
    const sellerData = await Promise.all(sellerDataQueries);

    const successAttempts = sellerData.filter(
      ({ sellersOk }) => sellersOk === true
    );
    const failedAttempts = sellerData.filter(
      ({ status }) => status !== undefined
    );

    const bulkWrites = [...successAttempts, ...failedAttempts].map(
      ({ binliteId, sellersOk, matches }) => {
        const filter = `data.${binliteIdFieldName}.value`;

        return {
          updateOne: {
            filter: { [filter]: binliteId },
            update: {
              $set: {
                BINLite: {
                  ok: sellersOk,
                  lastScan: new Date().toISOString(),
                  matches
                }
              }
            },
            upsert: true
          }
        };
      }
    );

    const { nModified } = await Page.bulkWrite(bulkWrites);

    const mapResult = result => {
      const product = products.find(
        product => product.data[binliteIdFieldName]?.value === result.binliteId
      );

      return {
        id: product._doc._id,
        url: product.url,
        [binliteIdFieldName]: product.data[binliteIdFieldName]?.value,
        BINLite: {
          ok: result.sellersOk,
          matchesCount: result.matches?.length,
          matches: result.matches,
          status: result.status,
          message: result.message
        }
      };
    };

    const successPayload = successAttempts.map(mapResult);
    const failsPayload = failedAttempts.map(mapResult);

    response(
      res,
      200,
      false,
      {
        productsCount: products.length,
        updatedProductsCount: nModified,
        successAttemptsCount: successAttempts.length,
        failedAttemptsCount: failedAttempts.length
      },
      [...successPayload, ...failsPayload]
    );

    // Update locale stats
    calculateLocaleStats(req.query.url);
  } catch (error) {
    console.warn("Error occurred in GET /api/1/sc/product-data route", error);
    next({
      message: error.message,
      ...error
    });
  }
});

// Path: /api/1/binlite/retailers
// Desc: Fetch all BIN Lite sellers
router.get("/retailers", async (req, res, next) => {
  const { url, retailerName } = req.query;

  try {
    const locale = await Locale.find({ "url.value": url }).select(
      "BINLite.BINLiteKey.value"
    );

    if (!locale.length) {
      res.status(404);
      return next({
        message: `Locale ${url} not found.`
      });
    }

    if (!locale[0].BINLite?.BINLiteKey?.value) {
      res.status(400);
      return next({
        message: `Locale ${url} does not have BIN Lite related data.`
      });
    }

    let result, status, message;
    try {
      const { data } = await axios(
        BINLiteUrl.replace("{{binliteUpc}}", 1).replace("desired", "all"),
        {
          headers: {
            passkey: locale[0].BINLite.BINLiteKey.value,
            "x-functions-key": process.env.X_FUNCTIONS_KEY,
            "Ocp-Apim-Subscription-Key": process.env.OCP_APIM_SUBSCRIPTION_KEY
          }
        }
      );

      result = data;
    } catch (error) {
      error = error.isAxiosError ? error.toJSON() : error;
      console.warn(
        "Error occurred while fetching BINLite data for single procut, ",
        error
      );
      status = error.status;
      message = error.message;
    }

    // If retailerName is passed, filter it out from the results
    if (retailerName)
      result = result.filter(
        retailer => retailer.RetailerName === retailerName
      );

    response(
      res,
      200,
      false,
      {
        sellersCount: result?.length,
        BINLiteAPI: status && { status, message }
      },
      result
    );
  } catch (error) {
    console.warn("Error occurred in GET /api/1/binlite/retailers route", error);
    next({
      message: error.message,
      ...error
    });
  }
});

module.exports = router;
