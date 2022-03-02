const mongoose = require("mongoose");

const pageSchema = new mongoose.Schema(
  {
    locale: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Locale",
      required: true
    },
    localeUrl: { type: String, maxlength: 2048, required: true },
    url: { type: String, maxlength: 2048, required: true },
    source: { type: String, enum: ["feed", "single"] },
    type: { type: String, max: 256 },
    SKU: { type: String, max: 256 },
    inXmlSitemap: Boolean,
    data: {},
    SC: {
      ok: Boolean,
      lastScan: Date,
      matches: [
        {
          productName: { type: String, max: 256 },
          retailerName: { type: String, max: 256 },
          url: { type: String, maxlength: 2048 },
          price: { type: String, max: 256 },
          logo: { type: String, maxlength: 2048 },
          miniLogo: { type: String, maxlength: 2048 }
        }
      ]
    },
    BINLite: {
      ok: Boolean,
      lastScan: Date,
      matches: [
        {
          buyNowUrl: { type: String, maxlength: 2048 },
          retailerName: { type: String, max: 256 }
        }
      ]
    },
    PS: {
      ok: Boolean,
      lastScan: Date,
      matches: [
        {
          pmid: { type: String, maxlength: 64 },
          sid: { type: String, maxlength: 64 },
          retailerName: { type: String, max: 256 },
          price: { type: String, maxlength: 64 }
        }
      ],
      offlineMatches: []
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Page", pageSchema);
