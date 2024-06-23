const Tour = require('./../models/tourModel');

// This middleware function is designed to modify the request query parameters for a specific route.
// It's typically used to create a shortcut or alias for a complex query, making it easier for clients to request popular data sets.
exports.aliasTopTours = async (req, res, next) => {
  // Set the 'limit' query parameter to '5'.
  // This limits the number of tours returned by the query to the top 5.
  // It's useful for a feature like "Top 5 Tours" where only a small, specific set of data is needed.
  req.query.limit = `5`;

  // Set the 'sort' query parameter to '-ratingsAverage,price'.
  // This sorts the tours first by ratingsAverage in descending order (hence the '-') and then by price in ascending order.
  // This sorting order helps in fetching the top-rated tours while also considering cost-efficiency.
  req.query.sort = `-ratingsAverage,price`;

  // Set the 'fields' query parameter to include only specific fields in the response.
  // Here, only 'name', 'price', 'ratingsAverage', 'summary', and 'difficulty' fields of the tours will be included.
  // This is a form of field limiting, which optimizes the response size and focuses on the most relevant tour information.
  req.query.fields = `name,price,ratingsAverage,summary,difficulty`;

  // Call the next middleware in the stack.
  // At this point, the request query has been modified with preset values, and the request can proceed to the next operation,
  // which could be the actual fetching of tours based on these modified query parameters.
  next();
};

exports.getAllTours = async (req, res) => {
  try {
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
    let query = Tour.find(JSON.parse(queryStr));

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
    const tours = await query;
    // Count the number of tours returned to include in the response
    const tourCount = tours.length;

    // Step 6: Sending Response
    // Respond with the list of tours and the count
    res.status(200).json({
      status: 'success',
      data: {
        message: `Showing ${tourCount} tours on this page`,
        tours: tours
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
    const newTour = await Tour.create(req.body);

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

// Aggregation Pipeline
exports.getTourStats = async (req, res) => {
  try {
    // Perform an aggregation operation on the Tour collection.
    const stats = await Tour.aggregate([
      {
        // $match stage: Filters documents to pass only those that meet the specified condition(s) to the next pipeline stage.
        $match: { ratingsAverage: { $gte: 4.5 } } // This condition selects documents where ratingsAverage is greater than or equal to 4.5.
      },
      {
        // $group stage: Groups input documents by the specified '_id' expression and for each distinct grouping, outputs a document.
        $group: {
          _id: { $toUpper: `$difficulty` }, // Group by 'difficulty' field, converting its value to uppercase.
          count: { $count: {} }, // Counts the number of documents in each group.
          avgRating: { $avg: `$ratingsAverage` }, // Calculates the average of 'ratingsAverage' for documents in each group.
          numRatings: { $sum: `$ratingsQuantity` }, // Sums up 'ratingsQuantity' for documents in each group.
          avgPrice: { $avg: `$price` }, // Calculates the average of 'price' for documents in each group.
          minPrice: { $min: `$price` }, // Finds the minimum 'price' in each group.
          maxPrice: { $max: `$price` } // Finds the maximum 'price' in each group.
        }
      },
      {
        // $sort stage: Sorts all input documents and returns them to the pipeline in sorted order.
        $sort: { avgPrice: 1 } // Sorts the documents by 'avgPrice' in ascending order (1 for ascending, -1 for descending).
      }
      // The commented-out part below is an additional $match stage that could be used to filter out documents after grouping.
      // {
      //   $match: { _id: { $ne: `EASY` } } // This condition would exclude documents where the '_id' (difficulty in uppercase) is not equal to 'EASY'.
      // }
    ]);

    res.status(200).json({
      status: 'success',
      data: stats
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message // It's often helpful to return the error message for debugging purposes.
    });
  }
};

exports.getMonthlyPlan = async (req, res) => {
  try {
    // Convert the year parameter from the request to a number.
    const year = req.params.year * 1;

    // Execute an aggregation pipeline on the Tour collection.
    const plan = await Tour.aggregate([
      {
        // $unwind stage: Deconstructs an array field from the input documents to output a document for each element.
        $unwind: `$startDates`
      },
      {
        // $match stage: Filters the documents to pass only those that match the specified condition(s).
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`), // Greater than or equal to the first day of the year.
            $lte: new Date(`${year}-12-31`) // Less than or equal to the last day of the year.
          }
        }
      },
      {
        // $group stage: Groups input documents by a specified identifier expression and applies the accumulator expressions.
        $group: {
          _id: { $month: `$startDates` }, // Groups the documents by month of the startDates.
          numTourStarts: { $count: {} }, // Counts the number of tours starting in each month.
          tours: { $push: `$name` } // Creates an array of tour names starting in each month.
        }
      },
      {
        // $addFields stage: Adds new fields to documents. Here, it adds the 'month' field with the value of '_id'.
        $addFields: { month: `$_id` }
      },
      {
        // $project stage: Specifies the inclusion of fields to output (1 for inclusion, 0 for exclusion).
        $project: {
          _id: 0 // Excludes the '_id' field from the output documents.
        }
      },
      {
        // $sort stage: Sorts all input documents and returns them to the pipeline in sorted order.
        $sort: { numTourStarts: -1 } // Sorts documents by 'numTourStarts' in descending order.
      },
      {
        // $limit stage: Limits the number of documents passed to the next stage in the pipeline.
        $limit: 12 // Limits the result to the top 12 months.
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: plan
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message // It's often helpful to return the error message for debugging purposes.
    });
  }
};
