const crypto = require("crypto");
const router = require("express").Router();

const { readWrite, admin } = require("../../middleware/auth.js");

const Keys = require("./keys.model.js");

// Path: /api/1/keys/create-key?owner=Key owner&privilege=readWrite
// Desc: Creates new API key
router.post("/create-key", readWrite, async (req, res, next) => {
  const { key, issuedFor, privilege } = req.query;

  try {
    // Admin can create readWrite keys
    // readWrite keys can create read keys
    const newKey = await Keys.create({
      key: crypto.randomBytes(16).toString("hex"),
      issuer: req.admin ? "admin" : key,
      issuedFor,
      privilege: req.admin ? privilege : "read"
    });
    delete newKey._doc._id;
    delete newKey._doc.__v;

    res.json(newKey._doc);
  } catch (error) {
    console.warn("Error occurred in GET /api/1/keys/create-key route", error);
    next(error);
  }
});

// Path: /api/1/keys/deactivate-key?keyToDeactivate=12345
// Desc: Deactivates API key
router.post("/deactivate-key", readWrite, async (req, res, next) => {
  const { key, keyToDeactivate } = req.query;

  try {
    const result = await Keys.updateOne(
      { key: keyToDeactivate },
      {
        $set: {
          active: false,
          deactivationDate: new Date().toISOString(),
          deactivationIssuer: req.admin ? "admin" : key
        }
      }
    );

    if (result.modifiedCount > 0) {
      res.json({ message: `Key ${keyToDeactivate} successfully deactivated.` });
    } else {
      res.status(404);
      next({
        message: `Key ${keyToDeactivate} not found.`
      });
    }
  } catch (error) {
    console.warn("Error occurred in GET /api/1/keys/create-key route", error);
    next(error);
  }
});

// Path: /api/1/keys/key-info
// Desc: Fetch read key
router.get("/key-info", admin, async (req, res, next) => {
  const { checkKey } = req.query;

  try {
    if (checkKey) {
      const key = await Keys.findOne({ key: checkKey }).select("-_id -__v");

      if (key) {
        res.json(key);
      } else {
        res.status(404);
        next({
          message: `Key ${checkKey} not found.`
        });
      }
    } else {
      const keys = await Keys.find().select("-_id -__v");
      res.json(keys);
    }
  } catch (error) {
    console.warn("Error occurred in GET /api/1/keys/create-key route", error);
    next(error);
  }
});

module.exports = router;
