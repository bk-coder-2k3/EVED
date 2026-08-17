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
      $or: [{ email: identifier }, { mobile: identifier }]
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
  const { email, mobile, password } = req.body;
  try {
    if (!password) {
      return res.status(400).json({ error: 'Password is required.' });
    }
    if (!email && !mobile) {
      return res.status(400).json({ error: 'Email or mobile is required.' });
    }

    const existing = await User.findOne({ $or: [{ email }, { mobile }] });
    if (existing) {
      return res.status(400).json({ error: 'User already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      email,
      mobile,
      password: hashedPassword,
      role: 'employee'
    });

    await newUser.save();
    res.status(201).json({ message: 'Employee created successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
