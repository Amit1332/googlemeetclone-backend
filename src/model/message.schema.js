const mongoose = require("mongoose");
const { isEmail, isStrongPassword } = require("validator");
const bcrypt = require("bcryptjs");

const reactionSchema = new mongoose.Schema(
  {
    emoji: {
      type: String,
      required: true,
      trim: true,
    },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
  },
  { _id: false }
);

const Schema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    content: {
      message: { type: String, default: "" },
      files: [
        {
          url: { type: String, required: true },
          fileName: { type: String },
          type: { type: String },
          public_id: { type: String },
        },
      ],
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "message",
      default: null,
    },
    chat: { type: mongoose.Schema.Types.ObjectId, ref: "chat", required: true },
    broadcastSource: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "project",
      default: null,
    },
    seenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
    reactions: [reactionSchema],
  },
  { timestamps: true }
);

const messageModel = new mongoose.model("message", Schema);
module.exports = messageModel;
