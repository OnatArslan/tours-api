const mongoose = require('mongoose');
// Import models
const Review = require(`./../models/reviewModel`);
const Tour = require(`./../models/tourModel`);
// Import global handler
const handlerFactory = require(`./handlerFactory`);

exports.setTourUserId = (req, res, next) => {
  // Checks if the tour ID is provided in the request body, if not, it takes it from the URL parameters
  if (!req.body.tour) req.body.tour = req.params.tourId;
  // Checks if the user ID is provided in the request body, if not, it uses the ID from the logged-in user (assumed to be attached to the request object)
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

// Asynchronously defines a function to create a review
exports.createReview = handlerFactory.createOne(Review);
// async (req, res, next) => {
//   try {
//     // Checks if the tour ID is provided in the request body, if not, it takes it from the URL parameters
//     if (!req.body.tour) req.body.tour = req.params.tourId;
//     // Checks if the user ID is provided in the request body, if not, it uses the ID from the logged-in user (assumed to be attached to the request object)
//     if (!req.body.user) req.body.user = req.user.id;

//     // Creates a new review document in the database with the provided information:
//     // review text, rating, user ID, and tour ID
//     const review = await Review.create({
//       review: req.body.review, // The content of the review
//       rating: req.body.rating, // The rating score
//       user: req.body.user, // The ID of the user who wrote the review
//       tour: req.body.tour // The ID of the tour being reviewed
//     });

//     // If the review is successfully created, responds with a 200 status code and the review data
//     res.status(200).json({
//       status: 'success',
//       data: {
//         review: review // The created review object
//       }
//     });
//   } catch (err) {
//     // If an error occurs during the process, catches the error
//     // and responds with a 500 status code and the error message
//     res.status(500).json({
//       status: 'fail',
//       message: err.message // The error message
//     });
//   }
// };

// Asynchronously defines a function to get all reviews
exports.getAllReviews = async (req, res, next) => {
  try {
    let reviews;
    if (req.params.tourId) {
      // Fetches all reviews from the database
      reviews = await Review.find({
        tour: req.params.tourId
      }); // We can define populate() as well

      // Uncomment the lines below if you want to include details of the user and tour associated with each review
      // .populate('user', 'name') // Populates the 'user' field in each review with user details (e.g., name)
      // .populate('tour', 'name'); // Populates the 'tour' field in each review with tour details (e.g., name)
    } else {
      reviews = await Review.find();
    }

    // If the operation is successful, responds with a 200 status code and the reviews data
    const count = reviews.length;
    res.status(200).json({
      status: 'success',
      data: {
        count: count,
        reviews: reviews // The fetched reviews from the database
      }
    });
  } catch (err) {
    // If an error occurs during the process, catches the error
    // and responds with a 500 status code and the error message
    res.status(500).json({
      status: 'fail',
      message: err.message // The error message encountered during the operation
    });
  }
};

exports.deleteReview = handlerFactory.deleteOne(Review);
exports.updateReview = handlerFactory.updateOne(Review);
