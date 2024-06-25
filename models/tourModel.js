const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');

const User = require('./userModel');

// Creating a mongoose schema
const toursSchema = new mongoose.Schema(
  {
    // Here we can define our Schema Object

    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: `User`
      }
    ],

    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: `Point`,
        enum: [`Point`]
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    locations: [
      {
        type: {
          type: String,
          default: `Point`,
          enum: [`Point`]
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    name: {
      type: String,
      required: [true, `A tour must have a price`],
      unique: [true, `A user must have unique name`], // Unique is not a real validator
      trim: true,
      maxLength: [40, `A tour name must have less or equal than 40 char`],
      minLength: [10, `A tour name must have less or equal than 10 char`]
      // validate: {
      //   validator: validator.isAlpha,
      //   message: `You must use only characters` // isAlpha return false with whitespaces because of that I don't use right now
      // }
    },
    slug: {
      type: String
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
      required: [true, `A tour must have a difficulty`],
      enum: {
        values: [`easy`, `medium`, `difficult`],
        message: `Difficulty is either: easy, medium, difficult`
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, `A rating must be above 1.0`],
      max: [5, `A rating must be above 5.0`],
      set: val => Math.round(val * 10) / 10
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
      type: Number,
      validate: {
        validator: function(val) {
          // this only points to current doc on NEW document creation we can not use this validator on update()
          return val < this.price; // val is priceDiscount and this.price is price of tour, this keyword referance for document
        },
        message: `Price discount ({VALUE}) can not be lower than original price`
      }
    },
    summary: {
      type: String,
      trim: true
      // required: true
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
    },
    secretTour: {
      type: Boolean,
      default: false
    }
  },
  {
    // Here we can define our Schema Options
    toJSON: {
      virtuals: true
    },
    toObject: {
      virtuals: true
    }
  }
);

// Define INDEX for incease performance
// toursSchema.index({ price: 1 });
toursSchema.index({ price: 1, ratingsAverage: -1 });
toursSchema.index({ slug: 1 });
toursSchema.index({ startLocation: `2dsphere` });

// Define a virtual property 'reviews' on the toursSchema Virtual Populate
toursSchema.virtual('reviews', {
  ref: 'Review', // Reference the 'Review' model. This tells Mongoose which model to use during population.
  foreignField: 'tour', // The field in the 'Review' model that will correspond to the '_id' field of the 'Tour' model.
  localField: '_id' // Review modelinde sadece _id kismi kayitli oldugundan ulasmak icin localField _id
});

// Define a virtual property for the toursSchema. Virtual properties are fields that Mongoose creates dynamically. They are not stored in the database.
toursSchema
  .virtual(`durationWeeks`)
  // Define a getter for the virtual property. This function will be called whenever an instance of a model with this schema tries to access the `durationWeeks` property.
  .get(function() {
    // `this` refers to the instance of the document that is trying to access the `durationWeeks` property.
    return this.duration / 7;
  });
// Notes:
// - Virtual properties are useful for computed properties on documents. For example, converting a duration in days to weeks in this case.
// - Arrow functions are not used here because they do not have their own `this` context. Instead, they inherit `this` from the parent scope at the time they are defined. In the context of Mongoose schema methods or virtuals, using a traditional function allows access to the document through `this`.
// - Virtuals are not part of the database schema. This means you cannot use them in queries directly, like `Tours.find({durationWeeks: 2})`, because `durationWeeks` does not exist in the MongoDB collection.

// QUERY MIDDLEWARE
// When use find() related query we can output guides object in here
toursSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'guides',
    select: `-__v -passwordChangedAt`
  });
  next();
});

// Document Middleware for the toursSchema, to be executed before saving a document.
toursSchema.pre(`save`, {}, function(next) {
  // This middleware function is executed before a document is saved to the database.

  // The `this` keyword refers to the document that is about to be saved.
  // This allows us to modify the document before it is saved.

  // Here, we're generating a slug from the tour's name using the `slugify` function.
  // The slug is created in lowercase (`{ lower: true }` option).
  this.slug = slugify(this.name, { lower: true });

  // Call `next()` to move on to the next middleware in the stack, or to save the document if there are no more middlewares.
  next();
});

// DOCUMENT MIDDLEWARE for the toursSchema, to be executed after saving a document.
toursSchema.post(`save`, {}, function(doc, next) {
  // This middleware function is executed after a document has been saved to the database.

  // The `doc` parameter is the document that was just saved.
  // This allows us to access the saved document.

  // Here, we simply log the saved document to the console.
  console.log(doc);

  // Call `next()` to move on to the next middleware in the stack, if there are any more post-save middlewares.
  next();
});

// QUERY MIDDLEWARE
// This middleware is attached to the toursSchema and is triggered before any find operation.
toursSchema.pre(/^find/, function(next) {
  // The regular expression /^find/ matches any query method that starts with 'find',
  // such as find, findOne, findMany, etc. This ensures the middleware applies to all types of find operations.

  // `this` refers to the current query object. We modify this query by adding an additional filter condition.
  // The filter condition { secretTour: { $ne: true } } ensures that the query will exclude documents
  // where the 'secretTour' field is true (i.e., it filters out secret tours from the results).
  this.find({ secretTour: { $ne: true } });

  // Call `next()` to proceed with the execution of the query after this middleware has modified it.
  next();
});

// // AGGREGATION MIDDLEWARE
// // Attach a pre-aggregate middleware to the toursSchema. This middleware will run before any aggregation operation.
// toursSchema.pre('aggregate', function(next) {
//   // This middleware intercepts the aggregation pipeline and modifies it by adding a $match stage
//   // at the beginning. The $match stage { secretTour: { $ne: true } } filters out documents where
//   // 'secretTour' is true, similar to the query middleware but for aggregation operations.

//   // `this.pipeline()` returns the array of stages in the current aggregation pipeline. We use
//   // `unshift()` to add a new $match stage at the beginning of this pipeline. This ensures that
//   // the filtering is applied before any other aggregation stages are processed.
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

//   // Call `next()` to continue with the execution of the aggregation pipeline after this middleware.
//   next();
// });

// Creating a model based on Tours schema
const Tour = mongoose.model(`Tour`, toursSchema);

module.exports = Tour; // Export the Tour model for use in Tour controller
