const Tour = require('./../models/tourModel');

exports.getOverview = async (req, res, next) => {
  try {
    // 1) Get tour data from collection
    const tours = await Tour.find();
    // 2) Build template
    // 3) Render that template using tour data from step 1
    res.status(200).render(`overview`, {
      title: `All Tours`,
      tours: tours
    });
  } catch (err) {
    console.log(err);
    res.status(500).render(`overview`, {
      title: `All Tours`
    });
  }
};

exports.getTour = async (req, res, next) => {
  res.status(200).render(`tour`, {
    title: `The Forest Hiker`
  });
};
