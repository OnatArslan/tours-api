const express = require('express');

// Import viewController
const viewController = require(`./../controllers/viewController`);

const router = express.Router();

router.get(`/`, viewController.getOverview);

router.get(`/tour`, viewController.getTour);

module.exports = router;
