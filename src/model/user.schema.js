const mongoose = require('mongoose');
const { isEmail, isStrongPassword } = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      min: [3, "Name should be at least 3 characters long"],
      max: [20, "Name cannot be longer than 20 characters"]
    },
    email: {
      type: String,
      required: [true, "Email required"],
      unique: true,
      validate: [isEmail, "Invalid email"]
    },
    role: {
  type: String,
  enum: ["superadmin", "user"],
  default: "user"
},
    password: {
      type: String,
      validate: [isStrongPassword, "Please enter a strong password"],
      select: false
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "organization",
      default: null // important
    },
    status: {
      type: String,
      default: 'offline'
    },
    profilePicture: {
      type: String,
    },
    workLocation: {
      type: String,
      trim: true,
      default: "",
      maxlength: [100, "Work location cannot exceed 100 characters"],
    },
    statusMessage: {
      type: String,
      trim: true,
      default: "",
      maxlength: [160, "Status message cannot exceed 160 characters"],
    },
    jobTitle: {
      type: String,
      trim: true,
      default: "",
    },
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
     birthday: {
      type: Date,
      required: false, // optional
      validate: {
        validator: (value) => {
          return value <= new Date(); // ensure it's not a future date
        },
        message: "Birthday cannot be in the future",
      },
    },
     isActive: {
      type: Boolean,
      default: true, // user starts as active
    },
    isDeleted: {
      type: Boolean,
      default: false, // for soft delete
    },

    resetPasswordToken: String,
    resetPasswordExpire: Date
  },
  { timestamps: true }
);

// 🔐 Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const User = mongoose.model("user", userSchema);
module.exports = User;
