const mongoose = require('mongoose')
const { isEmail, isStrongPassword } = require('validator')
const bcrypt  = require('bcryptjs')

const Schema  = new mongoose.Schema(
    {
        sender:   { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
       content: {
       message: { type: String, default: "" },
      files: [
        {
          url: { type: String, required: true },
          fileName: { type: String },
          type: { type: String }, 
        }
      ]
    },
        chat:     { type: mongoose.Schema.Types.ObjectId, ref: "chat", required: true },
        seenBy:   [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }] // for read receipts
      },
      { timestamps: true }
)




const messageModel = new mongoose.model("message", Schema)
module.exports = messageModel