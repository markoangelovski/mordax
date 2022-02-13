const path = require("path");
const router = require("express").Router();
const xlsx = require("xlsx");
const multer = require("multer");
const upload = multer();

const Locale = require("./locales.model.js");
const Page = require("../pages/pages.model.js");

const {
  makeLocaleForDb,
  makeLocaleForRes,
  updateLocale,
  sortItems,
  getPageUrls,
  mapTemplateDataToPage
} = require("./locales.helpers.js");

const { response } = require("../../lib/helpers.js");

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
        {},
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
    next(error);
  }
});

// Path: /api/1/locales
// Desc: Creates a new locale
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
      const updatedLocale = new Locale(updateLocale(locales[0], req));

      const savedLocale = await updatedLocale.save();

      // Update pages if template is uploaded
      let pagesCount, updateResult;
      if (buffer) {
        const existingPages = await Page.find({ locale: savedLocale._id });
        pagesCount = existingPages.length;

        const updatedPages = mapTemplateDataToPage(
          req,
          savedLocale.fields,
          templateData,
          existingPages
        );

        const bulkWrites = updatedPages.map(page => {
          const filter = {};
          if (page._id) {
            filter._id = page._id;
          } else {
            file.url = page.url;
          }

          return {
            updateOne: {
              filter,
              update: { $set: { data: page.data } },
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
        { pages: pagesCount, updatedPages: updateResult.nModified },
        makeLocaleForRes(savedLocale._doc)
      );

      // Update the URL in pages
      if (newUrl && newUrl !== url)
        Page.updateMany(
          { locale: savedLocale._id },
          { $set: { localeUrl: savedLocale.url.value } }
        )
          .then(_ => _)
          .catch(err =>
            console.warn("Error updating new locale URL in pages for ", url)
          );
    } else {
      const newLocalePayload = makeLocaleForDb(req);

      const newLocale = new Locale(newLocalePayload);

      const savedLocale = await newLocale.save();

      let pagesData = await getPageUrls(savedLocale._id, url);

      // Update pages if xlsx template is uploaded
      let updatedPagesCount;
      if (buffer) {
        updatedPages = mapTemplateDataToPage(
          req,
          savedLocale.fields,
          templateData,
          pagesData
        );

        updatedPagesCount = updatedPages.length;

        pagesData = pagesData.map(page => {
          updatedPages.forEach(updatedPage => {
            if (page.url === updatedPage.url)
              page = {
                locale: page.locale,
                localeUrl: page.localeUrl,
                url: page.url,
                data: updatedPage.data
              };
          });
          return page;
        });
      }

      const pages = await Page.insertMany(pagesData);

      response(
        res,
        200,
        false,
        { pages: pages.length, updatedPages: updatedPagesCount },
        makeLocaleForRes(savedLocale._doc)
      );
    }
  } catch (error) {
    console.warn("Error occurred in POST /api/1/locales route", error);
    next(error);
  }
});

// Path: /api/1/locales/single?key=123456789&url=https://www.herbalessences.com&download=all/noSellers
// Desc: Fetches the pages data for a single locale
router.get("/single", async (req, res, next) => {
  let { url, includePages, download } = req.query;
  includePages = includePages === "true";

  try {
    const queries = [
      Locale.findOne({ "url.value": url }).select(
        "-_id -__v -brand.history._id -locale.history._id -url.history._id -fields.history._id -scButtonKey.history._id -scCarouselKey.history._id -scEcEndpointKey.history._id -BINLiteKey.history._id -PSKey.history._id -capitol.history._id"
      )
    ];
    if (includePages)
      queries.push(Page.find({ localeUrl: url }).select("-_id url data"));

    const [existingLocale, existingLocalePages] = await Promise.all(queries);

    if (existingLocale) {
      // TODO: napravi da se može downloadat ili cijela SKU lista kao exelica, ili samo proizvodi bez sellera
      response(
        res,
        200,
        false,
        { pagesCount: existingLocalePages.length },
        { ...existingLocale._doc, pages: existingLocalePages }
      );
    } else {
      res.status(404);
      next({
        message: `Locale ${url} not found.`
      });
    }
  } catch (error) {
    console.warn("Error occurred in GET /api/1/locales/single route", error);
    next(error);
  }
});

// Path: /api/1/locales/single?key=123456789&url=https://www.herbalessences.com
// Desc: Deletes the locale and related pages list
router.delete("/single", async (req, res, next) => {
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
    next(error);
  }
});

// Path: /api/1/locales/template
// Desc: Downloads the Pages List template
router.get("/template", async (req, res, next) => {
  res.download(
    path.join(__dirname, "../../public/Test Herbal Essences en-us.xlsx")
  );
});

module.exports = router;
