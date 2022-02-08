const mongoose = require("mongoose");

const stringProps = {
  type: String,
  minlength: 1,
  maxlength: 256
};

const objProps = {
  value: stringProps,
  createdAt: Date,
  history: [
    {
      previousValue: stringProps,
      updatedValue: stringProps,
      updatedAt: Date,
      updatedBy: stringProps
    }
  ]
};

const brandSchema = new mongoose.Schema(
  {
    createdBy: {
      required: true,
      type: String
    },
    brand: objProps,
    locale: objProps,
    url: objProps,
    scButtonKey: String,
    scCarouselKey: String,
    skuList: [
      {
        title: objProps,
        url: objProps,
        sku: objProps,
        scTitle: objProps,
        scMpId: objProps,
        scApiId: objProps,
        buttonSellers: [
          {
            retailerName: stringProps,
            productName: stringProps,
            url: stringProps,
            price: stringProps
          }
        ],
        carouselSellersOk: {
          type: Boolean
        },
        carouselSellers: [
          {
            retailerName: stringProps,
            productName: stringProps,
            url: stringProps,
            price: stringProps
          }
        ]
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Brand", brandSchema);
