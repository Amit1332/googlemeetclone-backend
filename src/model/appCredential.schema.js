const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const appCredentialSchema = new mongoose.Schema(
  {
    appName: {
      type: String,
      required: true,
      trim: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "organization",
      required: true,
    },
    clientId: {
      type: String,
      unique: true,
      required: true,
    },
    clientSecret: {
      type: String,
      required: true,
      select: false, // Don't return secret in queries by default
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Hash secret before saving
appCredentialSchema.pre("save", async function (next) {
  if (!this.isModified("clientSecret")) {
    return next();
  }
  this.clientSecret = await bcrypt.hash(this.clientSecret, 10);
  next();
});

// Method to verify secret
appCredentialSchema.methods.compareSecret = async function (plainSecret) {
  return await bcrypt.compare(plainSecret, this.clientSecret);
};

const AppCredential = mongoose.model("appCredential", appCredentialSchema);
module.exports = AppCredential;
