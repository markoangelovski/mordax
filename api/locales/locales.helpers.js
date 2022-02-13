const { default: axios } = require("axios");
const xmlParser = require("xml2js").parseStringPromise;

const { urlRgx, localeRgx } = require("../../lib/regex");

exports.makeLocaleForDb = req => {
  const makeAttr = attribute => ({
    value: attribute,
    createdAt: new Date().toISOString()
  });

  let fieldsArray = ["url"];

  if (req.query.fields)
    fieldsArray = fieldsArray.concat(
      req.query.fields.split(",").map(field => field.trim())
    );

  return {
    createdBy: req.admin ? "admin" : req.query.key,
    brand: makeAttr(req.query.brand),
    locale: makeAttr(req.query.locale),
    url: makeAttr(req.query.url),
    fields: fieldsArray.filter(
      field => field.charAt(0) !== "-" && field.length > 0
    ), // In case some attributes with "-" were passed
    capitol: makeAttr(req.query.capitol),
    scButtonKey: makeAttr(req.query.scButtonKey),
    scCarouselKey: makeAttr(req.query.scCarouselKey),
    scEcEndpointKey: makeAttr(req.query.scEcEndpointKey),
    BINLiteKey: makeAttr(req.query.BINLiteKey),
    PSKey: makeAttr(req.query.PSKey)
  };
};

exports.makeLocaleForRes = locale => ({
  createdBy: locale.createdBy,
  brand: locale.brand.value,
  locale: locale.locale.value,
  url: locale.url.value,
  fields: locale.fields,
  capitol: locale.capitol.value,
  scButtonKey: locale.scButtonKey.value,
  scCarouselKey: locale.scCarouselKey.value,
  scEcEndpointKey: locale.scEcEndpointKey.value,
  BINLiteKey: locale.BINLiteKey.value,
  PSKey: locale.PSKey.value
});

exports.updateLocale = (locale, req) => {
  const updateAttr = (prevAttr, newAttr, key) => {
    if (newAttr && prevAttr.value !== newAttr) {
      prevAttr.history.push({
        previousValue: prevAttr.value,
        updatedValue: newAttr,
        updatedAt: new Date().toISOString(),
        updatedBy: req.admin ? "admin" : key
      });
      prevAttr["value"] = newAttr;
      return prevAttr;
    }

    return prevAttr;
  };

  const { key, fields } = req.query;

  // Join existing fields and new fields to set to filter for duplicates
  if (fields)
    newFields = new Set([
      ...locale.fields,
      ...fields.split(",").map(field => field.trim())
    ]);

  // If new fields are submitted use them, otherwise use old fields
  let updatedFields = fields ? [...newFields] : locale.fields;

  // Do not allow for url field to be removed
  const index = updatedFields.indexOf("-url");
  if (index) updatedFields = updatedFields.filter((_, i) => index !== i);

  // Check if any attribute is prefixed with '-' and remove it from the fields array
  updatedFields.every(field => {
    const argToRemove = field.charAt(0) === "-" && field.slice(1);

    if (updatedFields.indexOf(argToRemove) > -1)
      updatedFields = updatedFields.filter(
        filterField => filterField !== argToRemove
      );
    return true;
  });

  locale.brand = updateAttr(locale.brand, req.query.brand, key);
  locale.locale = updateAttr(locale.locale, req.query.locale, key);
  locale.url = updateAttr(locale.url, req.query.newUrl, key);
  locale.fields = updatedFields.filter(
    field => field.charAt(0) !== "-" && field.length > 0
  ); // Filters out the attribute marked for deletion
  locale.capitol = updateAttr(locale.capitol, req.query.capitol, key);
  locale.scButtonKey = updateAttr(
    locale.scButtonKey,
    req.query.scButtonKey,
    key
  );
  locale.scCarouselKey = updateAttr(
    locale.scCarouselKey,
    req.query.scCarouselKey,
    key
  );
  locale.scEcEndpointKey = updateAttr(
    locale.scEcEndpointKey,
    req.query.scEcEndpointKey,
    key
  );
  locale.BINLiteKey = updateAttr(locale.BINLiteKey, req.query.BINLiteKey, key);
  locale.PSKey = updateAttr(locale.PSKey, req.query.BINLiteKey, key);

  return locale;
};

exports.sortItems = (items, attr) =>
  items.sort((first, second) => {
    var A = first[attr].toUpperCase();
    var B = second[attr].toUpperCase();
    if (A < B) {
      return -1;
    }
    if (A > B) {
      return 1;
    }
    return 0;
  });

exports.getPageUrls = async (id, url) => {
  let robotsUrl = url.replace(localeRgx, "");
  robotsUrl =
    robotsUrl.charAt(robotsUrl.length - 1) === "/"
      ? robotsUrl + "robots.txt"
      : robotsUrl + "/robots.txt";

  console.log("robotsUrl", robotsUrl);

  const { data: robotsData } = await axios(robotsUrl);

  const xmlUrl = robotsData.match(urlRgx)[0];

  const { data: xmlSitemapData } = await axios(xmlUrl);

  const {
    urlset: { url: rawUrls }
  } = await xmlParser(xmlSitemapData);

  const urls = rawUrls
    .map(rawUrl => ({
      locale: id,
      localeUrl: url,
      url: /https:\/\//gi.test(rawUrl.loc[0])
        ? rawUrl.loc[0]
        : "https://" + rawUrl.loc[0]
    }))
    .sort((first, second) => {
      var A = first;
      var B = second;
      if (A < B) {
        return -1;
      }
      if (A > B) {
        return 1;
      }
      return 0;
    });

  return urls;
};

exports.mapTemplateDataToPage = (req, fields, template, pages) =>
  // Iterate over items in uploaded xlsx template file {Title: "page title", SKU: "product sku",etc}
  template.map(item => {
    // Find the corresponding page in the list of all pages
    const page = pages.find(page => page.url === item.URL);
    const { data } = page;

    const updatedData = {};
    fields
      .filter(field => field !== "url") // Remove url from fields, it is already available
      .forEach(field => {
        // Create the data entry for specific key/column in the uploaded xlsx template file
        updatedData[field] = {
          value: item[field],
          createdAt: new Date().toISOString(),
          history: []
        };

        // If page exists and it has the data for the specific key/column, check if they are different and store the difference in history array
        if (page && data && page.data[field].value !== item[field]) {
          updatedData[field] = {
            value: item[field],
            createdAt: page.data[field].createdAt,
            history: [
              ...page.data[field].history,
              {
                previousValue: page.data[field].value,
                updatedValue: item[field],
                updatedAt: new Date().toISOString(),
                updatedBy: req.admin ? "admin" : req.query.key
              }
            ]
          };
        }
      });

    return {
      _id: page._id,
      url: page.url || item.URL,
      data: updatedData
    };
  });
