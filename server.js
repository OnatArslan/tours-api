const dotenv = require('dotenv');
const app = require('./app');
const mongoose = require('mongoose');

dotenv.config({ path: './config.env' });

// HOSTED DATABASE connection is below
mongoose
  .connect(process.env.DATABASE, {
    // This field for options but I won't use any
  })
  .then(conObj => {
    // console.log(conObj.connections); this is for reading database info
    console.log(`DATABASE CONNECTED SUCCESFULY`);
  });

// LOCAL DATABASE connection below
// mongoose.connect(process.env.DATABASE_LOCAL); DATABASE_LOCAL must diffrent than our connection str, you must get string from atlas for local str

// SERVER RUNNING BELOW
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
