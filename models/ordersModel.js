const { text } = require("body-parser");
const  mongoose = require("mongoose");



const ordersSchema = new mongoose.Schema({
  user:{ type: mongoose.Schema.Types.ObjectId, ref: "Userdb", required: true },
  orderId:{type:String,required:true},
  orderProducts:[{
    product:{type:mongoose.Types.ObjectId,ref:'Productsdb',required: true},
    quantity:{type:Number,required:true,default:1},
    price:{type:Number,required:true},
    priceWithoutOffer:{type:Number,required:true},
    totalPrice:{type:Number,required:true},
    totalPriceWithoutOffer:{type:Number,required:true},

  }],
  address:{type:Object},
  orderTotal:{type:Number,required:true,default:0},
  orderDate:{type:String,required:true},
  orderTime:{type:String,required:true},
  orderStatus:{type:String,enum: ["pending","shipped","delivered", "cancelled",,"return-requested","returned", ],default:"pending",required:true},
  paymentMethod:{type:String,required:true},
  deliveryNotes:{type:String,required:false},
  orderCancelReason: {type:String,required:false},
  additionalReason:{type:String,required:false},
  adminNotes:{type:String,required:false,},
  couponApplied:{type:String,},
  couponDiscount:{type:Number,},
  totalOrderPriceWithoutOffer: { type: Number } // New field for total order price without offer

},
{
  timestamps:true
})

ordersSchema.pre('save', function(next) {
  let totalOrderPriceWithoutOffer = 0;
  this.orderProducts.forEach(product => {
    totalOrderPriceWithoutOffer += product.totalPriceWithoutOffer;
  });
  this.totalOrderPriceWithoutOffer = totalOrderPriceWithoutOffer;
  next();
});
module.exports = mongoose.model("Ordersdb", ordersSchema);
