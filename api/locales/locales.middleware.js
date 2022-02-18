const { ERROR_INVALID_INPUT } = require("../../lib/errorCodes.json");
const { urlRgx } = require("../../lib/regex");

// Input validation
exports.locMw = (req, res, next) => {
  try {
    const { query } = req;
    const errObj = {
      errors: [],
      fetch() {},
      add(err) {
        this.errors.push(err);
      }
    };

    let url;
    Object.keys(query).forEach(queryKey => {
      const element = query[queryKey];

      const isUrl = queryKey === "url";
      if (isUrl && urlRgx.test(element)) {
        url = element;
      } else if (isUrl && !urlRgx.test(element)) {
        url = true;
        errObj.add({
          message: "Provided Parameter is malformed.",
          parameter: queryKey,
          value: element,
          required: "Valid URL string.",
          statusCode: ERROR_INVALID_INPUT.statusCode,
          code: ERROR_INVALID_INPUT.code
        });
      }
    });

    if (!url) {
      res.status(422);
      return next({
        ...ERROR_INVALID_INPUT,
        message: "URL is required."
      });
    }

    if (errObj.errors.length) {
      res.status(422);
      return next(errObj.errors);
    }
    next();
  } catch (error) {
    console.log("error occurred", error);
    next({
      message: error.message
    });
  }
};
