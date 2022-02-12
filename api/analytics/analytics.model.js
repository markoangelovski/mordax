const mongoose = require("mongoose");

const stringProps = {
  type: String,
  maxlength: 256
};

const endpoint = {
  endpoint: stringProps,
  method: stringProps,
  date: Date,
  ua: stringProps,
  browser: { name: stringProps, version: stringProps, major: stringProps },
  engine: { name: stringProps, version: stringProps },
  os: { name: stringProps, version: stringProps },
  device: { vendor: stringProps, model: stringProps, type: stringProps },
  cpu: { architecture: stringProps }
};

const analyticsSchema = new mongoose.Schema({
  key: stringProps,
  requests: [endpoint]
});

module.exports = mongoose.model("Analytics", analyticsSchema);
