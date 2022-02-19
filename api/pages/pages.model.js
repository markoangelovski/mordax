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
    data: {},
    SC: {
      ok: Boolean,
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
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Page", pageSchema);
