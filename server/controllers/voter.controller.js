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
    if (req.query.houseNumber) query.houseNumber = new RegExp(req.query.houseNumber, 'i');
    if (req.query.gender) query.gender = req.query.gender;
    if (req.query.status === 'assigned') query.locationId = { $ne: null };
    if (req.query.status === 'unassigned') query.locationId = null;

    // Sorting
    const sort = {};
    if (req.query.sortBy) {
      sort[req.query.sortBy] = req.query.order === 'desc' ? -1 : 1;
    } else {
      sort.serialNumber = 1; // Default
    }

    const voters = await Voter.find(query).populate('locationId', 'village').sort(sort).skip(skip).limit(limit);
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

exports.assignLocation = async (req, res) => {
  try {
    const { voterIds, locationId } = req.body;
    if (!voterIds || !Array.isArray(voterIds) || voterIds.length === 0) {
      return res.status(400).json({ error: 'Please provide an array of voter IDs.' });
    }
    if (!locationId) {
      return res.status(400).json({ error: 'Please provide a location ID.' });
    }

    const result = await Voter.updateMany(
      { _id: { $in: voterIds } },
      { $set: { locationId } }
    );

    res.status(200).json({ message: `Successfully assigned location to ${result.modifiedCount} voters.`, modifiedCount: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- Employee Specific APIs ---

exports.getAssignedVoters = async (req, res) => {
  try {
    const User = require('../models/User');
    const employee = await User.findById(req.user._id);
    
    if (!employee || !employee.assignedVillages || employee.assignedVillages.length === 0) {
      return res.status(200).json([]);
    }

    // Voters in their villages that are either unsurveyed OR surveyed by this employee
    const query = {
      locationId: { $in: employee.assignedVillages },
      $or: [
        { surveyedBy: null },
        { surveyedBy: employee._id }
      ]
    };

    const voters = await Voter.find(query).sort({ serialNumber: 1 });
    res.status(200).json(voters);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getFamilyCandidates = async (req, res) => {
  try {
    const { voterId } = req.query;
    if (!voterId) return res.status(400).json({ error: 'voterId is required' });

    const targetVoter = await Voter.findById(voterId);
    if (!targetVoter || !targetVoter.houseNumber) {
      return res.status(200).json([]);
    }

    // Find other voters in same village with same house number
    const candidates = await Voter.find({
      _id: { $ne: targetVoter._id },
      locationId: targetVoter.locationId,
      houseNumber: targetVoter.houseNumber
    }).select('_id name epicNumber age gender relationName relationType');

    res.status(200).json(candidates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.searchByEpic = async (req, res) => {
  try {
    const { epicNumber } = req.params;
    if (!epicNumber) return res.status(400).json({ error: 'epicNumber is required' });

    const voter = await Voter.findOne({ epicNumber: new RegExp(`^${epicNumber}$`, 'i') })
                             .select('_id name epicNumber age gender relationName relationType');
    
    if (!voter) {
      return res.status(404).json({ error: 'Voter not found with this EPIC number.' });
    }

    res.status(200).json(voter);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.saveSurvey = async (req, res) => {
  try {
    const { id } = req.params;
    
    const surveyData = {
      // Personal Details Editable by Employee
      name: req.body.name,
      epicNumber: req.body.epicNumber,
      relationName: req.body.relationName,
      relationType: req.body.relationType,
      houseNumber: req.body.houseNumber,
      age: req.body.age ? Number(req.body.age) : undefined,
      gender: req.body.gender,

      // Survey Fields
      phoneNumber: req.body.phoneNumber,
      alternatePhoneNumber: req.body.alternatePhoneNumber,
      currentLocation: req.body.currentLocation,
      outOfVillageSpecify: req.body.outOfVillageSpecify,
      possibility: req.body.possibility,
      prevP: req.body.prevP,
      dd: req.body.dd,
      religion: req.body.religion,
      caste: req.body.caste,
      surveyStatus: req.body.surveyStatus || 'Pending',
      familyMemberIds: req.body.familyMemberIds, // array of ObjectIds
      
      surveyedBy: req.user._id,
      surveyedAt: req.body.surveyStatus === 'Completed' ? new Date() : null
    };

    const updated = await Voter.findByIdAndUpdate(
      id,
      { $set: surveyData },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: 'Voter not found' });

    res.status(200).json({ message: 'Survey saved successfully', voter: updated });
  } catch (error) {
    console.error('Save Survey Error:', error);
    res.status(500).json({ error: error.message });
  }
};
