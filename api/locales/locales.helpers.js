const { default: axios } = require("axios");
const xmlParser = require("xml2js").parseStringPromise;

const { urlRgx, localeRgx } = require("../../lib/regex");

exports.makeLocaleForDb = req => {
  const makeAttr = attribute => ({
    value: attribute,
    createdAt: new Date().toISOString()
  });

  const fieldsArray = req.query.fields?.split(",").map(field => field.trim());
  const thirdPartiesArray = req.query.thirdParties
    ?.split(",")
    .map(party => party.trim());

  return {
    createdBy: req.admin ? "admin" : req.query.key,
    brand: makeAttr(req.query.brand),
    locale: makeAttr(req.query.locale),
    url: makeAttr(req.query.url),
    fields: fieldsArray?.filter(
      field => field.charAt(0) !== "-" && field.length > 0
    ), // In case some attributes with "-" were passed
    thirdParties: thirdPartiesArray?.filter(
      party => party.charAt(0) !== "-" && party.length > 0
    ), // In case some attributes with "-" were passed
    capitol: makeAttr(req.query.capitol),
    SC: {
      scButtonKey: makeAttr(req.query.scButtonKey),
      scCarouselKey: makeAttr(req.query.scCarouselKey),
      scEcEndpointKey: makeAttr(req.query.scEcEndpointKey)
    },
    BINLite: {
      BINLiteKey: makeAttr(req.query.BINLiteKey)
    },
    PS: {
      psType: makeAttr(req.query.psType),
      psKey: makeAttr(req.query.psKey)
    }
  };
};

exports.makeLocaleForRes = locale => ({
  // createdBy: locale.createdBy,
  brand: locale.brand.value,
  locale: locale.locale.value,
  url: locale.url.value,
  fields: locale.fields,
  thirdParties: locale.thirdParties,
  capitol: locale.capitol.value,
  scButtonKey: locale.SC.scButtonKey.value,
  scCarouselKey: locale.SC.scCarouselKey.value,
  scEcEndpointKey: locale.SC.scEcEndpointKey.value,
  BINLiteKey: locale.BINLite.BINLiteKey.value,
  psType: locale.PS.psType.value,
  psKey: locale.PS.psKey.value,
  psType: locale.PS.psType.value
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

  const { key, fields, thirdParties } = req.query;

  // Adds or removes atributes from the "fields" and "thirdParties" list
  const updateList = (locale, attr, attrs) => {
    // Join existing attributes and new attributes to set to filter for duplicates
    if (attrs)
      newAttrs = new Set([
        ...locale[attr],
        ...attrs.split(",").map(field => field.trim())
      ]);

    // If new attributes are submitted use them, otherwise use old attribute
    let updatedAttrs = attrs ? [...newAttrs] : locale[attr];

    // Check if any attribute is prefixed with '-' and remove it from the attributes array
    updatedAttrs.every(attr => {
      const argToRemove = attr.charAt(0) === "-" && attr.slice(1);

      if (updatedAttrs.indexOf(argToRemove) > -1)
        updatedAttrs = updatedAttrs.filter(
          filterField => filterField !== argToRemove
        );
      return true;
    });

    return updatedAttrs;
  };

  locale.brand = updateAttr(locale.brand, req.query.brand, key);
  locale.locale = updateAttr(locale.locale, req.query.locale, key);
  locale.url = updateAttr(locale.url, req.query.newUrl, key);
  locale.fields = updateList(locale, "fields", fields).filter(
    field => field.charAt(0) !== "-" && field.length > 0
  ); // Filters out the attribute marked for deletion
  locale.thirdParties = updateList(locale, "thirdParties", thirdParties).filter(
    party => party.charAt(0) !== "-" && party.length > 0
  ); // Filters out the attribute marked for deletion
  locale.capitol = updateAttr(locale.capitol, req.query.capitol, key);
  locale.SC = {
    scButtonKey: updateAttr(locale.SC.scButtonKey, req.query.scButtonKey, key),
    scCarouselKey: updateAttr(
      locale.SC.scCarouselKey,
      req.query.scCarouselKey,
      key
    ),
    scEcEndpointKey: updateAttr(
      locale.SC.scEcEndpointKey,
      req.query.scEcEndpointKey,
      key
    )
  };
  locale.BINLite = {
    BINLiteKey: updateAttr(locale.BINLite.bnlKey, req.query.BINLiteKey, key)
  };
  locale.PS = {
    psType: updateAttr(locale.PS.psType, req.query.psType, key),
    psKey: updateAttr(locale.PS.psKey, req.query.psKey, key)
  };

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

  const { data: robotsData } = await axios(robotsUrl);

  const xmlUrl = robotsData.match(urlRgx)[0];

  const { data: xmlSitemapData } = await axios(xmlUrl);

  const {
    urlset: { url: rawUrls }
  } = await xmlParser(xmlSitemapData);

  return rawUrls
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
};

exports.mapTemplateDataToPage = (req, fields, template, pages) =>
  // Iterate over items in uploaded xlsx template file {Title: "page title", SKU: "product sku",etc}
  template.map(item => {
    // Find the corresponding page in the list of all pages
    const page = pages.find(page => page.url === item.url);
    const { data } = page;

    const updatedData = {};
    fields.forEach(field => {
      const pageDataValue = data && page.data[field].value;
      const templateItem = item[field];

      if (templateItem) {
        // Create the data entry for specific key/column in the uploaded xlsx template file
        updatedData[field] = {
          value: item[field],
          createdAt: new Date().toISOString(),
          history: []
        };
      }

      // If page exists and it has the data for the specific key/column, check if they are different and store the difference in history array
      if (
        page &&
        data &&
        pageDataValue &&
        templateItem &&
        pageDataValue !== templateItem
      ) {
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
      _id: page?._id,
      url: page?.url || item.url,
      type: item.type,
      data: updatedData
    };
  });
