const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require(`./../controllers/authController`);

const router = express.Router({ mergeParams: true }); // mergeParams : true mean that no matter what this router catch the request

// POST /tour/23232/reviews mergeParams

router.use(authController.protect);

router
  .route(`/`)
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo(`user`),
    reviewController.setTourUserId,
    reviewController.createReview
  );

router
  .route(`/:id`)
  .delete(
    authController.restrictTo(`user`, `admin`),
    reviewController.deleteReview
  )
  .patch(
    authController.restrictTo(`user`, `admin`),
    reviewController.updateReview
  )
  .get(reviewController.getReview);

module.exports = router;
