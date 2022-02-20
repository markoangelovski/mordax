const axios = require("axios").default;
const router = require("express").Router();

const { getSellerData } = require("./binlite.helpers.js");

const { response } = require("../../lib/helpers.js");

const { BINLiteUrl } = require("../../config");

const Locale = require("../locales/locales.model.js");
const Page = require("../pages/pages.model.js");

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

    await Page.updateOne(
      { _id: product[0]._id },
      {
        $set: {
          BINLite: {
            ok: sellersOk,
            lastScan: new Date().toISOString(),
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
          matches
        }
      }
    );
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
      Page.find(productsQuery).select(`data.${binliteIdFieldName}.value`),
      Locale.find(localeQuery).select("BINLite.BINLiteKey.value")
    ]);

    if (!products.length || !locale.length) {
      return next({
        message: "No products or locales found that match the search query.",
        queries: { productsQuery, localeQuery }
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
              "Error occurred while fetching SC data for product: ",
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
      ({ binliteId, sellersOk, matches }, i) => {
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
  const { url } = req.query;

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

    let BINLiteResult, status, message;
    try {
      const result = await axios(
        BINLiteUrl.replace("{{binliteUpc}}", 1).replace("desired", "all"),
        {
          headers: {
            passkey: locale[0].BINLite.BINLiteKey.value,
            "x-functions-key": process.env.X_FUNCTIONS_KEY,
            "Ocp-Apim-Subscription-Key": process.env.OCP_APIM_SUBSCRIPTION_KEY
          }
        }
      );

      BINLiteResult = result.data;
    } catch (error) {
      error = error.isAxiosError ? error.toJSON() : error;
      console.warn(
        "Error occurred while fetching BINLite data for single procut, ",
        error
      );
      status = error.status;
      message = error.message;
    }

    response(
      res,
      200,
      false,
      {
        sellersCount: BINLiteResult?.length,
        BINLiteAPI: status && { status, message }
      },
      BINLiteResult
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
