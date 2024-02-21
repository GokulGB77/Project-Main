const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
    categoryName: {type: String,required: true},
    categoryDetails: {type: String,required: true},
  });

module.exports = mongoose.model("Catergorydb", categorySchema);