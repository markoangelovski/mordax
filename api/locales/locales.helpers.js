const axios = require("axios").default;
const mongoose = require("mongoose");
const xmlParser = require("xml2js").parseStringPromise;
const xlsx = require("xlsx");

const { pmspaApiUrl } = require("./locales.config.json");

const { urlRgx, localeRgx } = require("../../lib/regex");

const Locale = require("./locales.model.js");
const Page = require("../pages/pages.model.js");
const { getAccountCidConfig } = require("../ps/ps.drivers");

exports.makeLocaleForDb = (req, xmlSitemap) => {
  const makeAttr = attribute => ({
    value: attribute ? `${attribute}` : undefined,
    createdAt: new Date().toISOString()
  });

  const processList = list =>
    list
      ?.split(",")
      .map(field => field.trim())
      .filter(field => field.charAt(0) !== "-" && field.length > 0); // In case some attributes with "-" were passed;

  return {
    createdBy: req.admin ? "admin" : req.query.key,
    brand: makeAttr(req.query.brand),
    locale: makeAttr(req.query.locale),
    url: makeAttr(req.query.url),
    fields: processList(req.query.fields),
    thirdParties: processList(req.query.thirdParties),
    xmlSitemap,
    capitol: makeAttr(req.query.capitol),
    SC: {
      scLocale: makeAttr(req.query.scLocale),
      scButtonKey: makeAttr(req.query.scButtonKey),
      scCarouselKey: makeAttr(req.query.scCarouselKey),
      scEcEndpointKey: makeAttr(req.query.scEcEndpointKey)
    },
    BINLite: {
      BINLiteKey: makeAttr(req.query.BINLiteKey)
    },
    PS: {
      psAccountId: makeAttr(req.query.psKey?.split("-")[0]),
      psCid: makeAttr(req.query.psKey?.split("-")[1])
    }
  };
};

exports.makeLocaleForRes = locale => ({
  createdBy: locale.createdBy,
  brand: locale.brand,
  locale: locale.locale,
  url: locale.url,
  stats: locale.stats,
  fields: locale.fields,
  thirdParties: locale.thirdParties,
  xmlSitemap: locale.xmlSitemap,
  capitol: locale.capitol?.value
    ? {
        ...locale.capitol,
        history: locale.capitol.history.map(item => ({
          previousValue: item.previousValue,
          updatedValue: item.updatedValue,
          updatedAt: item.updatedAt,
          updatedBy: item.updatedBy
        }))
      }
    : undefined,
  SC:
    locale.SC.scButtonKey?.value ||
    locale.SC.scCarouselKey?.value ||
    locale.SC.scEcEndpointKey?.value
      ? {
          scLocale: {
            ...locale.SC.scLocale,
            history: locale.SC.scLocale?.history?.map(item => ({
              previousValue: item.previousValue,
              updatedValue: item.updatedValue,
              updatedAt: item.updatedAt,
              updatedBy: item.updatedBy
            }))
          },
          scButtonKey: {
            ...locale.SC.scButtonKey,
            history: locale.SC.scButtonKey?.history?.map(item => ({
              previousValue: item.previousValue,
              updatedValue: item.updatedValue,
              updatedAt: item.updatedAt,
              updatedBy: item.updatedBy
            }))
          },
          scCarouselKey: {
            ...locale.SC.scCarouselKey,
            history: locale.SC.scCarouselKey?.history?.map(item => ({
              previousValue: item.previousValue,
              updatedValue: item.updatedValue,
              updatedAt: item.updatedAt,
              updatedBy: item.updatedBy
            }))
          },
          scEcEndpointKey: {
            ...locale.SC.scEcEndpointKey,
            history: locale.SC.scEcEndpointKey?.history?.map(item => ({
              previousValue: item.previousValue,
              updatedValue: item.updatedValue,
              updatedAt: item.updatedAt,
              updatedBy: item.updatedBy
            }))
          }
        }
      : undefined,
  BINLite: locale.BINLite.BINLiteKey?.value
    ? {
        BINLiteKey: {
          ...locale.BINLite.BINLiteKey,
          history: locale.BINLite.BINLiteKey.history?.map(item => ({
            previousValue: item.previousValue,
            updatedValue: item.updatedValue,
            updatedAt: item.updatedAt,
            updatedBy: item.updatedBy
          }))
        }
      }
    : undefined,
  PS: locale.PS.psAccountId?.value
    ? {
        ...locale.PS,
        psAccountId: {
          ...locale.PS.psAccountId,
          history: locale.PS.psAccountId?.history?.map(item => ({
            previousValue: item.previousValue,
            updatedValue: item.updatedValue,
            updatedAt: item.updatedAt,
            updatedBy: item.updatedBy
          }))
        },
        psCid: {
          ...locale.PS.psCid,
          history: locale.PS.psCid?.history?.map(item => ({
            previousValue: item.previousValue,
            updatedValue: item.updatedValue,
            updatedAt: item.updatedAt,
            updatedBy: item.updatedBy
          }))
        }
      }
    : undefined,
  createdAt: locale.createdAt,
  updatedAt: locale.updatedAt
});

