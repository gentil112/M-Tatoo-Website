const mongoose = require('mongoose')

const bookingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    style: {
      type: String,
      enum: ['Fine line', 'Blackwork', 'Botanical', 'Custom work', 'Not sure yet'],
      default: 'Not sure yet',
    },
    placement: {
      type: String,
      trim: true,
      maxlength: 120,
      default: '',
    },
    idea: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },
    status: {
      type: String,
      enum: ['new', 'contacted', 'confirmed', 'cancelled'],
      default: 'new',
    },
  },
  { timestamps: true },
)

module.exports = mongoose.model('Booking', bookingSchema)
