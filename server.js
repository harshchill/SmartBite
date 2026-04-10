const path = require('path');
const crypto = require('crypto');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smartbite';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    passwordHash: { type: String, required: true },
    passwordSalt: { type: String, required: true }
  },
  { timestamps: true }
);

const orderItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    items: { type: [orderItemSchema], default: [] },
    status: { type: String, enum: ['Pending', 'Delivered'], default: 'Pending' }
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);
const Order = mongoose.model('Order', orderSchema);

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, mobile, email, password } = req.body;

    if (!name || !mobile || !email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Account already exists with this email.' });
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);

    const user = await User.create({ name, mobile, email, passwordHash, passwordSalt: salt });

    res.status(201).json({
      message: 'Account created successfully.',
      user: { id: user._id, name: user.name, mobile: user.mobile, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create account.', error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const incomingHash = hashPassword(password, user.passwordSalt);
    if (incomingHash !== user.passwordHash) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    res.json({
      message: 'Login successful.',
      user: { id: user._id, name: user.name, mobile: user.mobile, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed.', error: error.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { userId, name, mobile, address, items } = req.body;

    if (!name || !mobile || !address || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Invalid order payload.' });
    }

    const order = await Order.create({ userId: userId || undefined, name, mobile, address, items, status: 'Pending' });

    res.status(201).json({
      message: 'Order placed successfully.',
      order: {
        id: order._id,
        userId: order.userId,
        name: order.name,
        mobile: order.mobile,
        address: order.address,
        items: order.items,
        status: order.status,
        date: order.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to place order.', error: error.message });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    const { userId } = req.query;
    const filter = userId ? { userId } : {};

    const orders = await Order.find(filter).sort({ createdAt: -1 }).lean();

    res.json(
      orders.map((order) => ({
        id: order._id,
        userId: order.userId,
        name: order.name,
        mobile: order.mobile,
        address: order.address,
        items: order.items,
        status: order.status,
        date: order.createdAt
      }))
    );
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch orders.', error: error.message });
  }
});

app.patch('/api/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Pending', 'Delivered'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }

    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    res.json({ message: 'Order status updated.', order: { id: order._id, status: order.status } });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update status.', error: error.message });
  }
});

app.delete('/api/orders/:id', async (req, res) => {
  try {
    const deleted = await Order.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    res.json({ message: 'Order deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete order.', error: error.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    app.listen(PORT, () => {
      console.log(`SmartBite server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

start();
