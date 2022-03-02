const path = require("path");
const router = require("express").Router();
const axios = require("axios").default;
const xlsx = require("xlsx");
const multer = require("multer");
const xmlParser = require("xml2js").parseStringPromise;
const upload = multer();

const Locale = require("./locales.model.js");
const Page = require("../pages/pages.model.js");

const { locMw } = require("./locales.middleware.js");
const {
  makeLocaleForDb,
  makeLocaleForRes,
  updateLocale,
  sortItems,
  getPageUrls,
  getXmlSitemapUrl,
  updatePages
} = require("./locales.helpers.js");

const { makePagesForRes } = require("../pages/pages.helpers.js");
const { response } = require("../../lib/helpers.js");
const { localeRgx, urlRgx } = require("../../lib/regex.js");

// Path: /api/1/locales
// Desc: Fetches all brands and locales
router.get("/", async (req, res, next) => {
  try {
    const locales = await Locale.find().select("-_id brand locale url");

    if (locales.length) {
      response(
        res,
        200,
        false,
        { locales: locales.length },
        sortItems(
          locales.map(locale => makeLocaleForRes(locale)),
          "brand"
        )
      );
    } else {
      res.status(404);
      next({
        message: `No locales found that match your query`
      });
    }
  } catch (error) {
    console.warn("Error occurred in GET /api/1/locales route", error);
    next({
      message: error.message,
      ...error
    });
  }
});

// Path: /api/1/locales
// Desc: Creates a new locale
router.post("/", upload.single("template"), async (req, res, next) => {
  const { url, hrefLang } = req.query;

  try {
    const locales = await Locale.find({ "url.value": url });

    // If locale exists, forward the request to the next route handler
    req.newLocale = false;
    req.locale = locales[0];
    if (locales.length) return next();

    const xmlSitemap = await getXmlSitemapUrl(url);

    const newLocale = new Locale(makeLocaleForDb(req, xmlSitemap));

    const [savedLocale, xmlPages] = await Promise.all([
      newLocale.save(),
      getPageUrls(newLocale._id, url, hrefLang)
    ]);

    const pages = xmlPages.length && (await Page.insertMany(xmlPages));

    // If template is uploaded, forward the request to the next route handler
    req.newLocale = true;
    req.locale = savedLocale._doc;
    req.pages = pages;
    if (req.file) return next();

    response(
      res,
      200,
      false,
      { newLocale: true, pagesFound: pages.length || 0 },
      makeLocaleForRes(savedLocale._doc)
    );
  } catch (error) {
    console.warn(
      "Error occurred in POST (New, without template) /api/1/locales route",
      error
    );
    next({
      message: error.message,
      ...error
    });
  }
});

// Path: /api/1/locales
// Desc: Updates a locale
router.post("/", async (req, res, next) => {
  try {
    if (!req.newLocale) {
      const [existingPages, _] = await Promise.all([
        Page.find({ locale: req.locale._id }),
        Locale.updateOne({ _id: req.locale._id }, { $set: updateLocale(req) })
      ]);

      req.pages = existingPages;
    }

    const updatedPagesRes = await updatePages(req);

    response(
      res,
      200,
      false,
      {
        newLocale: req.newLocale,
        entriesFound: req.pages.length || 0,
        entriesSubmitted: updatedPagesRes?.pagesSubmitted,
        entriesUpdated: updatedPagesRes?.pagesUpdated,
        entriesCreated: updatedPagesRes?.pagesCreated
      },
      makeLocaleForRes(updateLocale(req))
    );

    // TODO: napravi funkciju koja uzima newUrl i updatea url u lokalu i pagevima. Zovi je u svakom post /locales endpointu.
  } catch (error) {
    console.warn(
      "Error occurred in POST (New, with template) /api/1/locales route",
      error
    );
    next({
      message: error.message,
      ...error
    });
  }
});

