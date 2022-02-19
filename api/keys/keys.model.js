const mongoose = require("mongoose");

const stringProps = {
  type: String,
  minlength: 1,
  maxlength: 64
};

const keySchema = new mongoose.Schema(
  {
    key: stringProps,
    issuer: stringProps,
    issuedFor: { ...stringProps, default: "General viewing" },
    active: { type: Boolean, default: true },
    deactivationDate: Date,
    deactivationIssuer: stringProps,
    roles: [
      {
        type: String,
        enum: require("../../config/userRoles.json").allRoles,
        default: "user"
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Key", keySchema);
