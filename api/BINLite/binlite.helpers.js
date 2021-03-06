const axios = require("axios").default;

const { BINLiteUrl } = require("./binlite.config.json");

exports.getSellerData = async (binliteId, BINLiteKey) => {
  let matches = [],
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
      console.warn(
        "Error occurred while fetching BINLite data for single product, "
      ),
      binliteId,
      error.status,
      error.message,
      error.config.url
    );
    status = error.status;
    message = error.message;
  }

  return {
    binliteId,
    sellersOk,
    matches: matches?.map(match => ({
      buyNowUrl: match.BuyNowUrl,
      retailerName: match.RetailerName
    })),
    status,
    message
  };
};
