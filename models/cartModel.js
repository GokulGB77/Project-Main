const  mongoose = require("mongoose");



const cartSchema = new mongoose.Schema({
  user:{type:String,required:true},
  cartProducts:[{
    product:{type:mongoose.Types.ObjectId,ref:'Productsdb',required: true},
    quantity:{type:Number,required:true,default:1},
    price:{type:Number,required:true},
    totalPrice:{type:Number,required:true},
  }],
  cartTotal:{type:Number,required:true,default:0}
})

module.exports = mongoose.model("Cartdb", cartSchema);
