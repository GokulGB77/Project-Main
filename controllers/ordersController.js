const Userdb = require("../models/userModel")
const Cartdb = require("../models/cartModel")
const Addressdb = require("../models/addressModel")
const Ordersdb = require("../models/ordersModel")
const Productsdb = require("../models/productsModel")

//-----------------------------User Side---------------------------------------------
const placeOrder = async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const orderId = generateOrderId();
    const currentDate = getCurrentDate();
    const currentTime = getCurrentTime();
    let orderStatus = "pending";

    const { selectedAddress, selectedPaymentMethod, deliveryNotes } = req.body;

    if (!selectedAddress || !selectedPaymentMethod) {
      throw new Error("Address and payment method are required");
    }

    const address = await Addressdb.findOne({ "addresses._id": selectedAddress });
    if (!address) {
      throw new Error("Selected address not found");
    }
    const orderAddress = address.addresses.find(addr => addr._id == selectedAddress);

    const cart = await Cartdb.findOne({ user: userId }).populate("cartProducts.product");
    if (!cart) {
      throw new Error("Cart not found for the user");
    }

    if (cart.cartProducts.length === 0) {
      throw new Error("Cart is empty. Add products before placing an order");
    }

    const order = new Ordersdb({
      user: userId,
      orderId: orderId,
      orderProducts: cart.cartProducts,
      address: orderAddress,
      orderTotal: cart.cartTotal,
      orderDate: currentDate,
      orderTime: currentTime,
      orderStatus: orderStatus,
      paymentMethod: selectedPaymentMethod,
      deliveryNotes: deliveryNotes
    });

    const orderData = await order.save();

    cart.cartProducts = [];
    cart.cartTotal = 0;
    await cart.save();

    console.log("Order data created", orderData.orderId);
    const orderDetailsId = orderData.orderId;
    res.status(200).json({ orderDetailsId });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};


const orderSuccess = async (req, res) => {
  try {
    // const {userId, token, orderDetailsId} = req.query;
    const token = req.cookies.jwt;
    const userId = req.session.userId
    const { orderId, cartId } = req.query;

    const orderDetails = await Ordersdb.findOne({ orderId: orderId }).populate("orderProducts.product")
    console.log("orderId:", orderId);

    const orderedProducts = orderDetails.orderProducts
    console.log("orderedProducts:", orderedProducts);

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
          eachProduct.popularity += quantity
          // Save the updated product
          await eachProduct.save();
          console.log("Stock Quantities Updated....................");

        }
      }
    };
    await updateProductQuantities()

    res.render("orderConfirmation", { cartId, userId, token, orderId, orderDetails, orderedProducts })

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

const loadOrderDetails = async (req, res) => {
  try {
    const token = req.cookies.jwt;
    const currentUser = res.locals.currentUser
    const userId = currentUser._id
    const orderId = req.query.id
    const orderDetails = await Ordersdb.findOne({ _id: orderId }).populate("orderProducts.product")
    const orderDate = orderDetails.orderDate
    console.log("orderDetails:", orderDetails)

    res.render("orderDetails", { token, userId, orderId, orderDetails, })
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");

  }
}


const cancelOrder = async (req, res) => {
  try {
    const orderId = req.query.orderId;
    if (!orderId) {
      return res.status(405).send({ message: "Missing orderId parameter." });
    }

    const orderCancelReason = req.body.reason;
    if (!orderCancelReason) {
      return res.status(406).send({ message: "Missing order cancellation reason." });
    }

    const additionalReason = req.body.additionalReason || null;

    const orderDetails = await Ordersdb.findOneAndUpdate(
      { _id: orderId },
      {
        $set: {
          orderStatus: "cancelled",
          orderCancelReason: orderCancelReason,
          additionalReason: additionalReason,
        },
      },
      { new: true } // Return the updated document
    );

    if (!orderDetails) {
      return res.status(404).send({ message: "Order not found." });
    }
    // Add quantities back to product stock
    for (const orderProduct of orderDetails.orderProducts) {
      try {
        const product = await Productsdb.findById(orderProduct.product);
        if (product) {
          product.stock += orderProduct.quantity;
          await product.save();
        } else {
          throw new Error(`Product with ID ${orderProduct.product} not found.`);
        }
      } catch (error) {
        console.log(`Error adding quantity back to product stock: ${error.message}`);
        throw error;
      }
    }


    res.status(200).send({ message: "Order cancelled successfully.", order: orderDetails });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ message: "Error cancelling order." });
  }
};


