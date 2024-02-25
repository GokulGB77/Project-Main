const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    productName: {type: String,required: true},
    productSku: {type:String,required:true},
    stock: {type: Number,required: true},
    images: [{type: String,}],
    productDetails: {type: String,required: true},
    productPrice: {type: Number,required: true},
    status:{type:Number,required:true},
    productTags:{type:Array,required:true},
    category: {type: mongoose.Schema.Types.ObjectId,ref: "category",required: true},
    //category: {type:String,required: true},
  });

module.exports = mongoose.model("Productsdb", productSchema);