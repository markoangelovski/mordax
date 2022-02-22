// @ts-check
const path = require("path");
const fs = require("fs");
const { Request, Response, NextFunction } = require("express");

const {
  getAccountConfig,
  getAccountCidConfig,
  getAccountDataSkusMap,
  getAccountCidResLang,
  getUserLocation,
  getAccountDataSkusCountrySku,
  getAccountDataProductsPid,
  getPostalMapCountry,
  getAccountDataStoresCountryPid,
  getAccountDataStockCountryPid,
  getAccountDataRegionalPricingCountryPid,
  getAccountDataFamiliesCountryLocale
} = require("./ps.drivers.js");

const {
  errMsg,
  validateRedirectUrlParams,
  createRedirectUrl,
  extractSellerUrl
} = require("./ps.helpers.js");

const { errMsgs, countryCodes, langCodes } = require("./ps.config.json");

const { numbersOnlyRgx, mongoIdRgx } = require("../../lib/regex.js");

/**
 * @typedef { import("./ps.interfaces.types").ExtendedReq } ExtendedReq
 */

/**
 * Object containing the error status code, error and result of fetching the data from PS
 * @typedef {Object} Result
 * @property {number} [status] - Status code if error is validation error
 * @property {object} [error] - Error
 * @property {object} [result] - Data from PS
 */

/**
 * Fetches data from endpoint: /api/1/:accountId/config.js?key=apikey
 * @param {Request} req
 * @returns {Promise<Result>} Data from PS or error object
 */
exports.psIntAccountConfig = async req => {
  const { accountId } = req.params;

  const isAccountIdOk = numbersOnlyRgx.test(accountId);

  if (!isAccountIdOk) {
    errMsg.add("accountId", accountId, errMsgs.malAccountId);

    /**
     * @type {Result}
     */
    return {
      status: 422,
      error: errMsg.create()
    };
  }

  try {
    const result = await getAccountConfig(accountId);
    /**
     * @type {Result}
     */
    return { result };
  } catch (error) {
    error = error.isAxiosError ? error.toJSON() : error;
    console.warn(
      errMsgs.catchEndpointErrMsg.replace(
        "{{endpointName}}",
        "psAccountConfig"
      ),
      error
    );
    /**
     * @type {Result}
     */
    return { status: error.status || error.config.status, error };
  }
};

/**
 * Endpoint: /api/1/:accountId/:cid/config.js?key=apikey
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns {Promise<void>} Fetches all Locales config
 */
exports.psAccountCidConfig = async (req, res, next) => {
  const { accountId, cid } = req.params;

  const isAccountIdOk = numbersOnlyRgx.test(accountId);

  const isCidOk = mongoIdRgx.test(cid);

  if (!isAccountIdOk || !isCidOk) {
    if (!isAccountIdOk)
      errMsg.add("accountId", accountId, errMsgs.malAccountId);
    if (!isCidOk) errMsg.add("cid", cid, errMsgs.malCid);

    res.status(422);
    next({
      message: errMsgs.generalApiErrMsg,
      errors: await errMsg.create()
    });
    return;
  }

  try {
    const result = await getAccountCidConfig(accountId, cid);
    res.json(result);
  } catch (error) {
    console.warn(
      errMsgs.catchEndpointErrMsg.replace(
        "{{endpointName}}",
        "psAccountCidConfig"
      ),
      error.isAxiosError ? error.toJSON() : error
    );
    next(error);
  }
};

/**
 * Endpoint: /api/1/:accountId/data/skus/map.js?key=apikey DO NOT CREATE FRONTEND FOR THIS OR DOCUMENT IT!!!
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns {Promise<void>} Fetches SKU to Product ID mapping for all PG Brands
 */
exports.psAccountDataSkusMap = async (req, res, next) => {
  const { accountId } = req.params;

  const isAccountIdOk = numbersOnlyRgx.test(accountId);

  if (!isAccountIdOk) {
    errMsg.add("accountId", accountId, errMsgs.malAccountId);

    res.status(422);
    next({
      message: errMsgs.generalApiErrMsg,
      errors: await errMsg.create()
    });
    return;
  }

  try {
    const result = await getAccountDataSkusMap(accountId);
    res.json(result);
  } catch (error) {
    console.warn(
      errMsgs.catchEndpointErrMsg.replace(
        "{{endpointName}}",
        "psAccountDataSkusMap"
      ),
      error.isAxiosError ? error.toJSON() : error
    );
    next(error);
  }
};

