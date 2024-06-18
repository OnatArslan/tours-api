const mongoose = require('mongoose');
// Creating a mongoose schema
const toursSchema = new mongoose.Schema({
  // here we can define options
  name: {
    type: String,
    required: [true, `A tour must have a price`],
    unique: [true, `A user must have unique name`]
  },
  rating: {
    type: Number,
    default: 4.2
  },
  price: {
    type: Number,
    required: [true, `A tour must have a price`]
  }
});
// Creating a model based on Tours schema
const Tour = mongoose.model(`Tour`, toursSchema);

module.exports = Tour; // Export the Tour model for use in Tour controller
