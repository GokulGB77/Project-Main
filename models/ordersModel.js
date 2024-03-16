const { text } = require("body-parser");
const  mongoose = require("mongoose");



const ordersSchema = new mongoose.Schema({
  user:{ type: mongoose.Schema.Types.ObjectId, ref: "UserDb", required: false },
  orderId:{type:Number,required:true},
  orderProducts:[{
    product:{type:mongoose.Types.ObjectId,ref:'Productsdb',required: true},
    quantity:{type:Number,required:true,default:1},
    price:{type:Number,required:true},
    totalPrice:{type:Number,required:true},
  }],
  address:{type:Object},
  orderTotal:{type:Number,required:true,default:0},
  orderDate:{type:String,required:true},
  orderTime:{type:String,required:true},
  orderStatus:{type:String,enum: ["pending", "completed","returned", "cancelled", "delivered"],default:"pending",required:true},
  paymentMethod:{type:String,required:true},
  deliveryNotes:{type:String,required:false}
})

module.exports = mongoose.model("Ordersdb", ordersSchema);
