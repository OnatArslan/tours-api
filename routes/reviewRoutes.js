const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require(`./../controllers/authController`);

const router = express.Router();

router
  .route(`/:tourId`)
  .post(authController.protect, reviewController.createReview);

router.route(`/`).get(authController.protect, reviewController.getAllReviews);

module.exports = router;
