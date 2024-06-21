const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' }); // This should not under the require app because of the middlewares
const app = require('./app');

// HOSTED DATABASE connection is below
mongoose
  .connect(process.env.DATABASE, {
    // This field for options but I won't use any
  })
  .then(conObj => {
    // console.log(conObj.connections); this is for reading database info
    console.log(`DATABASE CONNECTED SUCCESFULY`);
  })
  .catch(err => {
    console.log(err);
  });

// LOCAL DATABASE connection below
// mongoose.connect(process.env.DATABASE_LOCAL); DATABASE_LOCAL must diffrent than our connection str, you must get string from atlas for local str

// SERVER RUNNING BELOW
const port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log(`APP RUNNING ON PORT : ${port}`);
});
