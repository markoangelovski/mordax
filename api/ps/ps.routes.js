const router = require("express").Router();

const Locale = require("../locales/locales.model.js");
const Page = require("../pages/pages.model.js");

const {
  getSellerData,
  createRedirectUrl,
  extractSellerUrl
} = require("./ps.helpers.js");

const { response } = require("../../lib/helpers.js");

const {
  psIntAccountConfig,
  psAccountCidConfig,
  psAccountDataSkusMap,
  psAccountCidResLang,
  psUserLocation,
  psAccountDataSkusCountrySku,
  psAccountDataProductsPid,
  psIntAccountDataFamiliesCountryLocale,
  psPostalMapCountry,
  psIntAccountDataStoresCountryPid,
  psAccountDataStockCountryPid,
  psAccountDataRegionalPricingCountryPid,
  psRedirect
} = require("./ps.interfaces.js");

const { calculateLocaleStats } = require("../locales/locales.helpers.js");
const { makePagesForRes } = require("../pages/pages.helpers.js");

// Path: /api/1/ps/product-data/single?key=1234&url=https://www.ninjamas.co/products/large-and-extra-large-bedwetting-underwear/&psSkuFieldName=psSku&countryCode=US
// Desc: Fetch PS details for single SKU
router.get("/product-data/single", async (req, res, next) => {
  const { url, id, psSkuFieldName, countryCode, psInstance } = req.query;

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
        products: product.map(product => {
          const payload = {
            id: product._doc._id,
            ...product._doc
          };
          delete payload._id;
          return payload;
        })
      });
    } else if (!product.length) {
      res.status(404);
      return next({
        message: "No products found that match the search query.",
        query
      });
    }

    const locale = await Locale.findById(product[0].locale).select(
      "locale.url.value PS.psAccountId.value"
    );

    if (!locale.PS?.psAccountId?.value) {
      res.status(400);
      return next({
        message: `Locale ${locale.url.value} does not have PS related data.`
      });
    }

    const { sellersOk, matches, status, message } = await getSellerData(
      locale.PS.psAccountId.value,
      countryCode,
      psInstance,
      product[0]._id.toString(),
      product[0].data[psSkuFieldName].value
    );

    const lastScan = new Date().toISOString();

    await Page.updateOne(
      { _id: product[0]._id },
      {
        $set: {
          PS: {
            ok: sellersOk,
            lastScan,
            matches
          }
        }
      },
      { upsert: true }
    );

    product[0]._doc.id = product[0]._doc._id;
    delete product[0]._doc.locale;

    response(
      res,
      200,
      false,
      {
        sellersOk,
        matchesCount: matches?.length,
        PSAPI: status && { status, message }
      },
      makePagesForRes({
        ...product[0]._doc,
        PS: {
          ok: sellersOk,
          lastScan,
          matches
        }
      })
    );

    // Update locale stats
    calculateLocaleStats(product[0].localeUrl);
  } catch (error) {
    console.warn(
      "Error occurred in GET /api/1/ps/product-data/single route",
      error
    );
    next({
      message: error.message,
      ...error
    });
  }
});

