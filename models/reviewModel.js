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
      type: mongoose.Schema.ObjectId, // Defines the type of the 'user' field as an ObjectId, which is a type used by MongoDB for unique document identifiers.
      ref: 'User', // This establishes a reference to the 'User' model. Mongoose will use this to populate the 'user' field with data from the 'User' collection when requested.
      required: [true, 'Review must belong to a user'] // Makes the 'user' field required, meaning a review cannot be saved without associating it with a user. The array format provides a custom error message if the requirement is not met.
    },
    tour: {
      type: mongoose.Schema.ObjectId, // Similar to the 'user' field, this defines the 'tour' field type as ObjectId, linking it to a unique document in the database.
      ref: 'Tour', // Establishes a reference to the 'Tour' model, allowing the 'tour' field to be populated with data from the 'Tour' collection upon request.
      required: [true, 'Review must belong to a tour'] // Ensures that a review is associated with a tour. The custom error message is provided if this field is left empty.
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

reviewSchema.pre(/^find/, function(next) {
  this.populate({
    path: `user`,
    select: `name photo`
  });
  next();
});

const Review = mongoose.model(`Review`, reviewSchema);

module.exports = Review;

// POST /tour/2345sd/reviews
// GET /tour/23232d/reviews
