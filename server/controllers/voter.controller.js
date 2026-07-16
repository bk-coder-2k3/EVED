const Voter = require('../models/Voter');

exports.getVoters = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Filters
    const query = {};
    if (req.query.name) query.name = new RegExp(req.query.name, 'i');
    if (req.query.epicNumber) query.epicNumber = new RegExp(req.query.epicNumber, 'i');
    if (req.query.houseNumber) query.houseNumber = new RegExp(req.query.houseNumber, 'i');
    if (req.query.gender) query.gender = req.query.gender;

    // Sorting
    const sort = {};
    if (req.query.sortBy) {
      sort[req.query.sortBy] = req.query.order === 'desc' ? -1 : 1;
    } else {
      sort.serialNumber = 1; // Default
    }

    const voters = await Voter.find(query).sort(sort).skip(skip).limit(limit);
    const total = await Voter.countDocuments(query);

    res.status(200).json({
      data: voters,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getVoterById = async (req, res) => {
  try {
    const voter = await Voter.findById(req.params.id);
    if (!voter) return res.status(404).json({ error: 'Not found' });
    
    // Find adjacent voters by ID
    const nextVoter = await Voter.findOne({ _id: { $gt: voter._id } }).sort({ _id: 1 }).select('_id');
    const prevVoter = await Voter.findOne({ _id: { $lt: voter._id } }).sort({ _id: -1 }).select('_id');

    res.status(200).json({
      ...voter.toObject(),
      nextId: nextVoter ? nextVoter._id : null,
      prevId: prevVoter ? prevVoter._id : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateVoter = async (req, res) => {
  try {
    const updated = await Voter.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteVoter = async (req, res) => {
  try {
    await Voter.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
