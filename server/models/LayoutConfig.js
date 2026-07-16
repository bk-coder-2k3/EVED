const mongoose = require('mongoose');

const layoutConfigSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  columns: { type: Number, required: true, default: 3 },
  rows: { type: Number, required: true, default: 10 },
  marginLeft: { type: Number, required: true, default: 60 },
  marginTop: { type: Number, required: true, default: 250 },
  cardWidth: { type: Number, required: true, default: 780 },
  cardHeight: { type: Number, required: true, default: 300 },
  spacingX: { type: Number, required: true, default: 10 },
  spacingY: { type: Number, required: true, default: 10 },
  photoBox: {
    xOffsetPercent: { type: Number, required: true, default: 70 }, // % from left of card
    yOffsetPercent: { type: Number, required: true, default: 15 }, // % from top of card
    widthPercent: { type: Number, required: true, default: 28 }, // % of card width
    heightPercent: { type: Number, required: true, default: 80 } // % of card height
  },
  isDefault: { type: Boolean, default: false }
}, {
  timestamps: true
});

module.exports = mongoose.model('LayoutConfig', layoutConfigSchema);