exports.updateLocale = req => {
  const locale = req.locale;

  const updateAttr = (prevAttr, newAttr, key) => {
    if (newAttr && prevAttr.value !== `${newAttr}`) {
      prevAttr.history.push({
        previousValue: prevAttr.value || "",
        updatedValue: `${newAttr}`,
        updatedAt: new Date().toISOString(),
        updatedBy: req.admin ? "admin" : key
      });
      prevAttr.value = `${newAttr}`;
      prevAttr.createdAt = prevAttr.createdAt || new Date().toISOString();
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
    updatedAttrs.every(attribute => {
      const argToRemove = attribute.charAt(0) === "-" && attribute.slice(1);

      if (updatedAttrs.indexOf(argToRemove) > -1)
        updatedAttrs = updatedAttrs.filter(
          filterField => filterField !== argToRemove
        );
      return true;
    });

    return updatedAttrs.filter(
      // Filters out the attribute marked for deletion
      field => field.charAt(0) !== "-" && field.length > 0
    );
  };

  locale.brand = updateAttr(locale.brand, req.query.brand, key);
  locale.locale = updateAttr(locale.locale, req.query.locale, key);
  locale.url = updateAttr(locale.url, req.query.newUrl, key);
  locale.fields = updateList(locale, "fields", fields);
  locale.thirdParties = updateList(locale, "thirdParties", thirdParties);
  locale.capitol = updateAttr(locale.capitol, req.query.capitol, key);
  locale.SC.scLocale = updateAttr(locale.SC.scLocale, req.query.scLocale, key);
  locale.SC.scButtonKey = updateAttr(
    locale.SC.scButtonKey,
    req.query.scButtonKey,
    key
  );
  locale.SC.scCarouselKey = updateAttr(
    locale.SC.scCarouselKey,
    req.query.scCarouselKey,
    key
  );
  locale.SC.scEcEndpointKey = updateAttr(
    locale.SC.scEcEndpointKey,
    req.query.scEcEndpointKey,
    key
  );
  locale.BINLite.BINLiteKey = updateAttr(
    locale.BINLite.BINLiteKey,
    req.query.BINLiteKey,
    key
  );
  locale.PS.psAccountId = updateAttr(
    locale.PS.psAccountId,
    req.query.psKey?.split("-")[0],
    key
  );
  locale.PS.psCid = updateAttr(
    locale.PS.psCid,
    req.query.psKey?.split("-")[1],
    key
  );

  if (!locale.SC?.scButtonKey?.value) locale.SC.scButtonKey = undefined;
  if (!locale.SC?.scCarouselKey?.value) locale.SC.scCarouselKey = undefined;
  if (!locale.SC?.scEcEndpointKey?.value) locale.SC.scEcEndpointKey = undefined;
  if (!locale.BINLite.BINLiteKey?.value) locale.BINLite.BINLiteKey = undefined;
  if (!locale.PS.psAccountId?.value) locale.PS.psAccountId = undefined;
  if (!locale.PS.psCid?.value) locale.PS.psCid = undefined;
  if (!locale.capitol?.value) locale.capitol = undefined;

  return locale;
};

exports.updatePages = async req => {
  if (!req.file) return;

  const { Sheets, SheetNames } = xlsx.read(req.file.buffer, {
    type: "buffer"
  });
  const templateData = xlsx.utils.sheet_to_json(Sheets[SheetNames[0]]);

  const updatedPages = mapTemplateDataToPage(
    req,
    req.locale.fields,
    templateData,
    req.pages
  );

  const bulkWrites = updatedPages.map(page => ({
    updateOne: {
      filter: { _id: page._id },
      update: {
        $set: {
          locale: req.locale._id,
          localeUrl: req.locale.url.value,
          url: page.url,
          type: page.type,
          SKU: page.SKU,
          source: "feed",
          inXmlSitemap: page.inXmlSitemap,
          active: page.active ? page.active : true,
          data: page.data
        }
      },
      upsert: true
    }
  }));

  const { nModified, nUpserted } = await Page.bulkWrite(bulkWrites);

  return {
    pagesSubmitted: templateData.length || 0,
    pagesUpdated: nModified,
    pagesCreated: nUpserted
  };
};

const getXmlSitemapUrl = async url => {
  let robotsUrl = url.replace(localeRgx, "");
  robotsUrl =
    robotsUrl.charAt(robotsUrl.length - 1) === "/"
      ? robotsUrl + "robots.txt"
      : robotsUrl + "/robots.txt";

  const { data } = await axios(robotsUrl);

  return data.match(urlRgx)[0];
};
exports.getXmlSitemapUrl = getXmlSitemapUrl;

exports.getPageUrls = async (id, url, hrefLang) => {
  const { data: xmlSitemapData } = await axios(await getXmlSitemapUrl(url));

  let xmlData = await xmlParser(xmlSitemapData);

  return xmlData.urlset?.url
    ? xmlData.urlset?.url
        .map(rawUrl => {
          let pageUrl;

          if (hrefLang && rawUrl["xhtml:link"]) {
            // If hreflang arg is passed, get the link corresponding to that hreflang
            pageUrl = rawUrl["xhtml:link"]
              .filter(link => link.$.hreflang === hrefLang)
              .map(lang => lang.$.href)[0];
          } else {
            pageUrl = rawUrl.loc[0];
          }

          return {
            locale: id,
            localeUrl: url,
            url: /https:\/\//gi.test(pageUrl) ? pageUrl : "https://" + pageUrl,
            inXmlSitemap: true,
            active: true
          };
        })
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
        })
    : [];
};

