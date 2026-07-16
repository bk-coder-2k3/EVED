const PDFJob = require('../models/PDFJob');
const Voter = require('../models/Voter');

exports.getDashboardStats = async (req, res) => {
  try {
    const totalPDFs = await PDFJob.countDocuments();
    const completedPDFs = await PDFJob.countDocuments({ status: 'completed' });
    const failedPDFs = await PDFJob.countDocuments({ status: 'failed' });
    const processingPDFs = await PDFJob.countDocuments({ status: 'processing' });
    
    const jobs = await PDFJob.find();
    let totalPages = 0;
    jobs.forEach(job => totalPages += job.totalPages);

    const totalVoters = await Voter.countDocuments();

    res.status(200).json({
      totalPDFs,
      completedPDFs,
      failedPDFs,
      processingPDFs,
      totalPages,
      totalVoters
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
    
    // Also delete associated voters
    await Voter.deleteMany({ pdfName: job.pdfName });
    await PDFJob.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Deleted job and associated voters' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
