const Userdb = require("../models/userModel")
const Cartdb = require("../models/cartModel")
const Addressdb = require("../models/addressModel")
const Ordersdb = require("../models/ordersModel")
const Productsdb = require("../models/productsModel")

const placeOrder = async( req , res ) => {
  try {
    const userId = req.session.userId;
    const orderId = generateOrderId();
    const currentDate = getCurrentDate();
    const currentTime = getCurrentTime();
    let orderStatus = "pending";
    // console.log("orderId:",orderId);
    // console.log("currentDate:",currentDate);
    // console.log("currentTime:",currentTime);
    
    const { selectedAddress, selectedPaymentMethod, deliveryNotes } = req.body;
    // console.log("selectedAddress:",selectedAddress);
    // console.log("selectedPaymentMethod:",selectedPaymentMethod);
    // console.log("deliveryNotes:",deliveryNotes);


    // const address = await Addressdb.findOne({"addresses.$._id" :selectedAddress})
    const address = await Addressdb.findOne({ "addresses._id": selectedAddress });


    console.log("selectedAddress:",address.name);
    const cart = await Cartdb.findOne({user:userId}).populate("cartProducts.product")
    console.log("CART:",cart)

    const order = new Ordersdb({
      user:userId,
      orderId:orderId,
      orderProducts:cart.cartProducts,
      address:address,
      orderTotal:cart.cartTotal,
      orderDate:currentDate,
      orderTime:currentTime,
      orderStatus:orderStatus,
      paymentMethod:selectedPaymentMethod,
      deliveryNotes:deliveryNotes
    });

    const orderData = await order.save();

    cart.cartProducts = [];
    cart.cartTotal=0;
    await cart.save();  

    console.log("Order data created",orderData.orderId)
    const orderDetailsId = orderData.orderId
    res.status(200).json({orderDetailsId })
    // res.render('orderConfirmation',{userId,token,orderData});

    // res.redirect(`/checkout/order-success?userId=${userId}&token=${token}&orderDetailsId=${orderDetailsId}`);

  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");

  }
}

const orderSuccess = async (req,res) => {
try {
  // const {userId, token, orderDetailsId} = req.query;
  const token = req.cookies.jwt;
  const userId = req.session.userId
  const {orderId, cartId} = req.query;
  
  const orderDetails = await Ordersdb.findOne({orderId:orderId})
  console.log("orderId:",orderId);

  const orderedProducts = orderDetails.orderProducts
  console.log("orderedProducts:",orderedProducts);

  // Function to update product quantities
  const updateProductQuantities = async () => {
    console.log("Updating Stock Quantities....................");
    for (const orderedProduct of orderedProducts) {
      const { product, quantity } = orderedProduct;
      // Find the product in the Productsdb
      const eachProduct = await Productsdb.findOne({ _id: product });
      // Update the product quantity
      if (eachProduct) {
        eachProduct.stock -= quantity;
        eachProduct.popularity+=quantity
        // Save the updated product
        await eachProduct.save();
        console.log("Stock Quantities Updated....................");

      }
    }
  };
  await updateProductQuantities()

  res.render("orderConfirmation",{cartId, userId, token, orderId,orderDetails})

} catch (error) {
  console.log(error.message);
    res.status(500).send("Internal Server Error");

}
}

function getCurrentDate() {
  // Create a new Date object from the timestamp
  const date = new Date();

  // Extract the date components (year, month, day)
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // Month is zero-based, so add 1
  const day = date.getDate();

  // Format the date part (e.g., DD-MM-YYYY)
  const currentDate = `${day < 10 ? '0' + day : day}-${month < 10 ? '0' + month : month}-${year}`;

  return currentDate;
}

function getCurrentTime() {
  // Create a new Date object from the timestamp
  const date = new Date();

  // Extract the time components (hours, minutes, seconds)
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  // Determine AM or PM
  const ampm = hours >= 12 ? 'PM' : 'AM';

  // Convert hours to 12-hour format
  hours = hours % 12;
  hours = hours ? hours : 12; // Handle midnight (0 hours)

  // Format the time part (e.g., HH:MM:SS AM/PM)
  const currentTime = `${hours < 10 ? '0' + hours : hours}:${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds} ${ampm}`;

  return currentTime;
}

function generateOrderId() {
  const randomDigits = Math.floor(1000000000 + Math.random() * 9000000000);
  
  const timestamp = Date.now();

  const timestampDigits = timestamp.toString().slice(-10);

  // Combine random digits with timestamp digits
  const orderID = randomDigits.toString().slice(0, 10) + timestampDigits;

  return orderID;
}



module.exports = {
  placeOrder,
  orderSuccess
}