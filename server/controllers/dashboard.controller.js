const PDFJob = require('../models/PDFJob');
const Voter = require('../models/Voter');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

exports.getDashboardStats = async (req, res) => {
  try {
    // 1. PDF Metrics
    const totalPDFs = await PDFJob.countDocuments();
    const completedPDFs = await PDFJob.countDocuments({ status: 'completed' });
    const failedPDFs = await PDFJob.countDocuments({ status: 'failed' });
    const processingPDFs = await PDFJob.countDocuments({ status: 'processing' });
    
    const jobs = await PDFJob.find();
    let totalPages = 0;
    jobs.forEach(job => totalPages += job.totalPages);

    // 2. Voter & Survey Metrics
    const totalVoters = await Voter.countDocuments();
    const completedSurveys = await Voter.countDocuments({ surveyStatus: 'Completed' });
    
    // 3. Employee Metrics
    const totalEmployees = await User.countDocuments({ role: 'employee' });

    // 4. Hierarchy Progress (Zonals, Taluks, Villages)
    // We group voters by their location reference to count unique regions
    const hierarchyAgg = await Voter.aggregate([
      {
        $lookup: {
          from: 'locations',
          localField: 'locationId',
          foreignField: '_id',
          as: 'location'
        }
      },
      { $unwind: '$location' },
      {
        $group: {
          _id: null,
          uniqueZonals: { $addToSet: '$location.zonal' },
          uniqueTaluks: { $addToSet: '$location.taluk' },
          uniqueVillages: { $addToSet: '$location.village' }
        }
      }
    ]);

    const hierarchy = hierarchyAgg.length > 0 ? {
      zonals: hierarchyAgg[0].uniqueZonals.length,
      taluks: hierarchyAgg[0].uniqueTaluks.length,
      villages: hierarchyAgg[0].uniqueVillages.length
    } : { zonals: 0, taluks: 0, villages: 0 };

    // 5. Recent Activity Feed
    // Get recent PDF completed/failed jobs
    const recentPDFJobs = await PDFJob.find({ status: { $in: ['completed', 'failed'] } })
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean();

    // Get recently completed surveys
    const recentSurveys = await Voter.find({ surveyStatus: 'Completed' })
      .sort({ surveyedAt: -1 })
      .limit(5)
      .lean();

    // Transform and combine into a unified activity feed
    let recentActivity = [];

    recentPDFJobs.forEach(job => {
      recentActivity.push({
        id: `job_${job._id}`,
        type: job.status === 'completed' ? 'pdf_completed' : 'pdf_failed',
        title: job.status === 'completed' ? 'PDF Extraction completed' : 'Extraction error',
        details: job.status === 'completed' ? `for ${job.originalName || 'file'}.` : `on ${job.originalName || 'file'}.`,
        timestamp: job.updatedAt,
        source: 'System'
      });
    });

    recentSurveys.forEach(survey => {
      recentActivity.push({
        id: `survey_${survey._id}`,
        type: 'survey_completed',
        title: 'Survey completed',
        details: `for voter ${survey.name}.`,
        timestamp: survey.surveyedAt || survey.updatedAt,
        source: 'Field Agent'
      });
    });

    // Sort by timestamp desc and take top 10
    recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    recentActivity = recentActivity.slice(0, 10);

    res.status(200).json({
      totalPDFs,
      completedPDFs,
      failedPDFs,
      processingPDFs,
      totalPages,
      totalVoters,
      completedSurveys,
      totalEmployees,
      hierarchy,
      recentActivity
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getJobs = async (req, res) => {
  try {
    const jobs = await PDFJob.find().sort({ createdAt: -1 });
    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteJob = async (req, res) => {
  try {
    const job = await PDFJob.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Not found' });
    
    // Delete associated voters
    await Voter.deleteMany({ pdfName: job.pdfName });
    await PDFJob.findByIdAndDelete(req.params.id);

    // Delete associated physical files
    try {
      const pdfPath = path.join(__dirname, '../uploads/pdf', job.pdfName);
      if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
      
      const pagesDir = path.join(__dirname, `../uploads/pages/${job.pdfName}_pages`);
      if (fs.existsSync(pagesDir)) fs.rmSync(pagesDir, { recursive: true, force: true });
      
      const cardsBaseDir = path.join(__dirname, '../uploads/cards');
      if (fs.existsSync(cardsBaseDir)) {
        const folders = fs.readdirSync(cardsBaseDir);
        folders.forEach(f => {
          if (f.startsWith(`${job.pdfName}_page`)) {
            fs.rmSync(path.join(cardsBaseDir, f), { recursive: true, force: true });
          }
        });
      }

      const photosBaseDir = path.join(__dirname, '../uploads/photos');
      if (fs.existsSync(photosBaseDir)) {
        const folders = fs.readdirSync(photosBaseDir);
        folders.forEach(f => {
          if (f.startsWith(`${job.pdfName}_page`)) {
            fs.rmSync(path.join(photosBaseDir, f), { recursive: true, force: true });
          }
        });
      }
    } catch (fsError) {
      console.error('Error cleaning up files for deleted job:', fsError);
    }

    res.status(200).json({ message: 'Deleted job, associated voters, and files' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
