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

localeSchema.pre("save", function (next) {
  // Remove all empty fields before saving
  if (!this.SC?.scButtonKey?.value) this.SC.scButtonKey = undefined;
  if (!this.SC?.scCarouselKey?.value) this.SC.scCarouselKey = undefined;
  if (!this.SC?.scEcEndpointKey?.value) this.SC.scEcEndpointKey = undefined;
  if (!this.BINLite.BINLiteKey?.value) this.BINLite.BINLiteKey = undefined;
  if (!this.PS.psType?.value) this.PS.psType = undefined;
  if (!this.PS.psKey?.value) this.PS.psKey = undefined;
  if (!this.capitol?.value) this.capitol = undefined;
  next();
});

module.exports = mongoose.model("Locale", localeSchema);
