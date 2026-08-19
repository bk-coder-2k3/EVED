const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  const { identifier, password } = req.body; // identifier can be email or mobile
  try {
    // Check if identifier is provided
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Identifier and password are required.' });
    }

    const user = await User.findOne({
      $or: [{ email: identifier }, { mobile: identifier }, { employeeId: identifier }]
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret_for_dev',
      { expiresIn: '12h' }
    );

    res.json({ token, role: user.role });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createEmployee = async (req, res) => {
  const { name, dateOfBirth, age, email, mobile, password } = req.body;
  try {
    if (!password) {
      return res.status(400).json({ error: 'Password is required.' });
    }
    if (!email && !mobile) {
      return res.status(400).json({ error: 'Email or mobile is required.' });
    }

    const existing = await User.findOne({ $or: [{ email: email || null }, { mobile: mobile || null }] });
    if (existing) {
      return res.status(400).json({ error: 'User already exists with this email or mobile.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Generate a unique 6-digit employee ID
    const employeeId = 'EMP-' + Math.floor(100000 + Math.random() * 900000);

    const newUser = new User({
      employeeId,
      name,
      dateOfBirth,
      age,
      email: email || undefined,
      mobile: mobile || undefined,
      password: hashedPassword,
      role: 'employee'
    });

    await newUser.save();
    res.status(201).json({ message: 'Employee created successfully.', employee: newUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getEmployees = async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' }).select('-password').sort({ createdAt: -1 });
    res.json(employees);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateEmployee = async (req, res) => {
  const { id } = req.params;
  const { name, dateOfBirth, age, email, mobile, password } = req.body;
  try {
    const user = await User.findById(id);
    if (!user || user.role !== 'employee') {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing) return res.status(400).json({ error: 'Email already in use.' });
      user.email = email;
    }
    
    if (mobile && mobile !== user.mobile) {
      const existing = await User.findOne({ mobile });
      if (existing) return res.status(400).json({ error: 'Mobile already in use.' });
      user.mobile = mobile;
    }

    if (name) user.name = name;
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;
    if (age) user.age = age;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();
    res.json({ message: 'Employee updated successfully.', employee: user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteEmployee = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ error: 'Employee not found.' });
    }
    res.json({ message: 'Employee deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.assignVillages = async (req, res) => {
  const { id } = req.params;
  const { assignedVillages } = req.body;
  try {
    if (!Array.isArray(assignedVillages)) {
      return res.status(400).json({ error: 'assignedVillages must be an array of Location IDs.' });
    }
    
    const user = await User.findByIdAndUpdate(
      id,
      { assignedVillages },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'Employee not found.' });
    }
    
    res.json({ message: 'Villages assigned successfully.', employee: user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateMe = async (req, res) => {
  const { name, email, mobile, password } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing) return res.status(400).json({ error: 'Email already in use.' });
      user.email = email;
    }
    
    if (mobile && mobile !== user.mobile) {
      const existing = await User.findOne({ mobile });
      if (existing) return res.status(400).json({ error: 'Mobile already in use.' });
      user.mobile = mobile;
    }

    if (name) user.name = name;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();
    const updatedUser = await User.findById(req.user._id).select('-password');
    res.json({ message: 'Profile updated successfully.', user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
