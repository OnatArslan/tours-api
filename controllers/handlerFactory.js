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
