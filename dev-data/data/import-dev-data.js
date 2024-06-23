const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('./../../models/tourModel');
dotenv.config({ path: './config.env' });
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

// READ THE FILE
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, `utf-8`));

// IMPORT DATA FUNCTION
const importData = async () => {
  try {
    await Tour.create(tours);
    console.log(`Data succesfuly loaded`);
    process.exit();
  } catch (err) {
    console.log(err);
  }
};

// DELETE ALL DATA FROM COLLECTION
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    console.log(`Data succesfuly deleted`);
    process.exit();
  } catch (err) {
    console.log(err);
  }
};

if (process.argv[2] === `--import`) {
  importData();
} else if (process.argv[2] === `--delete`) {
  deleteData();
}

console.log(process.argv);
// console.log will log [
//   'C:\\Program Files\\nodejs\\node.exe',
//   'C:\\Users\\onat\\OneDrive\\Masaüstü\\natours-app\\dev-data\\data\\import-dev-data.js'
// ]
