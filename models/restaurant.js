// models/restaurant.js
const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Reference to the User model
});

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

module.exports = Restaurant;

