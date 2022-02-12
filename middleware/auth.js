const Keys = require("../api/keys/keys.model.js");

const { response } = require("../lib/helpers.js");
const { roleMap } = require("../lib/userRoles.json");

const {
  ERROR_UNAUTHORIZED,
  ERROR_FORBIDDEN
} = require("../lib/errorCodes.json");

exports.checkKey = async (req, res, next) => {
  const { key } = req.query;

  try {
    if (key && key === process.env.MASTER_KEY) {
      // Admin keys have access to all endpoints
      req.admin = true;

      return next();
    }

    const existingKey = await Keys.find({ key, active: true }).select(
      "-_id roles"
    );

    if (key && existingKey.length > 0) {
      let authorized = false;
      // Handle endpoints access
      existingKey[0].roles.every(userRole => {
        let ok = false;
        roleMap[userRole].allowedEndpoints.every(allowedEndpoint => {
          const methodOk = allowedEndpoint[0].indexOf(req.method) !== -1;
          const endpointOk = req.originalUrl.indexOf(allowedEndpoint[1]) !== -1;

          // Check if allowed endpoint is a substring of the requested url
          if (methodOk && endpointOk) {
            authorized = true;
            // Break out the main loop switch
            ok = true;
            // Break out of the inner loop
            return false;
          }
          return true;
        });
        // Break out of the outer loop
        if (ok) return false;
      });

      if (authorized) {
        req.key = existingKey[0];
        req.roles = existingKey[0].roles;
        return next();
      }

      response(res, 403, true, {}, ERROR_FORBIDDEN);
    } else {
      response(res, 401, true, {}, ERROR_UNAUTHORIZED);
    }
  } catch (error) {
    console.warn("Error occurred while checking the key: ", error);
    next(error);
  }
};
