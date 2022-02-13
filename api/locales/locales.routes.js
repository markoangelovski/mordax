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
  getPageUrls
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
router.post("/", async (req, res, next) => {
  const { url, newUrl, action } = req.query;

  try {
    const locales = await Locale.find({ "url.value": url });

    if (locales.length) {
      if (action !== "update")
        return response(res, 200, false, {}, makeLocaleForRes(locales[0]));

      const updatedLocale = new Locale(updateLocale(locales[0], req));

      const savedLocale = await updatedLocale.save();

      response(res, 200, false, {}, makeLocaleForRes(savedLocale._doc));

      // Update the URL
      if (newUrl && newUrl !== url)
        Page.updateMany(
          { locale: savedLocale._id },
          { $set: { localeUrl: savedLocale.url.value } }
        )
          .then(_ => _)
          .catch(err =>
            console.warn("Error updating locale URL in pages for ", url)
          );
    } else {
      const newLocalePayload = makeLocaleForDb(req);

      const newLocale = new Locale(newLocalePayload);

      const savedLocale = await newLocale.save();

      response(res, 200, false, {}, makeLocaleForRes(savedLocale._doc));

      const pages = await getPageUrls(savedLocale._id, url);

      Page.insertMany(pages)
        .then(_ => _)
        .catch(err => console.warn("Error saving pages for ", url));
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
    const { deletedCount } = await Locale.deleteOne({ "url.value": url });

    if (deletedCount) {
      response(
        res,
        200,
        false,
        {},
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

module.exports = router;
