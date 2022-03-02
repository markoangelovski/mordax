const router = require("express").Router();

const Page = require("./pages.model.js");
const Locale = require("../locales/locales.model.js");

const { response } = require("../../lib/helpers");
const { parsePageData, makePagesForRes } = require("./pages.helpers.js");

// Path: /api/1/pages
// Desc: Fetch a page
router.get("/", async (req, res, next) => {
  const { pageUrl } = req.query;
  try {
    let pages = await Page.find({ url: pageUrl }).select("-__v -locale");

    if (pages.length) {
      pages = pages.map(page => {
        page = { id: page._id, ...page._doc };
        delete page._id;
        return page;
      });

      response(res, 200, false, { pages: pages.length }, pages);
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

// Path: /api/1/pages
// Desc: Create/edit new page
router.post("/", async (req, res, next) => {
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
        next({
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
        makePagesForRes([page])
      );
    }
  } catch (error) {
    console.warn("Error occurred in GET /api/1/pages", error);
    next(error);
  }
});

// Path: /api/1/pages
// Desc: Delete a page
router.delete("/", async (req, res, next) => {
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
    console.warn("Error occurred in GET /api/1/pages", error);
    next(error);
  }
});

module.exports = router;
