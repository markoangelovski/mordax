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
    data: {}
  },
  { timestamps: true }
);

module.exports = mongoose.model("Page", pageSchema);