const mapTemplateDataToPage = (req, fields, template, existingPages) =>
  // Iterate over items in uploaded xlsx template file {url: "https://...", Title: "page title", psSku: "pricespider sku",etc}
  {
    const existingPagesData = [];

    const updatedPages = template.map(templatePage => {
      // Previously existing product pages will have the SKU as a unique identifier, first try finding the page to update by SKU first
      let page = existingPages.find(existingPage => {
        if (!templatePage.SKU || !existingPage.SKU) return false;
        return existingPage.SKU === templatePage.SKU;
      });

      // If page is not found, in case of new locale and fresh pages from xml, find the page by URL
      if (!page)
        page = existingPages.find(
          existingPage => existingPage.url === templatePage.url
        );

      const pageData = page?.data;

      const updatedData = {};
      fields.forEach(field => {
        const pageField = pageData && page.data[field]?.value;
        let templateField = templatePage[field] && `${templatePage[field]}`; // remove apostrophes
        if (/'/gi.test(templateField))
          templateField = templateField.replace(/'/gi, "");
        if (templateField) {
          // Create the data entry for specific key/column in the uploaded xlsx template file or reapply existing data
          updatedData[field] = {
            value: pageField || templateField,
            createdAt:
              page?.data?.[field]?.createdAt || new Date().toISOString(),
            history: page?.data?.[field]?.history || []
          };
        }

        // If page exists in XML Sitemap and it has the data for the specific key/column, check if they are different and store the difference in history array
        if (
          page &&
          pageData &&
          pageField &&
          templateField &&
          pageField !== templateField
        ) {
          updatedData[field] = {
            value: templateField,
            createdAt: page.data[field].createdAt,
            history: [
              ...page.data[field].history,
              {
                previousValue: page.data[field].value,
                updatedValue: `${templateField}`,
                updatedAt: new Date().toISOString(),
                updatedBy: req.admin ? "admin" : req.query.key
              }
            ]
          };
        }
      });

      const isVariant = existingPagesData.indexOf(page?._id.toString()) > -1;

      const payload = {
        _id:
          isVariant || !page?.inXmlSitemap
            ? new mongoose.Types.ObjectId()
            : page?._id,
        url: page?.url || templatePage.url,
        type: templatePage.type,
        SKU: templatePage.SKU?.toString().replace(/'/gi, ""),
        inXmlSitemap: page?.inXmlSitemap || false,
        data: updatedData
      };

      // Save a record of all URLs/pages in uploaded template. If single URL/page appears multiple times (in cases of variants of a single product), create a new Object ID for each variant.
      existingPagesData.push(page?._id.toString());

      return payload;
    });

    // console.log("existingPagesData", existingPagesData);
    return updatedPages;
  };

exports.calculateLocaleStats = url => {
  Page.find({ localeUrl: url })
    .select("url type inXmlSitemap SC BINLite PS")
    .then(pages => {
      const data = {};
      let productsOrVariants = 0,
        entriesWithSellers = 0,
        pagesNotInSitemap = 0,
        otherPages = 0;

      const uniquePages = new Set(),
        singleProducts = new Set();

      pages.forEach(page => {
        uniquePages.add(page.url);

        if (page.type === "product") {
          productsOrVariants++;
          singleProducts.add(page.url);
        }

        // Adds all other custom page types, such as articles, etc.
        if (page.type && page.type !== "product") {
          data[`${page.type}s`] = data[`${page.type}s`] || 0;
          data[`${page.type}s`]++;
        }

        if (!page.inXmlSitemap) pagesNotInSitemap++;

        if (page.SC.matches.length) entriesWithSellers++;
        if (page.BINLite.matches.length) entriesWithSellers++;
        if (page.PS.matches.length) entriesWithSellers++;

        if (!page.type) otherPages++;
      });

      const stats = {
        pages: uniquePages.size,
        entries: pages.length,
        pagesNotInSitemap,
        products: singleProducts.size,
        variants: productsOrVariants - singleProducts.size,
        entriesWithSellers,
        ...data,
        otherPages
      };

      return Locale.updateOne({ "url.value": url }, { $set: { stats } });
    })
    .then(({ modifiedCount }) =>
      console.log(
        `Pages stats for locale ${url} ${modifiedCount ? "" : "not"} updated.`
      )
    )
    .catch(err =>
      console.warn(
        "Error occurred while adding pages stats to locale",
        url,
        ".",
        err
      )
    );
};

exports.updateLocalePsDetails = locale => {
  if (!locale.PS.psAccountId?.value) return;

  return getAccountCidConfig(locale.PS.psAccountId.value, locale.PS.psCid.value)
    .then(result => {
      const filteredRules = result.rules.filter(
        rule => rule.match.countryCode.length && rule.match.tag.length
      );
      const psInstances = filteredRules
        .map(({ match }) => match.tag[0].replace(/ /gi, "_"))
        .filter(instance => instance.length > 2);
      const psCountries = filteredRules.map(
        ({ match }) => match.countryCode[0]
      );
      const psLanguages = Object.keys(result.res);

      return Locale.updateOne(
        { _id: locale._id },
        {
          $set: {
            "PS.psInstances": psInstances,
            "PS.psCountries": [...new Set(psCountries)],
            "PS.psLanguages": psLanguages
          }
        }
      );
    })
    .then(({ modifiedCount }) =>
      console.log(
        `PriceSpider details for locale ${locale.url.value}${
          modifiedCount ? "" : "not"
        } updated.`
      )
    )
    .catch(error =>
      console.warn(
        "Error occured when adding PS data to locale ",
        locale.url.value,
        error.isAxiosError ? error.toJSON() : error.message
      )
    );
};

exports.getLocaleMetadata = async url =>
  axios(pmspaApiUrl + "/v1/locale?url=" + url, {
    headers: { "X-Service-Key": process.env.PMSPA_API_KEY }
  });

exports.makeLocalesSort = sort => {
  if (!sort) return "";

  const baseFields = ["createdAt", "updatedAt"];

  const objPropsFields = ["url", "brand", "locale"];

  const sortArray = sort.split(",");

  return sortArray
    .map(sortItem => {
      const desc = sortItem[0] === "-";

      const tempSortItem = desc ? sortItem.slice(1) : sortItem;

      // If sort field is a base field, return the original base field
      if (baseFields.indexOf(tempSortItem) > -1) return sortItem;

      // If sort field is from objPropsFields fields, format the sort to access the value
      if (objPropsFields.indexOf(tempSortItem) > -1)
        return `${desc ? "-" : ""}${tempSortItem}.value`;
    })
    .join(" ");
};

// exports.updateUrl=(url,newUrl)=>{
//     // Update the URL in pages
//     if (newUrl && newUrl !== url)
//       Page.updateMany(
//         { locale: savedLocale._id },
//         { $set: { localeUrl: savedLocale.url.value } }
//       )
//         .then(_ => _)
//         .catch(err =>
//           console.warn("Error updating new locale URL in pages for ", url)
//         );
// }