/**
 * Endpoint: /api/1/:accountId/:cid/res/:lang.js?key=apikey
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns {Promise<void>} Fetches all labels for the passed language
 */
exports.psAccountCidResLang = async (req, res, next) => {
  const { accountId, cid, lang } = req.params;

  const isAccountIdOk = numbersOnlyRgx.test(accountId);

  const isCidOk = mongoIdRgx.test(cid);

  const isLangOk = langCodes.indexOf(lang.toLowerCase()) > -1;

  if (!isAccountIdOk || !isCidOk || !isLangOk) {
    if (!isAccountIdOk)
      errMsg.add("accountId", accountId, errMsgs.malAccountId);

    if (!isCidOk) errMsg.add("cid", cid, errMsgs.malCid);

    if (!isLangOk) errMsg.add("lang", lang, errMsgs.malLang);

    res.status(422);
    next({
      message: errMsgs.generalApiErrMsg,
      errors: await errMsg.create()
    });
    return;
  }

  try {
    const result = await getAccountCidResLang(
      accountId,
      cid,
      lang.toLowerCase()
    );
    res.json(result);
  } catch (error) {
    console.warn(
      errMsgs.catchEndpointErrMsg.replace(
        "{{endpointName}}",
        "psAccountCidResLang"
      ),
      error.isAxiosError ? error.toJSON() : error
    );
    next(error);
  }
};

/**
 * Endpoint: /api/locate?ip=0&callback=PriceSpider.jsonp&_={{$timestamp}}&key=apikey
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns {Promise<void>} User's geolocation data
 */
exports.psUserLocation = async (req, res, next) => {
  try {
    const result = await getUserLocation();
    res.json(result);
  } catch (error) {
    console.warn(
      errMsgs.catchEndpointErrMsg.replace("{{endpointName}}", "psUserLocation"),
      error.isAxiosError ? error.toJSON() : error
    );
    next(error);
  }
};

/**
 * Endpoint: /api/1/:accountId/:cid/res/:lang.js?key=apikey
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns {Promise<void>} Product data
 */
exports.psAccountDataSkusCountrySku = async (req, res, next) => {
  const { accountId, countryCode, sku } = req.params;

  const isAccountIdOk = numbersOnlyRgx.test(accountId);

  const iscountryCodeOk = countryCodes.indexOf(countryCode.toUpperCase()) > -1;

  const isSkuOk = numbersOnlyRgx.test(sku);

  if (!isAccountIdOk || !iscountryCodeOk || !isSkuOk) {
    const messages = [];

    if (!isAccountIdOk)
      errMsg.add("accountId", accountId, errMsgs.malAccountId);

    if (!iscountryCodeOk)
      errMsg.add("countryCode", countryCode, errMsgs.malCountry);

    if (!isSkuOk) errMsg.add("sku", sku, errMsgs.malSku);

    res.status(422);
    next({
      message: errMsgs.generalApiErrMsg,
      errors: await errMsg.create()
    });
    return;
  }

  try {
    const result = await getAccountDataSkusCountrySku(
      accountId,
      countryCode.toUpperCase(),
      sku
    );
    res.json(result);
  } catch (error) {
    console.warn(
      errMsgs.catchEndpointErrMsg.replace(
        "{{endpointName}}",
        "psAccountDataSkusCountrySku"
      ),
      error.isAxiosError ? error.toJSON() : error
    );
    next(error);
  }
};

/**
 * Endpoint: /api/1/:accountId/data/products/:pid.js?key=apikey
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns {Promise<void>} Product data
 */
exports.psAccountDataProductsPid = async (req, res, next) => {
  const { accountId, pid } = req.params;

  const isAccountIdOk = numbersOnlyRgx.test(accountId);

  const isPidOk = numbersOnlyRgx.test(pid);

  if (!isAccountIdOk || !isPidOk) {
    if (!isAccountIdOk)
      errMsg.add("accountId", accountId, errMsgs.malAccountId);

    if (!isPidOk) errMsg.add("pid", pid, errMsgs.malPid);

    res.status(422);
    next({
      message: errMsgs.generalApiErrMsg,
      errors: await errMsg.create()
    });
    return;
  }

  try {
    const result = await getAccountDataProductsPid(accountId, pid);
    res.json(result);
  } catch (error) {
    console.warn(
      errMsgs.catchEndpointErrMsg.replace(
        "{{endpointName}}",
        "psAccountDataProductsPid"
      ),
      error.isAxiosError ? error.toJSON() : error
    );
    next(error);
  }
};

