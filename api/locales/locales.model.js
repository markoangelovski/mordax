const mongoose = require("mongoose");

const stringProps = {
  type: String,
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

const localeSchema = new mongoose.Schema(
  {
    createdBy: {
      ...stringProps,
      required: true
    },
    brand: {
      ...objProps,
      value: {
        ...stringProps,
        required: true
      }
    },
    locale: {
      ...objProps,
      value: {
        ...stringProps,
        required: true
      }
    },
    url: {
      ...objProps,
      value: {
        ...stringProps,
        required: true
      }
    },
    fields: [stringProps],
    scButtonKey: objProps,
    scCarouselKey: objProps,
    scEcEndpointKey: objProps,
    BINLiteKey: objProps,
    PSKey: objProps,
    capitol: objProps
  },
  { timestamps: true }
);

module.exports = mongoose.model("Locale", localeSchema);