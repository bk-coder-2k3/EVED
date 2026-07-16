const LayoutConfig = require('../models/LayoutConfig');

exports.getTemplates = async (req, res) => {
  try {
    const templates = await LayoutConfig.find();
    res.status(200).json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.saveTemplate = async (req, res) => {
  try {
    // If setting as default, unset others
    if (req.body.isDefault) {
      await LayoutConfig.updateMany({}, { isDefault: false });
    }

    if (req.body._id) {
      const updated = await LayoutConfig.findByIdAndUpdate(req.body._id, req.body, { new: true });
      return res.status(200).json(updated);
    } else {
      const newLayout = new LayoutConfig(req.body);
      await newLayout.save();
      return res.status(201).json(newLayout);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