/**
 * Endpoint: /api/1/postal-map/:countryCode.js
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns {Promise<void>} Product data
 */
exports.psPostalMapCountry = async (req, res, next) => {
  const { countryCode } = req.params;

  const iscountryCodeOk = countryCodes.indexOf(countryCode.toUpperCase()) > -1;

  if (!iscountryCodeOk) {
    errMsg.add("countryCode", countryCode, errMsgs.malCountry);

    res.status(422);
    next({
      message: errMsgs.generalApiErrMsg,
      errors: await errMsg.create()
    });
    return;
  }

  try {
    const result = await getPostalMapCountry(countryCode.toUpperCase());
    res.json(result);
  } catch (error) {
    console.warn(
      errMsgs.catchEndpointErrMsg.replace(
        "{{endpointName}}",
        "psPostalMapCountry"
      ),
      error.isAxiosError ? error.toJSON() : error
    );
    next(error);
  }
};

/**
 * Endpoint: /api/1/:accountId/data/stores/:countryCode/1/:pid.js?key=apikey
 * @param {Request} req
 * @returns {Promise<Result>} List of stores for particular Product ID
 */
exports.psIntAccountDataStoresCountryPid = async req => {
  const { accountId, countryCode, areaCode, pid } = req.params;

  const isAccountIdOk = numbersOnlyRgx.test(accountId);

  const iscountryCodeOk = countryCodes.indexOf(countryCode.toUpperCase()) > -1;

  const isPidOk = numbersOnlyRgx.test(pid);

  if (!isAccountIdOk || !iscountryCodeOk || !isPidOk) {
    if (!isAccountIdOk)
      errMsg.add("accountId", accountId, errMsgs.malAccountId);

    if (!iscountryCodeOk)
      errMsg.add("countryCode", countryCode, errMsgs.malCountry);

    if (!isPidOk) errMsg.add("pid", pid, errMsgs.malPid);

    /**
     * @type {Result}
     */
    return {
      status: 422,
      error: {
        message: errMsgs.generalApiErrMsg,
        errors: errMsg.create()
      }
    };
  }

  try {
    const result = await getAccountDataStoresCountryPid(
      accountId,
      countryCode,
      areaCode,
      pid
    );

    /**
     * @type {Result}
     */
    return { result };
  } catch (error) {
    console.warn(
      errMsgs.catchEndpointErrMsg.replace(
        "{{endpointName}}",
        "psAccountDataStoresCountryPid"
      ),
      error.isAxiosError ? error.toJSON() : error
    );

    /**
     * @type {Result}
     */
    return { error };
  }
};

/**
 * Endpoint: /api/1/:accountId/data/stock/:countryCode/1/:pid.js?key=apikey
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns {Promise<void>} List of stores for particular Product ID
 */
exports.psAccountDataStockCountryPid = async (req, res, next) => {
  const { accountId, countryCode, areaCode, pid } = req.params;

  const isAccountIdOk = numbersOnlyRgx.test(accountId);

  const iscountryCodeOk = countryCodes.indexOf(countryCode.toUpperCase()) > -1;

  const isPidOk = numbersOnlyRgx.test(pid);

  if (!isAccountIdOk || !iscountryCodeOk || !isPidOk) {
    if (!isAccountIdOk)
      errMsg.add("accountId", accountId, errMsgs.malAccountId);

    if (!iscountryCodeOk)
      errMsg.add("countryCode", countryCode, errMsgs.malCountry);

    if (!isPidOk) errMsg.add("pid", pid, errMsgs.malPid);

    res.status(422);
    next({
      message: errMsgs.generalApiErrMsg,
      errors: await errMsg.create()
    });
    return;
  }

  try {
    const result = await getAccountDataStockCountryPid(
      accountId,
      countryCode,
      areaCode,
      pid
    );
    res.json(result);
  } catch (error) {
    console.warn(
      errMsgs.catchEndpointErrMsg.replace(
        "{{endpointName}}",
        "psAccountDataStockCountryPid"
      ),
      error.isAxiosError ? error.toJSON() : error
    );
    next(error);
  }
};

/**
 * Endpoint https://cdn.pricespider.com/1/:accountId/data/regionalPricing/:countryCode/1/:pid.js
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns {Promise<void>} List of regional pricings for particular Product ID
 */
