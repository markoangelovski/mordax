const router = require("express").Router();
const axios = require("axios");

const Page = require("../pages/pages.model.js");
const Locale = require("../locales/locales.model.js");

const { getSellerData } = require("./sc.helpers.js");

const { scButtonUrl, scCarouselUrl } = require("../../config");

const { response } = require("../../lib/helpers.js");

// Path: /api/1/sc/product-data?key=1234&url=https://herbalessences.com/en-us/&productUrl=https://&sku=1234
// Desc: Fetches the Button SC data for a single product for single locale in one SKU List
router.get("/product-data", async (req, res, next) => {
  const { url, id, SKU, mpIdFieldName } = req.query;

  const query = {};

  if (id) query._id = id;
  if (url) query.url = url;
  if (SKU) query["data.SKU.value"] = SKU;

  try {
    let product = await Page.find(query).select(`-_id -__v`);

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
      "SC.scCarouselKey.value"
    );

    const { sellersOk, matches } = await getSellerData(
      locale.SC.scCarouselKey.value,
      product[0].data[mpIdFieldName].value
    );

    const payload = {
      SC: {
        ok: sellersOk,
        matches
      }
    };
    // TODO: ovdje ne sprema sellere u bazu
    const result = await Page.updateOne(
      { _id: product[0]._id },
      {
        $set: {
          "SC.ok": sellersOk,
          "SC.matches": matches
        }
      },
      { upsert: true }
    );
    console.log("result: ", result);
    response(
      res,
      200,
      false,
      { sellersOk, matchesCount: matches.length },
      {
        ...product[0]._doc,
        SC: {
          ok: sellersOk,
          matches
        }
      }
    );
  } catch (error) {
    console.warn("Error occurred in GET /api/1/sc/product-data route", error);
    next({
      message: error.message,
      ...error
    });
  }
});

// Path: /api/1/sc/button?url=https://herbalessences.com/en-us/&sku=1
// Desc: Fetches the Button SC data for a single product for single locale in one SKU List
router.get("/button", async (req, res, next) => {
  const { url, id, SKU, mpIdFieldName } = req.query;

  const query = {};

  if (id) query._id = id;
  if (url) query.url = url;
  if (SKU) query["data.SKU.value"] = SKU;

  try {
    const product = await Page.find(query).select(
      `locale url data.${mpIdFieldName}`
    );

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
      "SC.scButtonKey.value"
    );

    const { data } = await axios(
      scButtonUrl
        .replace("{{scButtonKey}}", locale.SC.scButtonKey.value)
        .replace("{{scMpId}}", product[0].data[mpIdFieldName].value)
    );

    response(
      res,
      200,
      false,
      {},
      {
        id: product[0]._id,
        url: product[0].url,
        data
      }
    );
  } catch (error) {
    console.warn("Error occurred in GET /api/1/sc/button route", error);
    next({
      message: error.message,
      ...error
    });
  }
});

// Path: /api/1/sc/carousel?url=https://herbalessences.com/en-us/&sku=1&key=1234355
// Desc: Fetches the Carousel SC data for a single product for single locale in one SKU List
router.get("/carousel", async (req, res, next) => {
  const { url, id, SKU, mpIdFieldName } = req.query;

  const query = {};

  if (id) query._id = id;
  if (url) query.url = url;
  if (SKU) query["data.SKU.value"] = SKU;

  try {
    const product = await Page.find(query).select(
      `locale url data.${mpIdFieldName}`
    );

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
      "SC.scCarouselKey.value"
    );

    const { data } = await axios(
      scCarouselUrl
        .replace("{{scCarouselKey}}", locale.SC.scCarouselKey.value)
        .replace("{{scMpId}}", product[0].data[mpIdFieldName].value)
    );

    response(
      res,
      200,
      false,
      {},
      {
        id: product[0]._id,
        url: product[0].url,
        data
      }
    );
  } catch (error) {
    console.warn("Error occurred in GET /api/1/sc/carousel route", error);
    next({
      message: error.message,
      ...error
    });
  }
});

// Path: /api/1/sc/retailers?url=https://herbalessences.com/en-us/&sku=1&key=1234355
// Desc: Fetches the configured retailers
router.get("/retailers", async (req, res, next) => {
  const { url, id, SKU, mpIdFieldName } = req.query;

  const query = {};

  if (id) query._id = id;
  if (url) query.url = url;
  if (SKU) query["data.SKU.value"] = SKU;

  try {
    let product = await Page.find(query).select(`-_id -__v`);

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
      "SC.scCarouselKey.value"
    );

    const { sellersInfo } = await getSellerData(
      locale.SC.scCarouselKey.value,
      product[0].data[mpIdFieldName].value
    );

    response(
      res,
      200,
      false,
      { sellersCount: sellersInfo.length },
      sellersInfo
    );
  } catch (error) {
    console.warn("Error occurred in GET /api/1/sc/product-data route", error);
    next({
      message: error.message,
      ...error
    });
  }
});

module.exports = router;
