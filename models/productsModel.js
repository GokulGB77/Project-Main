const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    productName: {type: String,required: true},
    stock: {type: Number,required: true,min:0},
    images: [{type: String,}],
    productDetails: {type: String,required: true},
    productInfo: {type: String,required: false},
    productPrice: {type: Number,required: true,min:1},
    status:{type:Number,required:true},
    productTags:{type:Array,required:true},
    category: {type: mongoose.Schema.Types.ObjectId,ref: "Categoriesdb",required: true},
    popularity:{type:Number,required:true,default:0,min:0}
  });

module.exports = mongoose.model("Productsdb", productSchema);