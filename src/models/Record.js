const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const { recordTypes } = require('../constants');

const RecordSchema = new mongoose.Schema({
  description: String,
  amount: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
    required: true,
  },
  type: {
    type: String,
    enum: recordTypes,
    required: true,
  },
  categoryId: {
    type: Number,
    ref: 'Category',
    required: true,
  },
  userId: {
    type: Number,
    ref: 'User',
    required: true,
  },
});

RecordSchema.plugin(AutoIncrement, { inc_field: 'id', id: 'RecordSchema' });

module.exports = mongoose.model('Record', RecordSchema);
