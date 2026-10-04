const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  orgName: { type: String, required: true },
  role: { type: String, default: 'admin' }
}, { timestamps: true });

// Hash password before saving (Correct modern Mongoose async syntax)
userSchema.pre('save', async function() {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return;
  
  // Hash the password with cost of 10
  this.password = await bcrypt.hash(this.password, 10);
});

// Method to compare passwords during login
userSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);