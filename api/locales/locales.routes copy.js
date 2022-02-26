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
  mapTemplateDataToPage
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
// Desc: Updates a locale
router.post("/", upload.single("template"), async (req, res, next) => {
  const { url, newUrl } = req.query;
  const buffer = req.file?.buffer;

  let templateData;
  if (buffer) {
    const workbook = xlsx.read(buffer, { type: "buffer" });
    templateData = xlsx.utils.sheet_to_json(
      workbook.Sheets[workbook.SheetNames[0]]
    );
  }

  try {
    const locales = await Locale.find({ "url.value": url });

    if (locales.length) {
      await Locale.findOneAndUpdate(
        { _id: locales[0]._id },
        { $set: updateLocale(locales[0], req) }
      );

      // Update pages if template is uploaded
      let pagesCount, updateResult;
      if (buffer) {
        const existingPages = await Page.find({ locale: locales[0]._id });
        pagesCount = existingPages.length;

        const updatedPages = mapTemplateDataToPage(
          req,
          locales[0].fields,
          templateData,
          existingPages
        );

        const bulkWrites = updatedPages.map(page => {
          const filter = {};
          if (page._id) {
            filter._id = page._id;
          } else {
            filter.url = page.url;
          }

          return {
            updateOne: {
              filter,
              update: {
                $set: {
                  locale: locales[0]._doc._id,
                  localeUrl: locales[0]._doc.url.value,
                  url: page.url,
                  type: page.type,
                  source: "feed",
                  data: page.data
                }
              },
              upsert: true
            }
          };
        });

        updateResult = await Page.bulkWrite(bulkWrites);
      }

      response(
        res,
        200,
        false,
        {
          pages: pagesCount,
          updatedPages: updateResult?.nModified,
          insertedPages: updateResult?.nUpserted
        },
        makeLocaleForRes(locales[0]._doc)
      );

      // Update the URL in pages
      if (newUrl && newUrl !== url)
        Page.updateMany(
          { locale: locales[0]._id },
          { $set: { localeUrl: locales[0].url.value } }
        )
          .then(_ => _)
          .catch(err =>
            console.warn("Error updating new locale URL in pages for ", url)
          );
    } else {
      // If locale is not found execute next POST /api/1/locales endpoint handler
      next();
    }
  } catch (error) {
    console.warn("Error occurred in POST (Update) /api/1/locales route", error);
    next({
      message: error.message,
      ...error
    });
  }
});

// Path: /api/1/locales
// Desc: Creates a new locale
router.post("/", upload.single("template"), async (req, res, next) => {
  const { url, newUrl, hrefLang } = req.query;
  const buffer = req.file?.buffer;

  let templateData;
  if (buffer) {
    const workbook = xlsx.read(buffer, { type: "buffer" });
    templateData = xlsx.utils.sheet_to_json(
      workbook.Sheets[workbook.SheetNames[0]]
    );
  }

  try {
    const newLocale = new Locale(makeLocaleForDb(req));

    const savedLocale = await newLocale.save();
    let pagesData = await getPageUrls(savedLocale._id, url, hrefLang);
    // Update pages if xlsx template is uploaded
    let updatedPagesCount = 0,
      insertedPagesCount = 0,
      updatedPages,
      pages,
      pagesFound = pagesData.length;

    if (buffer) {
      updatedPages = mapTemplateDataToPage(
        req,
        savedLocale.fields,
        templateData,
        pagesData
      );
      // TODO: napravi da ako se digne lokal bez xlsx templatea da se svejedno spreme pagevi iz sitemap.xml
      // If xml sitemap returned pages, update them with the data from the uploaded template
      if (pagesFound) {
        pagesData = pagesData
          .map(page => {
            updatedPages.forEach(updatedPage => {
              if (page.url === updatedPage.url)
                page = {
                  locale: page.locale,
                  localeUrl: page.localeUrl,
                  url: page.url,
                  type: updatedPage.type,
                  source: "feed",
                  data: updatedPage.data
                };
            });
            return page;
          })
          .sort((first, second) => {
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
          });
        pages = await Page.insertMany(pagesData);

        updatedPagesCount = templateData.length;
      } else {
        // If xml sitemap does not contain URLs, create pages using the data from template
        pagesData = updatedPages
          .map(page => ({
            updateOne: {
              filter: { _id: page._id },
              update: {
                $set: {
                  locale: savedLocale._doc._id,
                  localeUrl: savedLocale._doc.url.value,
                  url: page.url,
                  type: page.type,
                  source: "feed",
                  data: page.data
                }
              },
              upsert: true
            }
          }))
          .sort((first, second) => {
            var A = first.updateOne.update.$set;
            var B = second.updateOne.update.$set;

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
          });

        pages = await Page.bulkWrite(pagesData);

        insertedPagesCount = pages.nUpserted;
      }
    }

    response(
      res,
      200,
      false,
      {
        pagesFound: pagesFound,
        updatedPages: updatedPagesCount,
        insertedPages: insertedPagesCount
      },
      makeLocaleForRes(savedLocale._doc)
    );
  } catch (error) {
    console.warn("Error occurred in POST (New) /api/1/locales route", error);
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
      queries.push(
        Page.find({ localeUrl: url }).select("url type source data SC BINLite")
      );

    const [existingLocale, existingLocalePages] = await Promise.all(queries);

    if (existingLocale) {
      // TODO: napravi da se može downloadat ili cijela SKU lista kao exelica, ili samo proizvodi bez sellera
      response(
        res,
        200,
        false,
        { locale: 1, pages: existingLocalePages.length },
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
  // Detect if Vercel app is being used and redirect the request to Heroku app
  // Vercel app has read-only filesystem and new files cannot be created
  if (req.headers["x-vercel-forwarded-for"])
    return res.redirect(require("../../config").hostHeroku + req.originalUrl);

  let { url } = req.query;

  try {
    const existingLocalePages = await Page.find({ localeUrl: url }).select(
      "-_id url type data"
    );

    if (existingLocalePages.length) {
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
    const [deletedLocales, deletedPages] = await Promise.all([
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
          deletedPages: deletedPages.deletedCount
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
