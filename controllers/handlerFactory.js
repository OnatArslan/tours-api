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

exports.getOne = (Model, populateOptions) => {
  return async (req, res) => {
    try {
      const id = req.params.id; // This is not neccesary but good for increasing to  code readabilty
      let query = Model.findById(id);
      if (populateOptions) {
        query = query.populate(populateOptions);
      }

      // populate(`guides`) is function that get related collection `User` to this query
      const doc = await query;
      // const doc = await doc.findOne({ _id: req.params.id });
      res.status(200).json({
        status: 'success',
        data: {
          doc: doc
        }
      });
    } catch (err) {
      res.status(404).json({
        status: 'fail',
        message: err
      });
    }
  };
};

exports.getAll = Model => {
  return async (req, res) => {
    try {
      // This code for allow nested GET reviews on tour (hack)
      let filter = {};
      if (req.params.tourId) {
        filter = { tour: req.params.tourId };
      }
      // Step 1: Filtering
      // Create a hard copy of req.query to manipulate without altering the original request
      const queryObj = { ...req.query }; // Original query object after removing excluded fields
      // Define fields that should not be used for filtering but are reserved for other functionalities
      const excludedFields = ['page', 'sort', 'limit', 'fields'];
      // Remove these fields from the query object to isolate only the fields meant for filtering
      excludedFields.forEach(el => delete queryObj[el]);

      // Step 2: Advanced Filtering
      // Convert query object to string to manipulate
      let queryStr = JSON.stringify(queryObj);
      // Replace filtering operators (gte, gt, lte, lt) with MongoDB's query operators ($gte, $gt, $lte, $lt)
      queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

      // Debugging: Log the original and modified query objects
      // console.log(queryObj); // Original query object after removing excluded fields
      // console.log(JSON.parse(queryStr)); // Modified query object with MongoDB operators

      // Step 3: Executing Query
      // Build the query with the modified query string. Additional functionalities like sort, paginate can be chained here.
      // populate(`guides`) is function that get related collection `User` to this query
      let query = Model.find(JSON.parse(queryStr));

      // Step 4: SORTING
      // Check if a sort parameter is provided in the query string
      if (req.query.sort) {
        // If a sort parameter exists, it means the client wants to sort the results based on one or more fields.
        // The sort parameter can include multiple fields separated by commas, e.g., "price,ratingsAverage"

        // Convert the sort parameter from comma-separated values to space-separated values
        // This is because MongoDB expects space-separated fields for sorting
        // For example, "price,ratingsAverage" becomes "price ratingsAverage"
        const sortBy = req.query.sort.split(`,`).join(` `);

        // Log the sortBy value to the console for debugging purposes
        // This helps in understanding what fields the query is being sorted by
        console.log(sortBy);

        // Apply the sorting to the query
        // The sort method modifies the query to include the sorting order
        // If sortBy is "price ratingsAverage", it sorts by price first, then by ratingsAverage
        query = query.sort(sortBy);
      } else {
        // If no sort parameter is provided, default to sorting by createdAt field in descending order
        // This means the most recently created documents will be returned first
        // The "-" before "createdAt" indicates descending order. Without "-", it would be ascending.
        query = query.sort(`-createdAt`);
      }

      // Step 4: FIELD LIMITING
      // This step allows clients to specify which fields of the data they want to receive in the response.
      // It's particularly useful for optimizing data transfer, especially in cases where only a subset of the data is needed.

      // Check if the "fields" query parameter is provided in the request.
      // The "fields" parameter allows clients to specify a comma-separated list of field names they are interested in.
      if (req.query.fields) {
        // If the "fields" parameter is present, process it to format suitable for MongoDB query.

        // The fields specified by the client are in comma-separated format, e.g., "name,price,duration".
        // MongoDB expects a space-separated list for selecting specific fields, so we replace commas with spaces.
        const fields = req.query.fields.split(`,`).join(` `);

        // Apply the field selection to the query.
        // The select() method of Mongoose is used here to specify which fields to include or exclude in the result set.
        // After this operation, the query will only fetch the fields specified by the client.
        query = query.select(fields);
      } else {
        // If the "fields" parameter is not provided, exclude the "__v" field by default.
        // The "__v" field is automatically added by MongoDB to each document for versioning, but it's rarely useful to clients.
        // We use the select() method with "-__v" to explicitly exclude this field from the results.
        query = query.select(`-__v`);
        // After this step, the query is configured to either limit the fields based on the client's request or exclude the "__v" field by default.
        // The query can then proceed to other operations like sorting, pagination, etc., before execution.
      }

      // Step 5 Pagination
      // ?page=2&limit=10
      const page = req.query.page * 1 || 1;
      const limit = req.query.limit * 1 || 100;
      const skip = (page - 1) * limit;
      query = query.skip(skip).limit(limit);
      if (req.query.page) {
        const numTours = await Tour.countDocuments();
        if (skip >= numTours) {
          throw new Error(`This page does not exist`);
        }
      }
      // Execute the query to get the list of tours that match the query criteria
      const docs = await query.explain();
      // Count the number of docs returned to include in the response
      const docCount = docs.length;

      // Step 6: Sending Response
      // Respond with the list of docs and the count
      res.status(200).json({
        status: 'success',
        data: {
          message: `Showing ${docCount} docs on this page`,
          docs: docs
        }
      });
    } catch (err) {
      // Error Handling: Respond with a 404 status code and the error message if the query fails
      res.status(404).json({
        status: 'fail',
        message: err.message
      });
    }
  };
};
