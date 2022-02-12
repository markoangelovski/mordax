const crypto = require("crypto");
const router = require("express").Router();

const { response } = require("../../lib/helpers.js");

const { ERROR_FORBIDDEN } = require("../../lib/errorCodes.json");

const Keys = require("./keys.model.js");

// Path: /api/1/keys/create-key?owner=Key owner&roles=user,team,editor,analyst
// Desc: Creates new API key
router.post("/create-key", async (req, res, next) => {
  const { key, issuedFor, roles } = req.query;

  try {
    const requestedRoles = roles.split(",").map(role => role.trim());

    // Handle roles creation
    let availableRoles = new Set();
    const { roleMap } = require("../../lib/userRoles.json");

    // Check if requester has the correct role needed to create the key
    if (!req.admin)
      req.roles.forEach(userRole => {
        requestedRoles.forEach(requestedRole => {
          if (roleMap[userRole].allowedRoles.indexOf(requestedRole) !== -1)
            availableRoles.add(requestedRole);
        });
      });

    // If the requestor does not have an authority to add create a key with requested role, return 403
    if (!req.admin && !availableRoles.size)
      return response(res, 403, true, {}, ERROR_FORBIDDEN);

    const newKey = await Keys.create({
      key: crypto.randomBytes(16).toString("hex"),
      issuer: req.admin ? "admin" : key,
      issuedFor,
      roles: req.admin ? requestedRoles : [...availableRoles]
    });
    delete newKey._doc._id;
    delete newKey._doc.__v;

    response(res, 200, false, {}, newKey._doc);
  } catch (error) {
    console.warn("Error occurred in GET /api/1/keys/create-key route", error);
    next(error);
  }
});

// Path: /api/1/keys/deactivate-key?keyToDeactivate=12345
// Desc: Deactivates API key
router.post("/deactivate-key", async (req, res, next) => {
  const { key, keyToDeactivate } = req.query;

  try {
    const result = await Keys.updateOne(
      { key: keyToDeactivate, active: true },
      {
        $set: {
          active: false,
          deactivationDate: new Date().toISOString(),
          deactivationIssuer: req.admin ? "admin" : key
        }
      }
    );

    if (result.modifiedCount > 0) {
      response(
        res,
        200,
        false,
        {},
        { message: `Key ${keyToDeactivate} successfully deactivated.` }
      );
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
router.get("/key-info", async (req, res, next) => {
  const { key, checkKey } = req.query;

  // Only admin can check all keys and other keys
  // Other users can check their own key
  if (!req.admin && key !== checkKey)
    return response(res, 403, true, {}, ERROR_FORBIDDEN);

  try {
    if (checkKey) {
      const key = await Keys.find({ key: checkKey }).select("-_id -__v");

      if (key) {
        // res.json(key);
        response(res, 200, false, {}, key);
      } else {
        res.status(404);
        next({
          message: `Key ${checkKey} not found.`
        });
      }
    } else {
      const keys = await Keys.find().select("-_id -__v");
      // res.json(keys);
      response(res, 200, false, {}, keys);
    }
  } catch (error) {
    console.warn("Error occurred in GET /api/1/keys/create-key route", error);
    next(error);
  }
});

module.exports = router;
