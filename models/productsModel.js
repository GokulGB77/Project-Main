const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    pname: {type: String,required: true,},
    price: {type: Number,required: true,},
    description: {type: String,required: true,},
    images: [{type: String,},],
    category: {type: mongoose.Schema.Types.ObjectId,ref: "category",required: true},
    quantity: {type: Number,required: true,},
    // sizes: [{
    //     size: {type: String,required: true,},
    //     quantity: {type: Number,required: true,},
    //   }],
    is_listed: {type: String,default: 1,},
  });

module.exports = mongoose.model("Productsdb", productSchema);