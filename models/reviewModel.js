const mongoose = require('mongoose');
const Tour = require(`./tourModel`);
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

// Adding a static method to the reviewSchema to calculate and update average ratings for a tour
reviewSchema.statics.calcAverageRatings = async function(tourId) {
  // Using the aggregate function to perform a series of operations on the review documents in the collection
  const stats = await this.aggregate([
    {
      $match: { tour: tourId } // First stage: Filters documents to only include those where 'tour' field matches the provided tourId
    },
    {
      $group: {
        // Second stage: Groups the filtered documents by 'tour'
        _id: '$tour', // The field to group by - in this case, the 'tour' field
        numRatings: { $sum: 1 }, // Counts the number of reviews by summing 1 for each document in the group
        avgRating: { $avg: '$rating' } // Calculates the average rating for the group by averaging the 'rating' field of the documents
      }
    }
  ]);

  // After calculating the stats, updates the corresponding tour document with the new average rating and number of ratings
  // This assumes that the Tour model has fields for storing the average rating ('ratingsAverage') and the number of ratings ('ratingsQuantity')
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].numRatings, // Updates the 'ratingsQuantity' field with the number of ratings calculated
      ratingsAverage: stats[0].avgRating // Updates the 'ratingsAverage' field with the calculated average rating
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5
    });
  }
};
// Adding a 'pre' hook for 'findOneAnd' operations on the reviewSchema
reviewSchema.pre(/^findOneAnd/, async function(next) {
  // Before executing the findOneAndUpdate or findOneAndDelete operation,
  // this hook clones the query, executes it to find the document, and stores it in 'this.r'.
  // This is necessary because the post middleware does not have direct access to the document being updated or deleted.
  this.r = await this.clone().findOne();
  next(); // Proceeds to the next middleware or the actual operation
});

// Adding a 'post' hook for 'findOneAnd' operations on the reviewSchema
reviewSchema.post(/^findOneAnd/, async function() {
  // After the findOneAndUpdate or findOneAndDelete operation is executed,
  // this hook uses 'this.r', the document found in the pre hook, to recalculate the average ratings.
  // It checks if 'this.r' exists because the operation might not have found a document.
  if (this.r) {
    // Calls the calcAverageRatings static method on the model that created 'this.r' (Review model),
    // passing the tour ID of the document. This recalculates the average ratings for the tour
    // based on the current set of reviews after the update or delete operation.
    await this.r.constructor.calcAverageRatings(this.r.tour);
  }
});

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

const Review = mongoose.model(`Review`, reviewSchema);

module.exports = Review;

// POST /tour/2345sd/reviews
// GET /tour/23232d/reviews
