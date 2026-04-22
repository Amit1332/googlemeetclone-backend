const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    chatName: { type: String, trim: true },
    organization: {
       type: mongoose.Schema.Types.ObjectId,
        ref: "organization",
        default: null, // 🔥 important
     },
    isGroupChat: { type: Boolean, default: false },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
    latestMessage: { type: mongoose.Schema.Types.ObjectId, ref: "message" },
    groupAdmin: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    groupPicture: {
        type: String,
    }
}, { timestamps: true });

const chatModel = new mongoose.model('chat', Schema);
module.exports = chatModel;
