const mongoose = require('mongoose')

const adminSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: 'primary',
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
      unique: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
  },
  { timestamps: true },
)

module.exports = mongoose.model('Admin', adminSchema)
