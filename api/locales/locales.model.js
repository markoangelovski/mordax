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
    stats: {}, // Contains the stats for pages, such as a number of entries, unique pages, pages not in sitemap, etc.
    fields: [stringProps],
    thirdParties: [stringProps],
    xmlSitemap: stringProps,
    capitol: objProps,
    SC: {
      scLocale: {
        ...objProps,
        value: {
          ...stringProps,
          enum: ["US", "EU"],
          default: "US",
          required: true
        }
      },
      scButtonKey: objProps,
      scCarouselKey: objProps,
      scEcEndpointKey: objProps
    },
    BINLite: {
      BINLiteKey: objProps
    },
    PS: {
      psAccountId: objProps,
      psCid: objProps,
      psInstances: [String],
      psCountries: [String],
      psLanguages: [String]
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
    }
  },
  { timestamps: true }
);

localeSchema.pre("save", function (next) {
  // Remove all empty fields before saving
  if (!this.SC?.scButtonKey?.value) this.SC.scButtonKey = undefined;
  if (!this.SC?.scCarouselKey?.value) this.SC.scCarouselKey = undefined;
  if (!this.SC?.scEcEndpointKey?.value) this.SC.scEcEndpointKey = undefined;
  if (!this.BINLite.BINLiteKey?.value) this.BINLite.BINLiteKey = undefined;
  if (!this.PS.psAccountId?.value) this.PS.psAccountId = undefined;
  if (!this.PS.psCid?.value) this.PS.psCid = undefined;
  if (!this.capitol?.value) this.capitol = undefined;
  next();
});

module.exports = mongoose.model("Locale", localeSchema);
