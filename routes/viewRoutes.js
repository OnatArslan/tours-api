const express = require('express');

const router = express.Router();

router.get(`/`, (req, res, next) => {
  res.status(200).render(`base`, {
    tour: 'The forest hiker',
    user: 'Jonas'
  });
});

router.get(`/overview`, (req, res, next) => {
  res.status(200).render(`overview`, {
    title: `All Tours`
  });
});

router.get(`/tour`, (req, res, next) => {
  res.status(200).render(`tour`, {
    title: `The Forest Hiker`
  });
});

module.exports = router;
