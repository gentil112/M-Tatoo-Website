const mongoose = require('mongoose')
const { randomUUID } = require('node:crypto')

const accountSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => randomUUID(),
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
    role: {
      type: String,
      enum: ['admin', 'user'],
      default: function () {
        return this._id === 'primary' ? 'admin' : 'user'
      },
    },
  },
  { timestamps: true },
)

module.exports = mongoose.model('Account', accountSchema, 'admins')