//-----------------------------Admin Side---------------------------------------------

const loadOrders = async (req, res) => {
  try {
    const allOrders = await Ordersdb.find().populate("orderProducts.product").populate("user", "name");
    if (!allOrders) {
      return res.status(404).send({ message: "No orders found." });
    }
    console.log("allOrders.length:", allOrders.length);
    res.render("viewOrders", { allOrders });
  } catch (error) {
    console.error("Error loading orders:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};


const loadOrdersDetails = async (req, res) => {
  try {
    const orderId = req.query.orderId;
    const orderDetails = await Ordersdb.findOne({ orderId: orderId }).populate("orderProducts.product").populate("user");
    const deliveryCharge = 500;
    if (!orderDetails) {
      return res.status(404).send({ message: "Order not found" });
    }

    const orderDate = orderDetails.orderDate;
    const formattedDate = formatDate(orderDate);

    const orderTime = orderDetails.orderTime;
    const formattedTime = formatTime(orderTime);

    console.log("orderId:", orderId);
    res.render("orderDetails", { orderDetails, formattedDate, formattedTime, deliveryCharge });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ message: "Internal Server Error" });
  }
};


const formatDate = (orderDate) => {
  const [dayStr, monthStr, yearStr] = orderDate.split('-');
  const day = parseInt(dayStr, 10);
  const month = parseInt(monthStr, 10) - 1; // Month in JavaScript Date object is 0-indexed
  const year = parseInt(yearStr, 10);
  const parsedDate = new Date(year, month, day);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayOfWeek = dayNames[parsedDate.getDay()];
  const monthName = monthNames[parsedDate.getMonth()];
  const date = parsedDate.getDate();
  const yearFormatted = parsedDate.getFullYear();
  return `${dayOfWeek}, ${monthName} ${date}, ${yearFormatted}`;
};

const formatTime = (timeString) => {
  // Split the time string into components
  const [time, period] = timeString.split(' ');

  // Split the time components into hour, minute, and second
  const [hourStr, minuteStr] = time.split(':');

  // Parse hour and minute into integers
  let hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  // Adjust the hour if it's PM
  if (period === 'PM' && hour !== 12) {
    hour += 12;
  } else if (period === 'AM' && hour === 12) {
    hour = 0; // Midnight
  }

  // Convert hour to 12-hour format
  hour = hour % 12 || 12;

  // Construct the formatted time string
  return `${hour}:${minute < 10 ? '0' : ''}${minute} ${period}`;
};

const adminCancel = async (req, res) => {
  try {
    const orderId = req.query.orderId;
    const notes = req.body.notes;
    console.log("orderId",orderId);
    console.log("notes",notes);
    if (!orderId || !notes) {
      return res.status(400).send({ message: "orderId and notes are required" });
    }

    const orderDetails = await Ordersdb.findOneAndUpdate(
      { _id: orderId }, 
      { $set: { adminNotes: notes }}, 
      { upsert: true, new: true }
      );

    res.status(200).json({ message: "Notes saved", orderDetails})
  } catch (error) {
    console.log("Error in saveNote:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
}

module.exports = {
  placeOrder,
  orderSuccess,
  loadOrderDetails,
  cancelOrder,
  loadOrders,
  loadOrdersDetails,
  adminCancel
}