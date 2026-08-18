const Location = require('../models/Location');

// Get distinct zonals
exports.getZonals = async (req, res) => {
  try {
    const zonals = await Location.distinct('zonal');
    res.json(zonals.sort());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get distinct taluks for a zonal
exports.getTaluks = async (req, res) => {
  const { zonal } = req.query;
  try {
    const filter = zonal ? { zonal } : {};
    const taluks = await Location.distinct('taluk', filter);
    res.json(taluks.sort());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get distinct grams for a taluk
exports.getGrams = async (req, res) => {
  const { taluk } = req.query;
  try {
    const filter = taluk ? { taluk } : {};
    const grams = await Location.distinct('gram', filter);
    res.json(grams.sort());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get distinct booths for a gram
exports.getBooths = async (req, res) => {
  const { gram } = req.query;
  try {
    const filter = gram ? { gram } : {};
    const booths = await Location.distinct('booth', filter);
    res.json(booths.sort());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get villages for a booth
exports.getVillages = async (req, res) => {
  const { booth } = req.query;
  try {
    const filter = booth ? { booth } : {};
    // Return the actual location objects so we can get the locationId
    const villages = await Location.find(filter).select('_id village').sort({ village: 1 });
    res.json(villages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Fetch all locations (for the table)
exports.getAllLocations = async (req, res) => {
  try {
    const locations = await Location.find().sort({ zonal: 1, taluk: 1, gram: 1, booth: 1, village: 1 });
    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a single location
exports.createLocation = async (req, res) => {
  try {
    const location = new Location(req.body);
    await location.save();
    res.status(201).json(location);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'This exact location already exists.' });
    }
    res.status(500).json({ error: error.message });
  }
};

// Bulk create locations (from CSV/JSON)
exports.bulkCreateLocations = async (req, res) => {
  try {
    const { locations } = req.body;
    if (!Array.isArray(locations) || locations.length === 0) {
      return res.status(400).json({ error: 'Please provide an array of locations.' });
    }
    
    // Use unordered insert so duplicates are skipped but valid ones are inserted
    const result = await Location.insertMany(locations, { ordered: false }).catch(err => {
      // If it's a bulk write error (code 11000), some might have succeeded
      if (err.name === 'BulkWriteError' && err.code === 11000) {
         return { 
           insertedCount: err.insertedDocs.length, 
           duplicateCount: err.writeErrors.length 
         };
      }
      throw err;
    });

    const count = result.insertedCount !== undefined ? result.insertedCount : result.length;
    const dups = result.duplicateCount || 0;
    
    res.status(201).json({ message: `Successfully inserted ${count} locations. Skipped ${dups} duplicates.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
