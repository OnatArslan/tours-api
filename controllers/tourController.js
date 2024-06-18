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
    const tour = await Tour.findById(id); // findById can take 3 params (id, project, options)
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
    const newTour = await Tour.create(
      req.body
      // mongoose create() method can take options argument as a 2.
    );

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

exports.updateTour = async (req, res) => {
  try {
    const id = req.params.id;
    const updatedTour = await Tour.findByIdAndUpdate(id, req.body, {
      runValidators: true,
      new: true
    });
    // This is normal query system for mongoose but upper code is more elegant
    // const updatedTour = await Tour.findOneAndUpdate({ _id: id }, req.body, {
    //   runValidators: true,
    //   new: true
    // });

    res.status(200).json({
      status: 'success',
      data: {
        tour: updatedTour
      }
    });
  } catch (err) {
    res.status(400).json({
      status: `fail`,
      message: err
    });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    const id = req.params.id;
    const tour = await Tour.findByIdAndDelete(id);

    if (!tour) {
      return res.status(404).json({
        status: 'fail',
        message: 'No tour found with that ID'
      });
    }

    res.status(204).json({
      // status(204) won`t show message or data if this is important use status(200)
      status: 'success',
      data: null
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message // It's often helpful to return the error message for debugging purposes.
    });
  }
};
