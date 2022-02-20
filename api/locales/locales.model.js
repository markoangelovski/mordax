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
        required: true,
        unique: true
      }
    },
    fields: [stringProps],
    thirdParties: [stringProps],
    SC: {
      scButtonKey: objProps,
      scCarouselKey: objProps,
      scEcEndpointKey: objProps
    },
    BINLite: {
      BINLiteKey: objProps
    },
    PS: {
      psType: {
        ...objProps,
        value: {
          type: String,
          enum: ["embedded", "lightbox"]
        }
      },
      psKey: objProps
    },
    privacy: {
      // TODO: dodaj i privacy da se šalje
      type: {
        ...objProps,
        value: {
          type: String,
          enum: ["GDPR", "CCPA", "LGPD", "AMA"]
        }
      },
      overlayId: objProps
    },
    capitol: objProps
  },
  { timestamps: true }
);

module.exports = mongoose.model("Locale", localeSchema);
