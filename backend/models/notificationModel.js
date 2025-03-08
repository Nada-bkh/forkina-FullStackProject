// models/notificationModel.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    text:   { type: String, required: true },
    date:   { type: Date, default: Date.now },
    isSeen: { type: Boolean, default: false },
    userRef: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
