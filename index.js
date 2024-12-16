const express = require('express');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { prisma } = require('./db/config');


dotenv.config();
const app = express();
app.use(express.json());

// Validation schemas using Joi


// Signup Endpoint
app.post('/api/auth/signup', async (req, res) => {
  const { error } = signupSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { name, email, password } = req.body;

  try {
    const existingUser = await prisma.users.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.users.create({
      data: { name, email, password: hashedPassword }
    });

    return res.status(201).json({
      message: 'User created successfully',
      userId: newUser.id
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Login Endpoint
app.post('/api/auth/login', async (req, res) => {
  const { error } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { email, password } = req.body;

  try {
    const existingUser = await prisma.users.findUnique({ where: { email } });
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isPasswordCorrect = await bcrypt.compare(password, existingUser.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.status(200).json({
      userdata: {
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email
      },
      accesstoken: token
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Server Initialization
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend server is running at http://localhost:${PORT}`);
});

module.exports = app;
