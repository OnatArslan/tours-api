exports.deleteOne = Model => {
  return async (req, res) => {
    try {
      const id = req.params.id;
      const doc = await Model.findByIdAndDelete(id);

      if (!doc) {
        return res.status(404).json({
          status: 'fail',
          message: `No ${doc} found with this id`
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
};

exports.updateOne = Model => {
  return async (req, res) => {
    try {
      const id = req.params.id;
      const updatedDoc = await Model.findByIdAndUpdate(id, req.body, {
        runValidators: true,
        new: true
      });
      // This is normal query system for mongoose but upper code is more elegant
      // const updatedModel = await Tour.findOneAndUpdate({ _id: id }, req.body, {
      //   runValidators: true,
      //   new: true
      // });
      res.status(200).json({
        status: 'success',
        data: {
          doc: updatedDoc
        }
      });
    } catch (err) {
      res.status(400).json({
        status: `fail`,
        message: err
      });
    }
  };
};

exports.createOne = Model => {
  return async (req, res) => {
    try {
      const doc = await Model.create(req.body);

      res.status(201).json({
        status: 'success',
        data: {
          message: `${doc} created succesfuly`,
          doc: doc
        }
      });
    } catch (err) {
      res.status(400).json({
        status: 'fail',
        message: err
      });
    }
  };
};
