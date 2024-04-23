const mongoose = require('mongoose');
const { Schema } = mongoose;

const tableSchema = new Schema({
  name: { type: String, required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  restaurant: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  isOpen: { type: Boolean, default: true },
  dishes: [{ type: Schema.Types.ObjectId, ref: 'Dish' }],
  total: { type: Number, default: 0 },
  openedAt: { type: Date, default: Date.now },
  closedAt: { type: Date }
});

// Pre-save hook to calculate the total cost of dishes
tableSchema.pre('save', async function(next) {
  if (this.isModified('dishes')) {
    // Populate the dishes array to access the price
    await this.populate('dishes');  // Correctly using populate without exec()
    // Calculate the total from the populated dishes
    this.total = this.dishes.reduce((acc, dish) => acc + dish.price, 0);
  }
  next();
});


const Table = mongoose.model('Table', tableSchema);

module.exports = Table;
