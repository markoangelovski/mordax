// @ts-check
const axios = require("axios").default;

const {
  // @ts-ignore
  psCdnUrl,
  // @ts-ignore
  psLocateUrl,
  // @ts-ignore
  psCheckUrl,
  // @ts-ignore
  psRedirUrl,
  // @ts-ignore
  psWwwassetsUrl,
  // @ts-ignore
  psEmbeddedcloudUrl
} = require("./ps.config.json");

const { fetchPs, censorKey } = require("./ps.helpers.js");

/**
 * Fetches PS Account details.
 * @param {string} accountId - Account ID, 1766 for PG
 * @returns {Promise<object>} PS account config data
 */
exports.getAccountConfig = async accountId =>
  await fetchPs(psCdnUrl + accountId + "/config.js");

/**
 * Fetches Locale Config details.
 * @param {string} accountId - Account ID, 1766 for PG
 * @param {string} cid - Config ID, MongoDB ID part of the PS key, for example 5eeceefdab088c00340ef470
 * @returns {Promise<object>} PS account config data
 */
exports.getAccountCidConfig = async (accountId, cid) => {
  const result = await fetchPs(psCdnUrl + accountId + "/" + cid + "/config.js");
  return {
    ...result,
    mapKey: censorKey(result.mapKey),
    googleGeocodeApiKey: censorKey(result.googleGeocodeApiKey)
  };
};

/**
 * Fetches Account Data Skus Map details.
 * @param {string} accountId - Account ID, 1766 for PG
 * @returns {Promise<object>} Account Data Skus Map details.
 */
exports.getAccountDataSkusMap = async accountId =>
  await fetchPs(psCdnUrl + accountId + "/" + "/data/skus/map.js");

/**
 * Fetches all labels for requested language. Used to check if Country Selectors exist, returns attribute countrySelector if yes.
 * @param {string} accountId - Account ID, 1766 for PG
 * @param {string} cid -  Config ID, Config ID, MongoDB ID part of the PS key, for example 5eeceefdab088c00340ef470
 * @param {string} lang - Two letter ISO language code
 * @returns {Promise<object>} Account Data Skus Map details.
 */
exports.getAccountCidResLang = async (accountId, cid, lang) =>
  await fetchPs(
    psCdnUrl + accountId + "/" + cid + "/" + "/res/" + lang + ".js"
  );

/**
 * Geolocation - checks location of the user on pageload
 * @returns {Promise<object>} Geolocation data
 */
exports.getUserLocation = async () =>
  await fetchPs(
    psLocateUrl + "?ip=0&callback=PriceSpider.jsonp&_=" + Date.now()
  );

/**
 * Fetches data for a single product by SKU
 * @param {string} accountId - Account ID, 1766 for PG
 * @param {string} countryCode -  Two letter ISO country code
 * @param {string} sku - Product SKU
 * @returns {Promise<object>} Product data
 */
exports.getAccountDataSkusCountrySku = async (accountId, countryCode, sku) =>
  await fetchPs(
    psCdnUrl + accountId + "/data/skus/" + countryCode + "/" + sku + ".js"
  );

/**
 * Fetches data for a single product by Product ID
 * @param {string} accountId - Account ID, 1766 for PG
 * @param {string} pid - Product ID
 * @returns {Promise<object>} Product data
 */
exports.getAccountDataProductsPid = async (accountId, pid) =>
  await fetchPs(psCdnUrl + accountId + "/data/products/" + pid + ".js");

// TODO: implementiraj ovaj endpoint 08 - https://check.pricespider.com/?pmid=126222899,125753859,125494304,126226251,130808915&sid=&pid=11972055&postalcode=52220&exp=60&callback=PriceSpider.jsonp&_={{$timestamp}}

// TODO: implementiraj ovaj endpoint 09 - https://locate.pricespider.com/?latlon=40.7306,-73.9866&countryCode=US&callback=PriceSpider.jsonp&_={{$timestamp}}

/**
 * Fetches Postal Map for country
 * @param {string} countryCode -  Two letter ISO country code
 * @returns {Promise<object>} Product data
 */
exports.getPostalMapCountry = async countryCode =>
  await fetchPs(psCdnUrl + "/postal-map/" + countryCode + ".js");
// https://cdn.pricespider.com/1/postal-map/:countryCode.js

/**
 * Fetches offline stores for singe Product ID
 * @param {string} accountId - Account ID, 1766 for PG
 * @param {string} countryCode -  Two letter ISO country code
 * @param {string} areaCode - Area code
 * @param {string} pid - Product ID
 * @returns {Promise<object>} Offline stores data
 */
exports.getAccountDataStoresCountryPid = async (
  accountId,
  countryCode,
  areaCode,
  pid
) => {
  areaCode = areaCode ? areaCode + "/" : "";
  return await fetchPs(
    psCdnUrl +
      accountId +
      "/data/stores/" +
      countryCode +
      "/" +
      areaCode +
      pid +
      ".js"
  );
};
/**
 * Fetches stock status for singe Product ID
 * @param {string} accountId - Account ID, 1766 for PG
 * @param {string} countryCode -  Two letter ISO country code
 * @param {string} areaCode - Area code
 * @param {string} pid - Product ID
 * @returns {Promise<object>} Offline stores data
 */
exports.getAccountDataStockCountryPid = async (
  accountId,
  countryCode,
  areaCode,
  pid
) => {
  areaCode = areaCode ? areaCode + "/" : "";
  return await fetchPs(
    psCdnUrl +
      accountId +
      "/data/stock/" +
      countryCode +
      "/" +
      areaCode +
      pid +
      ".js"
  );
};

/**
 * Fetches regional pricing for singe Product ID
 * @param {string} accountId - Account ID, 1766 for PG
 * @param {string} countryCode -  Two letter ISO country code
 * @param {string} areaCode - Area code
 * @param {string} pid - Product ID
 * @returns {Promise<object>} Offline stores data
 */
exports.getAccountDataRegionalPricingCountryPid = async (
  accountId,
  countryCode,
  areaCode,
  pid
) => {
  areaCode = areaCode ? areaCode + "/" : "";
  return await fetchPs(
    psCdnUrl +
      accountId +
      "/data/regionalPricing/" +
      countryCode +
      "/" +
      areaCode +
      pid +
      ".js"
  );
};

/**
 * Fetches all products and their details
 * @param {string} accountId - Account ID, 1766 for PG
 * @param {string} countryCode -  Two letter ISO country code
 * @param {string} locale - Locale
 * @returns {Promise<object>} Offline stores data
 */
exports.getAccountDataFamiliesCountryLocale = async (
  accountId,
  countryCode,
  locale
) =>
  await fetchPs(
    psCdnUrl +
      accountId +
      "/data/families/" +
      countryCode +
      "/" +
      locale +
      ".js"
  );
