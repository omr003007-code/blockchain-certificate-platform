require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const certificateRoutes = require('./routes/certificate');
app.use('/api/certificates', certificateRoutes);

   // Serve the frontend HTML files
   app.use(express.static(path.join(__dirname, 'public')));
app.use('/certificates', express.static(path.join(__dirname, 'certificates')));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('? MongoDB Connected'))
  .catch(err => console.log('? MongoDB Error:', err));

app.get('/', (req, res) => res.send('Backend is running!'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log('Server running on port ' + PORT));