// Path: /api/1/ps/product-data?key=1234&url=https://herbalessences.com/en-us/&productUrl=https://&sku=1234
// Desc: Fetches the PS data for a all products for single locale in one SKU List
router.post("/product-data", async (req, res, next) => {
  const { url, id, psSkuFieldName, countryCode, psInstance } = req.query;

  const productsQuery = { type: "product" };

  if (id) productsQuery.locale = id;
  if (url) productsQuery.localeUrl = url;

  const localeQuery = {};

  if (id) localeQuery._id = id;
  if (url) localeQuery["url.value"] = url;

  try {
    const [pages, locale] = await Promise.all([
      Page.find(productsQuery).select(`url type data.${psSkuFieldName}.value`),
      Locale.find(localeQuery).select("PS.psAccountId.value")
    ]);

    if (!pages.length || !locale.length) {
      res.status(404);
      return next({
        message: "No pages or locales found that match the search query.",
        queries: { productsQuery, localeQuery }
      });
    }

    if (!locale[0].PS?.psAccountId?.value) {
      res.status(400);
      return next({
        message: `Locale ${locale[0].url.value} does not have PS related data.`
      });
    }

    const sellerDataQueries = pages
      .filter(entry => entry.data[psSkuFieldName]?.value !== undefined)
      .map(entry =>
        getSellerData(
          locale[0].PS.psAccountId.value,
          countryCode,
          psInstance,
          entry._id,
          entry.data[psSkuFieldName].value
        )
          .then(result => result)
          .catch(err =>
            console.warn(
              "Error occurred while fetching PS data for entry: ",
              entry.url,
              err
            )
          )
      );
    const sellerData = await Promise.all(sellerDataQueries);

    const successAttempts = sellerData.filter(
      ({ sellersOk, matches }) => sellersOk === true && matches.length
    );
    const failedAttempts = sellerData.filter(
      ({ status }) => status !== undefined
    );
    const noSellersAttempts = sellerData.filter(
      ({ matches }) => !matches.length
    );

    const bulkWrites = [
      ...successAttempts,
      ...failedAttempts,
      ...noSellersAttempts
    ].map(({ pageId, sellersOk, matches }) => ({
      updateOne: {
        filter: { _id: pageId },
        update: {
          $set: {
            PS: { ok: sellersOk, lastScan: new Date().toISOString(), matches }
          }
        },
        upsert: true
      }
    }));

    const { nModified } = await Page.bulkWrite(bulkWrites);

    const mapResult = result => {
      const entry = pages.find(entry => entry._id === result.pageId);

      return {
        id: entry._id,
        url: entry.url,
        [psSkuFieldName]: entry.data[psSkuFieldName]?.value,
        PS: {
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
    const noSellersPayload = noSellersAttempts.map(mapResult);

    const singleProducts = new Set();
    pages.forEach(entry => singleProducts.add(entry.url));

    response(
      res,
      200,
      false,
      {
        productsCount: singleProducts.size,
        variantsCount: pages.length - singleProducts.size,
        updatedEntriesCount: nModified,
        successAttemptsCount: successAttempts.length,
        failedAttemptsCount: failedAttempts.length,
        noSellersAttemptsCount: noSellersAttempts.length
      },
      [...successPayload, ...failsPayload, ...noSellersPayload]
    );

    // Update locale stats
    calculateLocaleStats(req.query.url);
  } catch (error) {
    console.warn("Error occurred in GET /api/1/ps/product-data route", error);
    next({
      message: error.message,
      ...error
    });
  }
});

// Path: /api/1/ps/seller-links?key=1234&url=https://herbalessences.com/en-us/
// Desc: Fetches the seller links for products that already have PS matches
router.post("/seller-links", async (req, res, next) => {
  const { url } = req.query;

  try {
    let [locale, pages] = await Promise.all([
      Locale.find({ "url.value": url }).select("PS.psCid.value"),
      Page.find({
        localeUrl: url,
        "PS.lastScan": { $exists: true }
      }).select("url PS")
    ]);

    if (!locale.length || !pages.length) {
      res.status(404);
      return next({
        message: "Requested locale or pages do not have required PS data."
      });
    }

    const sellerLinkRequests = pages
      .map(page =>
        page.PS.matches.map(match =>
          createRedirectUrl(
            locale[0].PS.psCid.value,
            "",
            match.pmid,
            match.price,
            "",
            ""
          )
        )
      )
      .flat()
      .map(redirectUrl => extractSellerUrl(redirectUrl));
    const sellerLinks = await Promise.all(sellerLinkRequests);

    const pmids = pages
      .map(page => page.PS.matches.map(match => match.pmid))
      .flat();

    pages = pages.map(page => ({
      ...page._doc,
      PS: {
        ...page.PS,
        matches: page.PS.matches.map(match => {
          const i = pmids.findIndex(pmid => pmid === match.pmid);
          return {
            ...match._doc,
            sellerLink: sellerLinks[i]
          };
        })
      }
    }));

    const bulkWrites = pages.map(page => ({
      updateOne: {
        filter: { _id: page._id },
        update: {
          $set: {
            "PS.matches": page.PS.matches
          }
        }
      }
    }));

    const { nModified } = await Page.bulkWrite(bulkWrites);

    response(
      res,
      200,
      false,
      {
        updatedEntriesCount: nModified
      },
      [
        ...pages.map(page => ({
          id: page._id,
          url: page.url,
          PS: {
            ...page.PS,
            matches: page.PS.matches.map(match => ({
              pmid: match.pmid,
              sid: match.sid,
              retailerName: match.retailerName,
              price: match.price,
              sellerLink: match.sellerLink
            }))
          }
        }))
      ]
    );
  } catch (error) {
    console.warn("Error occurred in GET /api/1/ps/seller-links route", error);
    next({
      message: error.message,
      ...error
    });
  }
});

/**
 * PS interface endpoints
 */

// Path: /api/1/ps/int/1/:accountId/config.js
// Desc: Interface to
// https://cdn.pricespider.com/1/:accountId/config.js
router.get("/int/1/:accountId/config.js", async (req, res, next) => {
  const int = await psIntAccountConfig(req);

  if (int.error) {
    res.status(int.status);
    return next(int.error);
  }

  response(res, 200, false, {}, int.result);
});

// // https://cdn.pricespider.com/1/:accountId/:cid/config.js
router.get("/int/1/:accountId/:cid/config.js", async (req, res, next) => {
  const int = await psAccountCidConfig(req);

  if (int.error) {
    res.status(int.status);
    return next(int.error);
  }

  response(res, 200, false, {}, int.result);
});

// https://cdn.pricespider.com/1/:accountId/data/skus/map.js DO NOT CREATE FRONTEND FOR THIS OR ADD IN DOCS!!! Response is over 1MB
router.get("/int/1/:accountId/data/skus/map.js", async (req, res, next) => {
  const int = await psAccountDataSkusMap(req);

  if (int.error) {
    res.status(int.status);
    return next(int.error);
  }

  response(res, 200, false, {}, int.result);
});

// https://cdn.pricespider.com/1/:accountId/:cid/res/:lang.js
router.get("/int/1/:accountId/:cid/res/:lang.js", async (req, res, next) => {
  const int = await psAccountCidResLang(req);

  if (int.error) {
    res.status(int.status);
    return next(int.error);
  }

  response(res, 200, false, {}, int.result);
});

// https://locate.pricespider.com/?ip=0&callback=PriceSpider.jsonp&_={{$timestamp}}
router.get("/int/locate", async (req, res, next) => {
  const int = await psUserLocation(req);

  if (int.error) {
    res.status(int.status);
    return next(int.error);
  }

  response(res, 200, false, {}, int.result);
});

// https://cdn.pricespider.com/1/:accountId/data/skus/:countryCode/:sku.js
router.get(
  "/int/1/:accountId/data/skus/:countryCode/:sku.js",
  async (req, res, next) => {
    const int = await psAccountDataSkusCountrySku(req);

    if (int.error) {
      res.status(int.status);
      return next(int.error);
    }

    response(res, 200, false, {}, int.result);
  }
);

// https://cdn.pricespider.com/1/:accountId/data/products/:pid.js
router.get(
  "/int/1/:accountId/data/products/:pid.js",
  async (req, res, next) => {
    const int = await psAccountDataProductsPid(req);

    if (int.error) {
      res.status(int.status);
      return next(int.error);
    }

    response(res, 200, false, {}, int.result);
  }
);

// https://cdn.pricespider.com/1/:accountId/data/families/:countryCode/:locale.js
router.get(
  "/int/1/:accountId/data/families/:countryCode/:locale.js",
  async (req, res, next) => {
    const int = await psIntAccountDataFamiliesCountryLocale(req);

    if (int.error) {
      res.status(int.status);
      return next(int.error);
    }

    response(res, 200, false, {}, int.result);
  }
);

// https://cdn.pricespider.com/1/postal-map/:countryCode.js
router.get("/int/1/postal-map/:countryCode.js", async (req, res, next) => {
  const int = await psPostalMapCountry(req);

  if (int.error) {
    res.status(int.status);
    return next(int.error);
  }

  response(res, 200, false, {}, int.result);
});

// https://cdn.pricespider.com/1/:accountId/data/stores/:countryCode/:areaCode/:pid.js
router.get(
  "/int/1/:accountId/data/stores/:countryCode/(:areaCode/)?:pid.js",
  async (req, res, next) => {
    const int = await psIntAccountDataStoresCountryPid(req);

    if (int.error) {
      res.status(int.status);
      return next(int.error);
    }

    response(res, 200, false, {}, int.result);
  }
);

// https://cdn.pricespider.com/1/:accountId/data/stock/:countryCode/:areaCode/:pid.js
router.get(
  "/int/1/:accountId/data/stock/:countryCode/(:areaCode/)?:pid.js",
  async (req, res, next) => {
    const int = await psAccountDataStockCountryPid(req);

    if (int.error) {
      res.status(int.status);
      return next(int.error);
    }

    response(res, 200, false, {}, int.result);
  }
);

// https://cdn.pricespider.com/1/:accountId/data/regionalPricing/:countryCode/:areaCode/:pid.js
router.get(
  "/int/1/:accountId/data/regionalPricing/:countryCode/(:areaCode/)?:pid.js",
  async (req, res, next) => {
    const int = await psAccountDataRegionalPricingCountryPid(req);

    if (int.error) {
      res.status(int.status);
      return next(int.error);
    }

    response(res, 200, false, {}, int.result);
  }
);

// https://redir.pricespider.com/redirect/?cid=5eeceefdab088c00340ef470&iid=f81a76a8-3d9c-46c6-aca7-efd8adee2a49&v=2.4.15&pmid=126222899&price=26.99&stockStatus=1&widgetType=lightbox&t=7500&postalCode=52220&n=0&_=1640662557019
router.get("/int/redirect", async (req, res, next) => {
  const int = await psRedirect(req);

  if (int.error) {
    res.status(int.status);
    return next(int.error);
  }

  response(res, 200, false, {}, int.result);
});

module.exports = router;