// Path: /api/1/locales/single?key=123456789&url=https://www.herbalessences.com
// Desc: Fetches the pages data for a single locale
router.get("/single", locMw, async (req, res, next) => {
  let { url, includePages } = req.query;
  includePages = includePages === "true";

  try {
    const queries = [
      Locale.findOne({ "url.value": url }).select(
        "-createdBy -_id -__v -brand.history._id -locale.history._id -url.history._id -SC.scButtonKey.history._id -SC.scCarouselKey.history._id -SC.scEcEndpointKey.history._id -BINLite.BINLiteKey.history._id -PS.psType.history._id -PS.psKey.history._id -capitol.history._id"
      )
    ];
    if (includePages)
      queries.push(Page.find({ localeUrl: url }).select("-__v"));

    const [existingLocale, existingLocalePages] = await Promise.all(queries);

    const data = {};
    let productsOrVariants = 0,
      entriesWithSellers = 0,
      pagesNotInSitemap = 0,
      otherPages = 0;

    const uniquePages = new Set(),
      singleProducts = new Set();

    existingLocalePages.forEach(page => {
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

    if (existingLocale) {
      // TODO: napravi da se može downloadat ili cijela SKU lista kao exelica, ili samo proizvodi bez sellera
      response(
        res,
        200,
        false,
        {
          pages: uniquePages.size,
          entries: existingLocalePages.length,
          pagesNotInSitemap,
          products: singleProducts.size,
          variants: productsOrVariants - singleProducts.size,
          entriesWithSellers,
          ...data,
          otherPages
        },
        {
          ...existingLocale._doc,
          pages: makePagesForRes(existingLocalePages).sort((first, second) => {
            var A = first;
            var B = second;

            // Sort the pages with type first
            if (A.type && !B.type) {
              return -1;
            }
            if (!A.type && B.type) {
              return 1;
            }

            // Sort the pages with type alphabetically?
            if (A.type < B.type) {
              return -1;
            }
            if (A.type > B.type) {
              return 1;
            }

            return 0;
          })
        }
      );
    } else {
      res.status(404);
      next({
        message: `Locale ${url} not found.`
      });
    }
  } catch (error) {
    console.warn("Error occurred in GET /api/1/locales/single route", error);
    next({
      message: error.message,
      ...error
    });
  }
});

// Path: /api/1/locales/single/download?key=123456789&url=https://www.herbalessences.com&download=all/noSellers
// Desc: Fetches the pages data for a single locale
router.get("/single/download", async (req, res, next) => {
  let { url } = req.query;

  try {
    const existingLocalePages = await Page.find({ localeUrl: url }).select(
      "-_id url source type SKU inXmlSitemap data"
    );

    if (existingLocalePages.length) {
      const json = existingLocalePages.map(
        ({ url, source, type, SKU, inXmlSitemap, data }) => {
          const keys = data && Object.keys(data);

          const payload = {
            url,
            source,
            type,
            SKU,
            inXmlSitemap
          };

          keys && keys.forEach(key => (payload[key] = data[key].value));
          return payload;
        }
      );

      const wb = xlsx.utils.book_new();

      const ws_name = "Download";

      const ws = xlsx.utils.json_to_sheet(json);

      xlsx.utils.book_append_sheet(wb, ws, ws_name);

      const savePath = `${path.join(__dirname, "../../", "/public")}/${url
        .replace("https://", "")
        .replace(/\//gi, "-")}_${Date.now()}.xlsx`;

      xlsx.writeFile(wb, savePath);

      res.download(savePath);

      // TODO: napravi da se može downloadat ili cijela SKU lista kao exelica, ili samo proizvodi bez sellera
    } else {
      res.status(404);
      next({
        message: `Locale ${url} not found.`
      });
    }
  } catch (error) {
    console.warn("Error occurred in GET /api/1/locales/single route", error);
    next({
      message: error.message,
      ...error
    });
  }
});

// Path: /api/1/locales/single?key=123456789&url=https://www.herbalessences.com
// Desc: Deletes the locale and related pages list
router.delete("/single", locMw, async (req, res, next) => {
  const { url } = req.query;

  try {
    const [deletedLocales, deletedEntries] = await Promise.all([
      Locale.deleteOne({ "url.value": url }),
      Page.deleteMany({ localeUrl: url })
    ]);

    if (deletedLocales.deletedCount) {
      response(
        res,
        200,
        false,
        {
          deletedLocales: deletedLocales.deletedCount,
          deletedEntries: deletedEntries.deletedCount
        },
        {
          message: `Locale ${url} deleted successfully.`
        }
      );
    } else {
      res.status(404);
      next({
        message: `Locale ${url} not found.`
      });
    }
  } catch (error) {
    console.warn("Error occurred in DELETE /api/1/sc/sku-list route", error);
    next({
      message: error.message,
      ...error
    });
  }
});

// Path: /api/1/locales/template
// Desc: Downloads the Pages List template
router.get("/template", async (req, res, next) =>
  res.download(path.join(__dirname, "../../public/Example_Template.xlsx"))
);

// Path: /api/1/locales/sitemap.xml
// Desc: Fetches xml sitemap
router.get("/sitemap.xml", async (req, res, next) => {
  const { url } = req.query;

  try {
    let robotsUrl = url.replace(localeRgx, "");
    robotsUrl =
      robotsUrl.charAt(robotsUrl.length - 1) === "/"
        ? robotsUrl + "robots.txt"
        : robotsUrl + "/robots.txt";

    const { data: robotsData } = await axios(robotsUrl);

    const xmlUrl = robotsData.match(urlRgx)[0];

    const { data: xmlSitemapData } = await axios(xmlUrl);

    const xmlData = await xmlParser(xmlSitemapData);

    response(
      res,
      200,
      false,
      {
        // pagesFound: pagesFound
      },
      { ...xmlData }
    );
  } catch (error) {
    console.warn("Error occurred in POST (New) /api/1/locales route", error);
    next({
      message: error.message,
      ...error
    });
  }
});

module.exports = router;

/**
 *     if (existingLocalePages.length) {
      const json = existingLocalePages.map(({ url, type, data }) => {
        const keys = data && Object.keys(data);

        const payload = {
          url,
          type
        };

        keys && keys.forEach(key => (payload[key] = data[key].value));
        return payload;
      });

      const wb = xlsx.utils.book_new();

      const ws_name = "Download";

      const ws = xlsx.utils.json_to_sheet(json);

      xlsx.utils.book_append_sheet(wb, ws, ws_name);

      const savePath = `${path.join(__dirname, "../../", "/public")}/${url
        .replace("https://", "")
        .replace(/\//gi, "-")}_${Date.now()}.xlsx`;

      xlsx.writeFile(wb, savePath);

      res.download(savePath);

      // TODO: napravi da se može downloadat ili cijela SKU lista kao exelica, ili samo proizvodi bez sellera
    } else {
      res.status(404);
      next({
        message: `Locale ${url} not found.`
      });
    }
 */
