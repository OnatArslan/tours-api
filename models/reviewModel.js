const mongoose = require('mongoose');

// review rating createdAt ref to tour ref to user
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, `Review can not be empty`]
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now()
    },
    updatedAt: {
      type: Date
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: `User`,
      required: [true, `Review must belong to a user`]
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: `Tour`,
      required: [true, `Review must belong to a tour`]
    }
  },
  {
    toJSON: {
      virtuals: true
    },
    toObject: {
      virtuals: true
    }
  }
);

reviewSchema.pre(`save`, function(next) {
  if (!this.isNew) {
    this.updatedAt = Date.now();
  }
  next();
});

const Review = mongoose.model(`Review`, reviewSchema);

module.exports = Review;
