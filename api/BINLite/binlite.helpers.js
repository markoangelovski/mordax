const axios = require("axios").default;

const { BINLiteUrl } = require("../../config");

exports.getSellerData = async (binliteId, BINLiteKey) => {
  let matches,
    sellersOk = false,
    status,
    message;

  try {
    const { data } = await axios(
      BINLiteUrl.replace("{{binliteUpc}}", binliteId),
      {
        headers: {
          passkey: BINLiteKey,
          "x-functions-key": process.env.X_FUNCTIONS_KEY,
          "Ocp-Apim-Subscription-Key": process.env.OCP_APIM_SUBSCRIPTION_KEY
        }
      }
    );

    matches = data;
    sellersOk = true;
  } catch (error) {
    error = error.isAxiosError ? error.toJSON() : error;
    console.warn(
      "Error occurred while fetching BINLite data for single product, ",
      error
    );
    status = error.status;
    message = error.message;
  }

  return {
    binliteId,
    sellersOk,
    matches: matches.map(match => {
      delete match.Retailerlogo;
      return match;
    }),
    status,
    message
  };
};
