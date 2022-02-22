const router = require("express").Router();

const { response } = require("../../lib/helpers.js");
/**
 * PS interface endpoints
 */

const { psIntAccountConfig } = require("./ps.interfaces.js");

// Path: /api/1/ps/1/:accountId/config.js
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
// router.get("/1/:accountId/:cid/config.js", psAccountCidConfig);

// // https://cdn.pricespider.com/1/:accountId/data/skus/map.js DO NOT CREATE FRONTEND FOR THIS OR ADD IN DOCS!!! Response is over 1MB
// router.get("/1/:accountId/data/skus/map.js", psAccountDataSkusMap);

// // https://cdn.pricespider.com/1/:accountId/:cid/res/:lang.js
// router.get("/1/:accountId/:cid/res/:lang.js", psAccountCidResLang);

// // https://locate.pricespider.com/?ip=0&callback=PriceSpider.jsonp&_={{$timestamp}}
// router.get("/locate", psUserLocation);

// // https://cdn.pricespider.com/1/:accountId/data/skus/:countryCode/:sku.js
// router.get(
//   "/1/:accountId/data/skus/:countryCode/:sku.js",
//   psAccountDataSkusCountrySku
// );

// // https://cdn.pricespider.com/1/:accountId/data/products/:pid.js
// router.get("/1/:accountId/data/products/:pid.js", psAccountDataProductsPid);

// // https://cdn.pricespider.com/1/:accountId/data/families/:countryCode/:locale.js
// router.get(
//   "/1/:accountId/data/families/:countryCode/:locale.js",
//   psAccountDataFamiliesCountryLocale
// );

// // https://cdn.pricespider.com/1/postal-map/:countryCode.js
// router.get("/1/postal-map/:countryCode.js", psPostalMapCountry);

// // https://cdn.pricespider.com/1/:accountId/data/stores/:countryCode/:areaCode/:pid.js
// router.get(
//   "/1/:accountId/data/stores/:countryCode/(:areaCode/)?:pid.js",
//   psAccountDataStoresCountryPid
// );

// // https://cdn.pricespider.com/1/:accountId/data/stock/:countryCode/:areaCode/:pid.js
// router.get(
//   "/1/:accountId/data/stock/:countryCode/(:areaCode/)?:pid.js",
//   psAccountDataStockCountryPid
// );

// // https://cdn.pricespider.com/1/:accountId/data/regionalPricing/:countryCode/:areaCode/:pid.js
// router.get(
//   "/1/:accountId/data/regionalPricing/:countryCode/(:areaCode/)?:pid.js",
//   psAccountDataRegionalPricingCountryPid
// );

// // https://redir.pricespider.com/redirect/?cid=5eeceefdab088c00340ef470&iid=f81a76a8-3d9c-46c6-aca7-efd8adee2a49&v=2.4.15&pmid=126222899&price=26.99&stockStatus=1&widgetType=lightbox&t=7500&postalCode=52220&n=0&_=1640662557019
// router.get("/redirect", psRedirect);

module.exports = router;
