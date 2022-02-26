const mongoose = require("mongoose");

const pageSchema = new mongoose.Schema(
  {
    locale: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Locale",
      required: true
    },
    localeUrl: {
      type: String,
      maxlength: 2048,
      required: true
    },
    url: {
      type: String,
      maxlength: 2048,
      required: true
    },
    type: {
      type: String,
      max: 256
    },
    source: {
      type: String,
      enum: ["feed", "single"]
    },
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
          BuyNowUrl: { type: String, maxlength: 2048 },
          RetailerName: { type: String, max: 256 },
          Retailerlogo: { type: String }
        }
      ]
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Page", pageSchema);
