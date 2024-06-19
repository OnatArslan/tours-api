const mongoose = require('mongoose');
// Creating a mongoose schema
const toursSchema = new mongoose.Schema({
  // here we can define options
  name: {
    type: String,
    required: [true, `A tour must have a price`],
    unique: [true, `A user must have unique name`],
    trim: true
  },
  duration: {
    type: Number,
    required: [true, `A tour must have a duration`]
  },
  maxGroupSize: {
    type: Number,
    required: [true, `A tour must have a group size`]
  },
  difficulty: {
    type: String,
    required: [true, `A tour must have a difficulty`]
  },
  ratingsAverage: {
    type: Number,
    default: 4.5
  },
  ratingsQuantity: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 4.2
  },
  price: {
    type: Number,
    required: [true, `A tour must have a price`]
  },
  priceDiscount: {
    type: Number
  },
  summary: {
    type: String,
    trim: true,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  imageCover: {
    type: String,
    required: [true, `A tour must have a cover image`]
  },
  images: {
    type: [String]
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false
  },
  startDates: {
    type: [Date]
  }
});
// Creating a model based on Tours schema
const Tour = mongoose.model(`Tour`, toursSchema);

module.exports = Tour; // Export the Tour model for use in Tour controller
