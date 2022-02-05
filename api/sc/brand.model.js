const mongoose = require("mongoose");

const stringProps = {
  required: true,
  type: String,
  minlength: 1,
  maxlength: 256
};

const skuListProps = {
  value: stringProps,
  history: [
    {
      previousValue: stringProps,
      updatedValue: stringProps,
      creationDate: Date,
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
        ]
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Brand", brandSchema);
