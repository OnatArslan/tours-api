const Tour = require('./../models/tourModel');

exports.getAllTours = async (req, res) => {
  try {
    const tours = await Tour.find({}, {}, {});
    const tourCount = tours.length;
    res.status(200).json({
      status: 'success',

      data: {
        message: `Showing ${tourCount} tours on this page`,
        tours: tours
      }
    });
  } catch (err) {
    res.status(404).json({
      status: `fail`,
      message: err
    });
  }
};

exports.getTour = async (req, res) => {
  try {
    const id = req.params.id; // This is not neccesary but good for increaseing understand code readabilty
    const tour = await Tour.findById(id);
    // const tour = await Tour.findOne({ _id: req.params.id });
    res.status(200).json({
      status: 'success',
      data: {
        tour: tour
      }
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err
    });
  }
};

exports.createTour = async (req, res) => {
  try {
    const newTour = await Tour.create({
      name: req.body.name,
      rating: req.body.rating,
      price: req.body.price
      // create() method can take options paramter for validateBeforeSave etc options
    });

    res.status(201).json({
      status: 'success',
      data: {
        message: `Tour saved succesfuly`,
        tour: newTour
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err
    });
  }
};

exports.updateTour = (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      tour: '<Updated tour here...>'
    }
  });
};

exports.deleteTour = (req, res) => {
  res.status(204).json({
    status: 'success',
    data: null
  });
};
