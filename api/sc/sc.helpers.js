const axios = require("axios");

const { scCarouselUrl } = require("../../config");

exports.getSellerData = async (scCarouselKey, scMpId) => {
  let carouselData,
    sellersOk = false;

  try {
    carouselData = await axios(
      scCarouselUrl
        .replace("{{scCarouselKey}}", scCarouselKey)
        .replace("{{scMpId}}", scMpId)
    );
    sellersOk = true;
  } catch (error) {
    error = error.isAxiosError ? error.toJSON() : error;
    console.warn(
      "Error occurred fetching SC Carousel data for scMpId: ",
      scMpId,
      error
    );
    console.warn(error.message);
  }

  const master_product_id = carouselData
    ? carouselData.data.included.products.find(product => product.id === scMpId)
        .attributes.master_product_id
    : "";

  const matches = carouselData
    ? carouselData.data.included["product-retailers"]
        .filter(
          retailer =>
            retailer.relationships["master-product"].data.id ===
            master_product_id.toString()
        )
        .map(retailer => ({
          productName: retailer.attributes.name,
          retailerName: retailer.attributes["action-attributes"].filter(
            item => {
              if (item.attribute === "data-action-retailer") {
                return item;
              }
            }
          )[0].values[0],
          url: retailer.attributes.link,
          price: retailer.attributes["price-string"]
        }))
    : [];

  const sellersInfo = carouselData
    ? carouselData.data.included.retailers?.map(retailer => ({
        name: retailer.attributes.name,
        url: retailer.attributes.url,
        logo: retailer.attributes.logo,
        miniLogo: retailer.attributes["mini-logo"]
      }))
    : [];

  return {
    sellersOk,
    matches: matches.map(match => ({
      productName: match.productName,
      retailerName: match.retailerName,
      url: match.url,
      price: match.price,
      logo: sellersInfo.filter(seller => seller.name === match.retailerName)[0]
        .logo,
      miniLogo: sellersInfo.filter(
        seller => seller.name === match.retailerName
      )[0].miniLogo
    })),
    sellersInfo
  };
};
