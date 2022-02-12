const { response } = require("../lib/helpers.js");

const {
  ERROR_NOT_FOUND,
  ERROR_INTERNAL_ISSUE
} = require("../lib/errorCodes.json");

exports.notFound = (req, res, next) =>
  response(res, 404, true, {}, ERROR_NOT_FOUND);

exports.errorHandler = (error, req, res, next) => {
  console.log("An error occurred:", error.message);

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  // If a resource is not found in DB, display 404 error
  const payload =
    statusCode === 404
      ? { ...ERROR_NOT_FOUND, message: error.message }
      : { ...ERROR_INTERNAL_ISSUE, message: error.message };

  response(res, statusCode, true, {}, payload);
};
