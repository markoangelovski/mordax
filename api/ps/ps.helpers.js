// @ts-check
const axios = require("axios").default;

const { errMsgs, psRedirUrl } = require("./ps.config.json");

const { numbersOnlyRgx, mongoIdRgx } = require("../../lib/regex.js");

/**
 * Fetches data from URL and parses it to proper json.
 * @param {string} url - PriceSpider endpoint
 * @returns {Promise<object>} PS response in JSON format.
 */
exports.fetchPs = async url => {
  const { data } = await axios(url);

  /**
   * Exception for endpoint https://cdn.pricespider.com/1/:accountId/:cid/res/:lang.js
   * Pattern ", {" appears in multiple cases and malforms the json
   * Plus it uses single quotes in PriceSpider.onload('arg', {...}) instead of PriceSpider.onload("arg", {...}) like all other endpoints
   */
  if (/\'\, \{/gi.test(data))
    return JSON.parse("{" + data.split("', {")[1].split("})")[0] + "}");

  /**
   * Exception for endpoint https://cdn.pricespider.com/1/postal-map/:countryCode.js
   * Uses single quotes and array payload in PriceSpider.onload('arg', [{...}]) instead of PriceSpider.onload("arg", {...}) like all other endpoints
   */
  if (/\'\, \[\{/gi.test(data))
    return JSON.parse("[" + data.split("', [")[1].split("])")[0] + "]");

  // Converts standard jsonp response to json
  if (/\(\{/gi.test(data))
    return JSON.parse("{" + data.split("({")[1].split("})")[0] + "}");

  // Converts PS's custom jsonp responses to json
  if (/\, \{/gi.test(data))
    return JSON.parse("{" + data.split(", {")[1].split("})")[0] + "}");

  console.warn("Fetched data not parseable: ", data);
  return JSON.parse(data);
};

/**
 * Padds the middle half of the key with asterisks
 * @param {string} key - Any key
 * @returns {string} Censored key
 */
exports.censorKey = key => {
  // Split key into two strings
  const firstPart = key.slice(0, key.length / 2);
  const secondPart = key.slice(key.length / 2);

  const firstPartHalf = firstPart.slice(0, firstPart.length / 2);
  const secondPartHalf = secondPart.slice(secondPart.length / 2);

  return (
    firstPartHalf.padEnd(firstPart.length, "*") +
    secondPartHalf.padStart(secondPart.length, "*")
  );
};

/**
 * Error message generator
 * @typedef {Object} ErrorMessageGenerator
 * @property {Array<object>} messages - Error messages placeholder
 * @property {Array<object>} _messages - Temp error messages placeholder
 * @property {Function} add - Adds messages to the message queue
 * @property {Function} create - Creates Error message
 */

/**
 * @type {ErrorMessageGenerator}
 */
const errMsg = {
  messages: [],
  _messages: [],
  /**
   * Adds API message object to the message queue
   * @param {string} attribute - Attribute name
   * @param {string} value - Attribute value
   * @param {string} message - Current error message
   * @returns {void | ErrorMessageGenerator} message - Current error message
   */
  add(attribute, value, message) {
    if (!attribute) {
      return console.warn("Arguments required!");
    }
    this.messages.push({
      attribute,
      value,
      message
    });
    return this;
  },
  /**
   * Creates API Errors
   * @returns {void | Array<object>}
   */
  create() {
    if (!this.messages.length) {
      return console.warn("At least one error message required!");
    }
    this._messages = this.messages;
    this.messages = [];
    return this._messages;
  }
};
exports.errMsg = errMsg;

/**
 * Creates redirect URL
 * @param {string} cid - Config ID (Mongo DB part of ps-key)
 * @param {string | undefined} v - Account version, from /1/:accountId/config.js
 * @param {string} pmid - Product Match ID, from /1/:accountId/data/products/:pid.js
 * @param {string} price - Product Price, from /1/:accountId/data/products/:pid.js
 * @param {string} stockStatus - Product Price, from /1/:accountId/data/products/:pid.js
 * @param {string} widgetType - Widget Type, from /1/:accountId/:cid/config.js
 * @param {string} postalCode - Postal code, from https://locate.pricespider.com/?ip=0&callback=PriceSpider.jsonp&_={{$timestamp}}
 * @returns Redirect Service URL
 */
exports.createRedirectUrl = (
  cid,
  v,
  pmid,
  price,
  stockStatus,
  widgetType,
  postalCode
) => {
  const params = new URLSearchParams();
  params.append("cid", cid);
  params.append("iid", createGuid());
  v && params.append("v", v.toString());
  params.append("pmid", pmid.toString());
  price && params.append("price", price.toString());
  stockStatus && params.append("stockStatus", stockStatus.toString());
  widgetType && params.append("widgetType", widgetType.toString());
  params.append(
    "t",
    Math.random() > 0.5
      ? (Math.random() * 1000000).toFixed(0)
      : (Math.random() * 10000).toFixed(0)
  );
  postalCode && params.append("postalCode", postalCode.toString());
  params.append("n", "0");
  params.append("_", Date.now().toString());

  return psRedirUrl + "redirect?" + params;
};

/**
 * Validates params needed to create Redirect URL and creates the URL if everything is ok
 * @param {object} reqQuery - req.query object from Node
 * @returns {object} Validated query params or errors object
 */
exports.validateRedirectUrlParams = reqQuery => {
  let { cid, v, pmid, price, stockStatus, widgetType, postalCode } = reqQuery;

  cid = cid && typeof cid === "string" && mongoIdRgx.test(cid) && cid;

  v = v && typeof v === "string" && v.length > 0 && v;

  pmid = pmid && typeof pmid === "string" && numbersOnlyRgx.test(pmid) && pmid;

  price =
    price &&
    typeof price === "string" &&
    !isNaN(parseFloat(price)) &&
    `${parseFloat(price.replace(",", "."))}`;

  stockStatus =
    stockStatus &&
    typeof stockStatus === "string" &&
    numbersOnlyRgx.test(stockStatus) &&
    (stockStatus === "0" || stockStatus === "1") &&
    stockStatus;

  widgetType = widgetType && typeof widgetType === "string" && widgetType;

  postalCode =
    postalCode &&
    typeof postalCode === "string" &&
    numbersOnlyRgx.test(postalCode) &&
    postalCode;

  if (!cid) errMsg.add("cid", reqQuery.cid, errMsgs.malCidMissing);

  if (reqQuery.hasOwnProperty("v") && !v)
    errMsg.add("v", reqQuery.v, errMsgs.malVer);

  if (!pmid) errMsg.add("pmid", reqQuery.pmid, errMsgs.malPmidMissing);

  if (reqQuery.hasOwnProperty("price") && !price)
    errMsg.add("price", reqQuery.price, errMsgs.malPrice);

  if (reqQuery.hasOwnProperty("stockStatus") && !stockStatus)
    errMsg.add("stockStatus", reqQuery.stockStatus, errMsgs.malStock);

  if (reqQuery.hasOwnProperty("widgetType") && !widgetType)
    errMsg.add("widgetType", reqQuery.widgetType, errMsgs.malWidgetType);

  if (errMsg.messages.length) {
    return { errMsg };
  }

  return {
    cid,
    v,
    pmid,
    price,
    stockStatus,
    widgetType,
    postalCode
  };
};

/**
 * Creates Instance ID (iid) value to be passed to redirect service
 * @argument {string} redirUrl - PriceSpider redirect service URL for single seller
 * @returns {Promise<string>} Seller URL
 */
exports.extractSellerUrl = async redirUrl => {
  try {
    // @ts-ignore
    const { data } = await axios(redirUrl);

    // return data.match(urlRgx);

    if (/redirectUrl = "/gi.test(data)) {
      return data.split('redirectUrl = "')[1].split('";')[0];
    } else {
      return "No seller URL found.";
    }
  } catch (error) {
    error = error.isAxiosError ? error.toJSON() : error;

    console.warn(
      errMsgs.catchEndpointErrMsg.replace(
        "{{endpointName}}",
        "extractSellerUrl"
      ),
      error
    );
    return error.message;
  }
};

/**
 * Creates Instance ID (iid) value to be passed to redirect service
 * @returns iid value used for redirect service
 */
function createGuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    /** @type {number} */
    var r = (16 * Math.random()) | 0;
    return ("x" == c ? r : (3 & r) | 8).toString(16);
  });
}

/**
 * Seller data result
 * @typedef {Object} SellerDataResult
 * @property {string} pageId - Product's page id from Mongo
 * @property {boolean} sellersOk - Indicates whether API response is ok
 * @property {Array<object>} matches - Matches array
 * @property {number} status - Status code in case of error
 * @property {string} message - Error message
 */

/**
 * Get seller data
 * @param {string} accountId - PS Accounr ID
 * @param {string} countryCode - Country code
 * @param {string} psInstance - PS Instance
 * @param {string} pageId - Page ID of a particular product
 * @param {string} psSku - PS SKU of a particular product
 * @returns {Promise<SellerDataResult>} Seller data result
 */
exports.getSellerData = async (
  accountId,
  countryCode,
  psInstance,
  pageId,
  psSku
) => {
  let matches,
    sellersOk = false,
    status,
    message,
    psInstanceData,
    pid;

  try {
    // Has to be imported like this otherwise it throws Circular Depenedencies error
    const {
      getAccountDataSkusCountrySku,
      getAccountDataProductsPid
    } = require("./ps.drivers.js");

    try {
      psInstanceData = require(`./data/skus/${countryCode.toUpperCase()}/${psInstance}.json`);
    } catch (error) {
      console.warn(
        `No local PS data found for country: ${countryCode} and PS instance: ${psInstance}`
      );
    }

    // Check if Product ID exists in the local products data json file
    if (psInstanceData && psInstanceData[psSku]) {
      pid = psInstanceData[psSku];
    } else {
      // If Product ID does not exist in the local products data json file, fetch it from PS
      const { productId } = await getAccountDataSkusCountrySku(
        accountId,
        countryCode.toUpperCase(),
        psSku
      );
      pid = productId;
    }

    const {
      productMatches: { id = [], seller, price } // id = [] default to empty array for products with no matches that do not have the id array in the productMatches
    } = await getAccountDataProductsPid(accountId, pid);

    matches = Array.from({ length: id.length }, (_, i) => ({
      pmid: id[i],
      sid: seller[i].id,
      retailerName: seller[i].name,
      price: price[i]
    }));

    sellersOk = true;
  } catch (error) {
    error = error.isAxiosError ? error.toJSON() : error;
    console.warn(
      "Error occurred while fetching PS data for single product, ",
      psSku,
      error
    );
    status = error.status;
    message = error.message;
  }

  /**
   * @type {SellerDataResult}
   */
  return {
    pageId,
    sellersOk,
    matches,
    status,
    message
  };
};
