const mongoose = require("mongoose");

const stringProps = {
  type: String,
  minlength: 1,
  maxlength: 256
};

const skuListProps = {
  value: stringProps,
  creationDate: Date,
  history: [
    {
      previousValue: stringProps,
      updatedValue: stringProps,
      updateDate: Date
    }
  ]
};

const brandSchema = new mongoose.Schema(
  {
    createdBy: {
      required: true,
      type: String
    },
    brand: stringProps,
    locale: stringProps,
    url: stringProps,
    scButtonKey: String,
    scCarouselKey: String,
    skuList: [
      {
        title: skuListProps,
        url: skuListProps,
        sku: skuListProps,
        scTitle: skuListProps,
        scMpId: skuListProps,
        scApiId: skuListProps,
        buttonSellers: [
          {
            name: stringProps,
            logo: stringProps,
            url: stringProps
          }
        ],
        carouselSellers: [
          {
            name: stringProps,
            logo: stringProps,
            url: stringProps
          }
        ]
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Brand", brandSchema);
