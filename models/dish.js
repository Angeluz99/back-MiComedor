const mongoose = require('mongoose');

const dishSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String }, // URL or file path to the image
  category: {
    type: String,
    required: true,
    enum: ['Cocina', 'Bebida', 'Otros'] // Enum ensures the category is one of the predefined options
  },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true } // To filter dishes by restaurant
});


const Dish = mongoose.model('Dish', dishSchema);

module.exports = Dish;
