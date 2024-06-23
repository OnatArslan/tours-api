const mongoose = require('mongoose');
const Review = require(`./../models/reviewModel`);
const Tour = require(`./../models/tourModel`);

// Define the createReview function as an asynchronous function
exports.createReview = async (req, res, next) => {
  try {
    // Attempt to find the tour by its ID passed in the request parameters
    const tour = await Tour.findById(req.params.tourId);
    if (!tour) {
      // If no tour is found, throw a new error indicating the tour does not exist
      throw new Error('Tour not found');
    }

    // Create a new review using the data provided in the request body
    // and the user information from the request object
    const review = await Review.create({
      review: req.body.review, // Text of the review
      rating: req.body.rating, // Rating given in the review
      user: req.user, // User who is creating the review
      tour: tour // The tour for which the review is created
    });

    // If the review creation is successful, send a 200 status code
    // and the created review in the response
    res.status(200).json({
      status: 'success',
      data: {
        review: review
      }
    });
  } catch (err) {
    // If any error occurs during the process, catch the error
    // and send a 500 status code along with the error message
    res.status(500).json({
      status: 'fail',
      message: err.message
    });
  }
};

exports.getAllReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find();
    //   .populate(`user`)
    //   .populate(`tour`);

    res.status(200).json({
      status: 'success',
      data: {
        reviews: reviews
      }
    });
  } catch (err) {
    // If any error occurs during the process, catch the error
    // and send a 500 status code along with the error message
    res.status(500).json({
      status: 'fail',
      message: err.message
    });
  }
};