exports.psAccountDataRegionalPricingCountryPid = async (req, res, next) => {
  const { accountId, countryCode, areaCode, pid } = req.params;

  const isAccountIdOk = numbersOnlyRgx.test(accountId);

  const iscountryCodeOk = countryCodes.indexOf(countryCode.toUpperCase()) > -1;

  const isPidOk = numbersOnlyRgx.test(pid);

  if (!isAccountIdOk || !iscountryCodeOk || !isPidOk) {
    if (!isAccountIdOk)
      errMsg.add("accountId", accountId, errMsgs.malAccountId);

    if (!iscountryCodeOk)
      errMsg.add("countryCode", countryCode, errMsgs.malCountry);

    if (!isPidOk) errMsg.add("pid", pid, errMsgs.malPid);

    res.status(422);
    next({
      message: errMsgs.generalApiErrMsg,
      errors: await errMsg.create()
    });
    return;
  }

  try {
    const result = await getAccountDataRegionalPricingCountryPid(
      accountId,
      countryCode,
      areaCode,
      pid
    );
    res.json(result);
  } catch (error) {
    console.warn(
      errMsgs.catchEndpointErrMsg.replace(
        "{{endpointName}}",
        "psAccountDataRegionalPricingCountryPid"
      ),
      error.isAxiosError ? error.toJSON() : error
    );
    next(error);
  }
};

/**
 * Endpoint https://cdn.pricespider.com/1/:accountId/data/families/:countryCode/:locale.js
 * @param {Request} req
 * @returns {Promise<Result>} List all products
 */
exports.psIntAccountDataFamiliesCountryLocale = async req => {
  const { accountId, countryCode, locale } = req.params;

  const isAccountIdOk = numbersOnlyRgx.test(accountId);

  const iscountryCodeOk = countryCodes.indexOf(countryCode.toUpperCase()) > -1;

  const data = path.join(
    __dirname,
    "../data/skus/",
    countryCode.toUpperCase(),
    locale + ".json"
  );

  let localeExists = fs.existsSync(data);

  let isLocaleOk = localeExists ? true : false;

  if (!isAccountIdOk || !iscountryCodeOk || !isLocaleOk) {
    if (!isAccountIdOk)
      errMsg.add("accountId", accountId, errMsgs.malAccountId);

    if (!iscountryCodeOk)
      errMsg.add("countryCode", countryCode, errMsgs.malCountry);

    if (iscountryCodeOk && !isLocaleOk)
      errMsg.add("locale", locale, errMsgs.malPsLocale);

    return {
      status: 422,
      error: {
        message: errMsgs.generalApiErrMsg,
        errors: errMsg.create()
      }
    };
  }

  try {
    const result = await getAccountDataFamiliesCountryLocale(
      accountId,
      countryCode.toUpperCase(),
      locale
    );

    /**
     * @type {Result}
     */
    return { result };
  } catch (error) {
    console.warn(
      errMsgs.catchEndpointErrMsg.replace(
        "{{endpointName}}",
        "psAccountDataRegionalPricingCountryPid"
      ),
      error.isAxiosError ? error.toJSON() : error
    );

    /**
     * @type {Result}
     */
    return { error };
  }
};

/**
 * Endpoint: /api/1/redirect/?cid=cid&iid=iid&v=v&pmid=pmid&price=price&stockStatus=stockStatus&widgetType=widgetType&t=t&postalCode=postalCode&n=0&_={{timestamp}}?key=apikey
 * NOTE: add query parameter "includeSellerUrl" to transform the response to object containing both redirectUrl and sellerUrl
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 * @returns {Promise<void>} Redirect Service URL or Redirect Service URL and Seller URL
 */
exports.psRedirect = async (req, res, next) => {
  const includeSellerUrl = req.query.hasOwnProperty("includeSellerUrl");

  const { cid, v, pmid, price, stockStatus, widgetType, postalCode, errMsg } =
    validateRedirectUrlParams(req.query);

  if (errMsg?.messages?.length > 0) {
    res.status(422);
    next({
      message: errMsgs.generalApiErrMsg,
      errors: await errMsg.create()
    });
    return;
  }

  const payload = {
    redirectUrl: createRedirectUrl(
      cid,
      v,
      pmid,
      price,
      stockStatus,
      widgetType,
      postalCode
    )
  };

  try {
    if (!includeSellerUrl) {
      res.send(payload);
    } else {
      res.json({
        ...payload,
        sellerUrl: await extractSellerUrl(payload.redirectUrl)
      });
    }
  } catch (error) {
    console.warn(
      errMsgs.catchEndpointErrMsg.replace("{{endpointName}}", "psRedirect"),
      error.isAxiosError ? error.toJSON() : error
    );
    next(error);
  }
};
