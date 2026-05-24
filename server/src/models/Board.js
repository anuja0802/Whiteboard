const mongoose = require('mongoose');

const PointSchema = new mongoose.Schema({
  x: { type: Number, required: true },
  y: { type: Number, required: true },
}, { _id: false });

const StrokeSchema = new mongoose.Schema({
  points: [PointSchema],
  color: { type: String, default: '#ffffff' },
  brushSize: { type: Number, default: 4 },
  tool: { type: String, default: 'pen' },
}, { _id: false });

const BoardSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true,
    uppercase: true,
  },
  strokes: {
    type: [StrokeSchema],
    default: [],
  },
  objects: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },
  lastActiveAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

BoardSchema.methods.getObjectsAsPlain = function() {
  const plain = {};
  this.objects.forEach((value, key) => {
    plain[key] = value;
  });
  return plain;
};

module.exports = mongoose.model('Board', BoardSchema);
