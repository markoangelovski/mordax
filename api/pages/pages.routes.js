const router = require("express").Router();

const Page = require("./pages.model.js");
const Locale = require("../locales/locales.model.js");

const { response } = require("../../lib/helpers");
const { parsePageData, makePagesForRes } = require("./pages.helpers.js");

// Path: /1/pages/single
// Desc: Fetch a single page
router.get("/single", async (req, res, next) => {
  const { pageUrl, id } = req.query;

  const query = {};
  if (pageUrl && pageUrl !== "undefined") query.url = pageUrl;
  if (id) query._id = id;

  try {
    // TODO: napravi provjeru ako Object.keys(query).length postoji prije nego što ide query
    let pages = await Page.find(query).select("-__v -locale");

    if (pages.length) {
      response(
        res,
        200,
        false,
        { pages: pages.length },
        makePagesForRes(pages)
      );
    } else {
      res.status(404);
      next({
        message: `No pages with URL ${pageUrl} found.`
      });
    }
  } catch (error) {
    console.warn("Error occurred in GET /api/1/pages/single", error);
    next(error);
  }
});

// Path: /1/pages
// Desc: Fetch all pages for single locale
router.get("/", async (req, res, next) => {
  const { localeUrl } = req.query;

  const query = {};
  if (localeUrl && localeUrl !== "undefined") query.localeUrl = localeUrl;

  try {
    let [entries, total] = await Promise.all([
      Page.find(query).select("-__v -locale").limit(req.limit).skip(req.skip),
      Page.countDocuments({ localeUrl })
    ]);

    if (entries.length) {
      response(
        res,
        200,
        false,
        { entries: entries?.length, skipped: req.skip || undefined, total },
        makePagesForRes(entries).sort((first, second) => {
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
      );
    } else {
      res.status(404);
      next({
        message: `No pages with URL ${pageUrl} found.`
      });
    }
  } catch (error) {
    console.warn("Error occurred in GET /api/1/pages", error);
    next(error);
  }
});

// Path: /1/pages/single
// Desc: Create/edit new page
router.post("/single", async (req, res, next) => {
  const { localeUrl, id, pageUrl, type, data } = req.query;

  const query = {};
  if (id) query._id = id;
  if (pageUrl) query.url = pageUrl;

  try {
    let pages = await Page.find(query);

    // Update singe page when id is passed
    if (pages.length && id) {
      // TODO: dodaj funkcionalnost da se page updatea
      response(
        res,
        200,
        false,
        {
          pages: pages.length,
          note: "This would usually update the page but it currently does nothing. It will soon enough."
        },
        makePagesForRes(pages)
      );
    } else {
      // If locale is not passed add new page
      const locale = await Locale.findOne({ "url.value": localeUrl });

      if (!locale) {
        res.status(404);
        return next({
          message: `Locale ${localeUrl} not found.`
        });
      }

      const page = await Page.create({
        locale: locale._id,
        localeUrl,
        url: pageUrl,
        type,
        data: parsePageData(data)
      });

      response(
        res,
        201,
        false,
        { pages: 1, action: "Added new page" },
        makePagesForRes(page)
      );
    }
  } catch (error) {
    console.warn("Error occurred in GET /api/1/pages/single", error);
    next(error);
  }
});

// Path: /1/pages/single
// Desc: Delete a page
router.delete("/single", async (req, res, next) => {
  const { id } = req.query;

  const ids = id.split(",").map(id => id.trim());

  try {
    const { deletedCount } = await Page.deleteMany({ _id: ids });

    if (deletedCount) {
      response(
        res,
        200,
        false,
        { deletedPages: deletedCount },
        { message: `Page${deletedCount > 1 ? "s" : ""} deleted successfully.` }
      );
    } else {
      res.status(404);
      next({
        message: `Page${ids.length > 1 ? "s" : ""} not found.`
      });
    }
  } catch (error) {
    console.warn("Error occurred in GET /api/1/pages/single", error);
    next(error);
  }
});

module.exports = router;
