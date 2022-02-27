const router = require("express").Router();

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

/**
 * PS interface endpoints
 */

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
