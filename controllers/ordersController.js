const Userdb = require("../models/userModel")
const Cartdb = require("../models/cartModel")
const Addressdb = require("../models/addressModel")
const Ordersdb = require("../models/ordersModel")
const Categoriesdb = require("../models/categoriesModel")
const Productsdb = require("../models/productsModel")
const Walletdb = require("../models/walletModel")
const Couponsdb = require("../models/couponsModel")
// const instance = require("../services/razorpay");
const session = require("express-session")
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;


const Razorpay = require('razorpay');
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_SECRET = process.env.RAZORPAY_SECRET;

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});


//-----------------------------User Side---------------------------------------------

const paymentOptionOld = async (req, res) => {
  //   try {
  //     console.log('paymentOption middleware called');
  //     console.log('req.session:', req.session);
  //     console.log('req.session.userId:', req.session.userId);

  //     // const userDetails = res.locals.currentUser;
  //     const userId = req.session.userId;
  //     console.log(userId)
  //     if (!userId) {
  //       throw new Error("User not authenticated");
  //     }

  //     const userDetails = await Userdb.findById(userId)
  //     const userName = userDetails.name;
  //     const userEmail = userDetails.email;
  //     const userMobile = userDetails.mobile;
  //     const { selectedAddress, selectedPaymentMethod, deliveryNotes } = req.body;

  //     if (!selectedAddress ) {
  //       throw new Error("Address is required");
  //     }
  //     if (!selectedPaymentMethod ) {
  //       throw new Error("Choose a Payment Method to Continue");
  //     }
  //     const address = await Addressdb.findOne({ "addresses._id": selectedAddress });
  //     if (!address) {
  //       throw new Error("Selected address not found");
  //     }
  //     const orderAddress = address.addresses.find(addr => addr._id == selectedAddress);

  //     const cart = await Cartdb.findOne({ user: userId }).populate("cartProducts.product");
  //     if (!cart) {
  //       throw new Error("Cart not found for the user");
  //     }

  //     if (cart.cartProducts.length === 0) {
  //       throw new Error("Cart is empty. Add products before placing an order");
  //     }

  //     req.session.selectedAddress = selectedAddress;
  //     req.session.selectedPaymentMethod = selectedPaymentMethod;
  //     req.session.deliveryNotes = deliveryNotes;
  //     req.session.cart = cart;
  //     req.session.save()

  //     if (selectedPaymentMethod === "razorPay"){
  //       let options = {
  //         amount: cart.cartTotal,  // amount in the smallest currency unit
  //         currency: "INR",
  //         receipt: "rpayorder_id"
  //       };
  //       instance.orders.create(options, (err, order) => {
  //         console.log(order);
  //         if(!err){
  //           res.status(200).json({
  //             success:true,
  //             msg:'Order created',
  //             razpayorderId:order.id,
  //             key_id:RAZORPAY_KEY_ID,
  //             cartDetails:cart,
  //             selectedAddress:selectedAddress,
  //             name:userName,
  //             email:userEmail,
  //             mobile:userMobile,
  //           })
  //         } else {
  //           res.status(400).send({success:false,msg:'Something went wrtong!'});
  //         }


  //       });
  //     } 


  //   } catch (error) {
  //     console.error('Error in paymentOption:', error);
  //     res.status(500).json({ message: 'Internal Server Error' });
  //   }
}

const paymentOption = async (req, res) => {
  try {
    // const deliveryCharge = 500
    console.log("in paymentOption(fn)");
    const userId = req.session.userId;
    if (!userId) {
      return res.status(409).json({ error: 'User not authenticated' });
    }

    const userDetails = await Userdb.findById(userId);

    const userName = userDetails.name;
    // console.log("userName:", userName)
    const userEmail = userDetails.email;
    const userMobile = userDetails.mobile;
    const { selectedAddress, selectedPaymentMethod, deliveryNotes, cartId } = req.body;



    // console.log("paymentOption(fn):session selectedPaymentMethod in payment:", selectedPaymentMethod);
    console.log("paymentOption(fn):session address in payment:", selectedAddress);
    const cart = await Cartdb.findOne({ _id: cartId, user: userId }).populate("cartProducts.product");
    if (!cart) {
      return res.status(408).json({ error: 'Cart not found for the user' });
    }

    if (cart.cartProducts.length === 0) {
      return res.status(407).json({ error: 'Cart is empty. Add products before placing an order' });
    }

    const address = await Addressdb.findOne({ "addresses._id": selectedAddress });
    if (!address) {
      res.status(406).json({ error: 'Selected address not found' });
      throw new Error("Selected address not found");
    }
    const orderAddress = address.addresses.find(addr => addr._id == selectedAddress);

    if (orderAddress) {
      orderProducts = cart.cartProducts;
    }
    console.log("paymentOption(fn):orderProducts._id:", orderProducts);

    req.session.selectedAddress = selectedAddress;
    req.session.selectedPaymentMethod = selectedPaymentMethod;
    req.session.deliveryNotes = deliveryNotes;
    req.session.cart = cart;
    req.session.orderAddress = orderAddress;
    req.session.orderProducts = orderProducts;
    req.session.save()

    for (const cartProduct of cart.cartProducts) {
      const product = cartProduct.product;
      // console.log("paymentOption(fn):Checking availability of stock");
      // Check if the quantity in the cart exceeds the available stock
      if (cartProduct.quantity > product.stock) {
        console.log("paymentOption(fn):------------------Checked false for availability of stock");
        return res.status(405).json({ error: `The requested quantity (${cartProduct.quantity}) for ${product.productName} exceeds the available stock (${product.stock}).` });
      }
    }
    // console.log("paymentOption(fn):Checked true for availability of stock");



    if (selectedPaymentMethod === "razorPay") {
      // console.log("paymentOption(fn):entered razorpay");
      const total = cart.cartTotal - cart.couponDiscount //delivery charge replaced
      // const total = cart.cartTotal - cart.couponDiscount + deliveryCharge
      let options = {
        amount: total * 100,
        currency: "INR",
        receipt: "razorPayUser@gmail.com"
      };

      console.log("paymentOption(fn):Options:", options);


      instance.orders.create(options, (err, order) => {
        if (err) {
          // console.log("paymentOption(fn):Error creating order.", err);
          return res.status(500).json({ success: false, message: 'Error creating order.' });
        }
        // console.log("paymentOption(fn):Status 200 sent to Client side");
        return res.status(200).json({
          success: true,
          msg: 'Order created',
          order_id: order.id,
          key_id: RAZORPAY_KEY_ID,
          cartDetails: cart,
          selectedAddress: selectedAddress,
          name: userName,
          email: userEmail,
          mobile: userMobile,
        });

      }
      );


      // instance.orders.create(options, (err, order) => {
      //   if (err) {
      //     console.error(err);
      //     return res
      //       .status(500)
      //       .json({ success: false, message: "Error creating order." });
      //   } 

      //   console.log("paymentOption(fn):Status 200 sent to Client side");
      //   return res.status(200).json({
      //     success: true,
      //     razpayorderId: order.id,
      //     key_id: process.env.RAZORPAY_KEY_ID,
      //     cartDetails: cart,
      //     selectedAddress: selectedAddress,
      //     name: userName,
      //     email: userEmail,
      //     mobile: userMobile,
      //   });
      // });
    } else {
      // console.log("paymentOption(fn):entering cod method");
      // } else if (selectedPaymentMethod === "cod") {
      //   console.log("paymentOption(fn):entering cod method");

      try {
        const redirectURL = "/place-order"
        // console.log("paymentOption(fn):redirectURL:", redirectURL);
        // console.log("paymentOption(fn):Payment type other than RazorPay. Redirecting...");
        return res.status(303).json({
          success: false,
          message: "Payment type other than RazorPay. Redirecting...",
          redirectURL: redirectURL,
        });

      } catch (saveError) {
        // console.error("Error saving order to the database:", saveError);
        return res.status(500).json({
          success: false,
          message: "Error saving order to the database.",
        });
      }

      // res.redirect(`/order-confirmation/${newOrder._id}`);
    }
    //  else {
    //   throw new Error("Invalid Payment Method");
    // }
  } catch (error) {
    console.error('Error in paymentOption:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error', message: error.message });
  }
}

const placeOrder = async (req, res) => {
  try {
    console.log("In placeOrder");
    const userId = req.session.userId;
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const orderId = generateOrderId();
    const currentDate = getCurrentDate();
    const currentTime = getCurrentTime();
    let orderStatus = "pending";
    const selectedAddress = req.session.selectedAddress;
    const selectedPaymentMethod = req.session.selectedPaymentMethod;
    const deliveryNotes = req.session.deliveryNotes;
    const cart = await Cartdb.findOne({ user: userId }).populate("cartProducts.product");
    const orderAddress = req.session.orderAddress;
    const orderTotal = (cart.cartTotal - cart.couponDiscount) //delivery charge replaced
    // const orderTotal = (cart.cartTotal - cart.couponDiscount + 500)
    const orderProducts = cart.cartProducts
    const couponApplied = cart.couponApplied
    const couponDiscount = cart.couponDiscount
    // const priceWithoutOffer = cart.priceWithoutOffer
    // const totalPriceWithoutOffer = cart.totalPriceWithoutOffer

    // const couponApplied = req.session.couponApplied;

    for (const cartProduct of cart.cartProducts) {
      const product = cartProduct.product;
      console.log("placeOrder(fn)::Checking availability of stock");
      // Check if the quantity in the cart exceeds the available stock
      if (cartProduct.quantity > product.stock) {
        console.log("placeOrder(fn)::------------------Checked false for availability of stock");
        return res.status(405).json({ error: `The requested quantity (${cartProduct.quantity}) for ${product.productName} exceeds the available stock (${product.stock}).` });
      }
    }
    // console.log("placeOrder(fn):Checked true for availability of stock");
    // console.log("placeOrder(fn):selectedPaymentMethod", selectedPaymentMethod);


    const order = new Ordersdb({
      user: userId,
      orderId: orderId,
      orderProducts: orderProducts,
      address: orderAddress,
      orderTotal: orderTotal,
      orderDate: currentDate,
      orderTime: currentTime,
      orderStatus: orderStatus,
      paymentMethod: selectedPaymentMethod,
      deliveryNotes: deliveryNotes,
      couponApplied: couponApplied,
      couponDiscount: couponDiscount,
    });

    const orderDetails = await order.save();
    console.log("placeOrder(fn):Order Created and saved to db", orderDetails.orderId);

    const coupon = await Couponsdb.findOne({ name: couponApplied });
    if (coupon) {
      if (!coupon.couponAppliedUsers.includes(userId)) {
        coupon.couponAppliedUsers.push(userId);
        await coupon.save(); // Save changes back to the database
        console.log('User added to couponAppliedUsers array.');
      } else {
        console.log('User already exists in couponAppliedUsers array.');
      }
    } else {
      console.log('Coupon not found.');
    }


    const orderDetailsId = orderDetails.orderId;
    cart.cartProducts = [];
    cart.cartTotal = 0;
    cart.couponApplied = null
    cart.couponDiscount = 0
    await cart.save();
    console.log("placeOrder(fn):Cart data emptied",);
    console.log("placeOrder(fn):Rendering order confirmation");

    return res.render("orderConfirmation", {
      orderAddress,
      orderProducts,
      orderDetails,
      orderTotal, userId
    });



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
    // console.log("orderDetails:", orderDetails)

    res.render("orderDetails", { token, userId, orderId, orderDetails, })
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");

  }
}

const loadOrderInvoice = async (req, res) => {
  try {
    const token = req.cookies.jwt;
    const currentUser = res.locals.currentUser
    const userId = currentUser._id
    const orderId = req.query.id
    const orderDetails = await Ordersdb.findOne({ _id: orderId }).populate("orderProducts.product").populate("user")
    const orderDate = orderDetails.orderDate
    // console.log("orderDetails:", orderDetails)

    res.render("orderInvoice", { token, userId, orderId, orderDetails, })
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");

  }
}


const cancelOrder = async (req, res) => {
  try {
    const orderId = req.query.orderId;
    if (!orderId) {
      throw new Error("Missing orderId parameter.");
    }

    const orderCancelReason = req.body.reason;
    if (!orderCancelReason) {
      throw new Error("Missing order cancellation reason.");
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
    ).populate("user");

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
    const userId = orderDetails.user._id;
    const refundAmount = orderDetails.orderTotal
    const orderType = orderDetails.paymentMethod + "(" + orderDetails.orderStatus + ")"
    const orderID = orderDetails.orderId
    console.log("refundAmount:", refundAmount)
    const wallet = await Walletdb.findOne({ user: userId }).populate("transactions")
    if (orderDetails.paymentMethod === "razorPay" && (orderDetails.orderStatus === "cancelled")) {
      wallet.balance += refundAmount;
      wallet.transactions.push({
        amount: refundAmount,
        description: "Payment for Order " + orderID,
        type: orderType,
      });

      await wallet.save()

      orderDetails.orderStatus = "cancelled"
      await orderDetails.save()
    }


    res.status(200).send({ message: "Order cancelled successfully.", order: orderDetails });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ message: "Error cancelling order." });
  }
};


const cancelOneOrder = async (req, res) => {
  try {
    const orderId = req.body.orderId;
    const productId = req.body.productId;
    // console.log("orderId In controller:", orderId)
    console.log("productId In controller:", productId)
    if (!orderId) {
      throw new Error("Missing orderId parameter.");
    }
    if (!productId) {
      throw new Error("Missing productId parameter.");
    }

    const orderCancelReason = req.body.reason;
    if (!orderCancelReason) {
      throw new Error("Missing order cancellation reason.");
    }

    // console.log("orderCancelReason:", orderCancelReason)
    const additionalReason = req.body.additionalReason || null;

    // console.log("additionalReason:", additionalReason)
    
    // console.log("orderDetails:", orderDetails)

    const orderProductDetails = await Ordersdb.findOneAndUpdate(
      {
        '_id': orderId,
        'orderProducts.product': productId
      }, {
      '$set': {
        'orderProducts.$.orderStatus': 'cancelled',
        'orderProducts.$.orderCancelReason': orderCancelReason,
        'orderProducts.$.additionalReason': additionalReason
      }
    },
    )

    // console.log("orderProductDetails Set:", orderProductDetails)
    if (!orderProductDetails) {
      throw new Error(`Product not found.`);
    }

    const orderDetails = await Ordersdb.findById(orderId)
    if (!orderDetails) {
      throw new Error(`Order not found.`);
    }

    const product = await Productsdb.findById(productId);
    if (product) {
      const stock = parseInt(product.stock);
      const { quantity } = orderProductDetails.orderProducts[0];
      // console.log(stock)
      // console.log(quantity)

      if (!isNaN(stock) && !isNaN(quantity)) {
        product.stock = stock + quantity;
        await product.save();
      } else {
        throw new Error(`Invalid stock quantity.`);
      }
    } else {
      throw new Error(`Product with ID ${productId} not found.`);
    }

    
    
    const allProductsCancelled = orderDetails.orderProducts.every(product => product.orderStatus == 'cancelled');
    if (allProductsCancelled) {
      orderDetails.orderStatus = 'cancelled';
      orderDetails.orderCancelReason = 'Indivually Cancelled all products';
    }

    const userId = orderDetails.user._id;

    const wallet = await Walletdb.findOne({ user: userId }).populate("transactions")
    if (orderDetails.paymentMethod === "razorPay" && (orderProductDetails.orderStatus === "cancelled")) {
      const refundAmount = orderProductDetails.totalPrice
      console.log("Refunding amount to wallet")
      if (isNaN(refundAmount)) {
        throw new Error(`Invalid refund amount.`);
      }
      const orderType = orderDetails.paymentMethod + "(" + orderDetails.orderStatus + ")"
      const orderID = orderDetails.orderId
      wallet.balance += refundAmount;
      // console.log("refundAmount:", refundAmount)
      wallet.transactions.push({
        amount: refundAmount,
        description: "Payment Refund for Product  " + product.productName + orderID,
        type: orderType,
      });


    }
    await wallet.save()
    await orderDetails.save()

    res.status(200).send({ message: "Product cancelled successfully.", order: orderDetails });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ message: "Error cancelling order." });
  }
};






const returnOrder = async (req, res) => {
  try {
    const orderId = req.query.orderId;
    if (!orderId) {
      throw new Error("Missing orderId parameter.");
    }

    const orderReturnReason = req.body.reason;
    if (!orderReturnReason) {
      throw new Error("Missing order Return reason.");
    }

    const additionalReason = req.body.additionalReturnReason || null;

    const orderDetails = await Ordersdb.findOneAndUpdate(
      { _id: orderId },
      {
        $set: {
          orderStatus: "return-requested",
          orderCancelReason: orderReturnReason,
          additionalReason: additionalReason,
        },
      },
      { new: true } // Return the updated document
    ).populate("user");

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
    const userId = orderDetails.user._id;
    // const refundAmount = orderDetails.orderTotal
    // const orderType = orderDetails.paymentMethod + "(" + orderDetails.orderStatus + ")"
    // const orderID = orderDetails.orderId
    // console.log("refundAmount:", refundAmount)
    // // const wallet = await Walletdb.findOne({ user: userId }).populate("transactions")
    // if (orderDetails.paymentMethod === "razorPay" && (orderDetails.orderStatus === "cancelled")) {
    //   wallet.balance += refundAmount;
    //   wallet.transactions.push({
    //     amount: refundAmount,
    //     description: "Payment for Order " + orderID,
    //     type: orderType,
    //   });

    //   await wallet.save()

    //   orderDetails.orderStatus = "cancelled"
    //   await orderDetails.save()
    // }


    res.status(200).send({ message: "Order return initiated.", order: orderDetails });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ message: "Error returning order." });
  }
};

const returnOneOrder = async (req, res) => {
  try {
    const orderId = req.body.orderId;
    const productId = req.body.productId;
    // console.log("orderId In controller:", orderId)
    console.log("productId In controller:", productId)
    if (!orderId) {
      throw new Error("Missing orderId parameter.");
    }
    if (!productId) {
      throw new Error("Missing productId parameter.");
    }

    const orderReturnOneReason = req.body.reason;
    if (!orderReturnOneReason) {
      throw new Error("Missing order cancellation reason.");
    }

    const additionalReason = req.body.additionalReason || null;

    const orderProductDetails = await Ordersdb.findOneAndUpdate(
      {
        '_id': orderId,
        'orderProducts.product': productId
      }, {
      '$set': {
        'orderProducts.$.orderStatus': 'return-requested',
        'orderProducts.$.orderCancelReason': orderReturnOneReason,
        'orderProducts.$.additionalReason': additionalReason
      }
    },
    )

    // console.log("orderProductDetails Set:", orderProductDetails)
    if (!orderProductDetails) {
      throw new Error(`Product not found.`);
    }

    const orderDetails = await Ordersdb.findById(orderId)
    if (!orderDetails) {
      throw new Error(`Order not found.`);
    }

    const product = await Productsdb.findById(productId);
    if (product) {
      const stock = parseInt(product.stock);
      const { quantity } = orderProductDetails.orderProducts[0];
      // console.log(stock)
      // console.log(quantity)

      if (!isNaN(stock) && !isNaN(quantity)) {
        product.stock = stock + quantity;
        await product.save();
      } else {
        throw new Error(`Invalid stock quantity.`);
      }
    } else {
      throw new Error(`Product with ID ${productId} not found.`);
    }

    
    
    const allProductsCancelled = orderDetails.orderProducts.every(product => product.orderStatus == 'return-requested');
    if (allProductsCancelled) {
      orderDetails.orderStatus = 'returned';
      orderDetails.orderCancelReason = 'Indivually Returned all products';
    }

    const userId = orderDetails.user._id;

    const wallet = await Walletdb.findOne({ user: userId }).populate("transactions")
    if (orderDetails.paymentMethod === "razorPay" && (orderProductDetails.orderStatus === "cancelled")) {
      const refundAmount = orderProductDetails.totalPrice
      console.log("Refunding amount to wallet")
      if (isNaN(refundAmount)) {
        throw new Error(`Invalid refund amount.`);
      }
      const orderType = orderDetails.paymentMethod + "(" + orderDetails.orderStatus + ")"
      const orderID = orderDetails.orderId
      wallet.balance += refundAmount;
      // console.log("refundAmount:", refundAmount)
      wallet.transactions.push({
        amount: refundAmount,
        description: "Payment Refund for Product  " + product.productName + orderID,
        type: orderType,
      });


    }
    await wallet.save()
    await orderDetails.save()

    res.status(200).send({ message: "Product Return initiated successfully.", order: orderDetails });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ message: "Error returning order." });
  }
};

//-----------------------------Admin Side---------------------------------------------

const loadOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Get the current page from the query parameter, default to 1 if not provided
    const limit = 5; // Number of orders to display per page
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const allCategories = await Categoriesdb.find();
    const statuses = await Ordersdb.distinct('orderStatus');

    const allOrders = await Ordersdb.find()
      .sort({ orderDate: -1, orderTime: -1 })
      .populate("orderProducts.product")
      .populate("user", "name")
      .skip(startIndex)
      .limit(limit);

    const totalOrders = await Ordersdb.countDocuments();
    const totalPages = Math.ceil(totalOrders / limit);

    if (!allOrders) {
      return res.status(404).send({ message: "No orders found." });
    }

    console.log("allOrders.length:", allOrders.length);

    res.render("viewOrders", {
      allOrders,
      allCategories,
      statuses,
      currentPage: page, // Pass the current page to the view
      totalPages: totalPages, // Pass the total number of pages to the view
    });
  } catch (error) {
    console.error("Error loading orders:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};
const loadOrders1 = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const allCategories = await Categoriesdb.find();
    const statuses = await Ordersdb.distinct('orderStatus');

    const allOrders = await Ordersdb.find()
      .sort({ orderDate: -1, orderTime: -1 })
      .populate("orderProducts.product")
      .populate("user", "name")
      .skip(startIndex)
      .limit(limit);

    const totalOrders = await Ordersdb.countDocuments();
    const totalPages = Math.ceil(totalOrders / limit);

    if (!allOrders) {
      return res.status(404).json({ message: "No orders found." });
    }

    return res.json({
      orders: allOrders,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
      },
    });
  } catch (error) {
    console.error("Error loading orders:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const loadOrdersDetails = async (req, res) => {
  try {
    const orderId = req.query.orderId;
    const orderDetails = await Ordersdb.findOne({ orderId: orderId }).populate("orderProducts.product").populate("user")
    // const deliveryCharge = 500;
    if (!orderDetails) {
      return res.status(404).send({ message: "Order not found" });
    }

    const orderDate = orderDetails.orderDate;
    const formattedDate = formatDate(orderDate);

    const orderTime = orderDetails.orderTime;
    const formattedTime = formatTime(orderTime);

    console.log("orderId:", orderId);
    res.render("orderDetails", { orderDetails, formattedDate, formattedTime, });//delivery charge replaced
    // res.render("orderDetails", { orderDetails, formattedDate, formattedTime, deliveryCharge });
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
    const adminNotes = req.body.notes;

    if (!adminNotes) {
      return res.status(406).json({ message: "Missing order cancellation reason." });
    } else {
      const orderDetails = await Ordersdb.findOneAndUpdate(
        { _id: orderId },
        {
          $set: {
            orderStatus: "cancelled",
            adminNotes: adminNotes
          },
        },
        { new: true } // Return the updated document
      );

      if (!orderDetails) {
        return res.status(404).json({ message: "Order not found." });
      }

      // Add quantities back to product stock
      for (const orderProduct of orderDetails.orderProducts) {
        try {
          const product = await Productsdb.findById(orderProduct.product);
          if (!product) {
            throw new Error(`Product with ID ${orderProduct.product} not found.`);
          }

          product.stock += orderProduct.quantity;
          await product.save();
        } catch (error) {
          console.log("Error in saving product stock:", error);
          // You might want to handle this error differently, maybe skip this product and continue with others.
        }
      }


      const refundAmount = orderDetails.orderTotal - orderDetails.couponDiscount
      const orderType = orderDetails.paymentMethod + "(" + orderDetails.orderStatus + ")"
      const orderID = orderDetails.orderId
      const wallet = await Walletdb.findOne({ user: orderDetails.user }).populate("transactions")
      if (orderDetails.paymentMethod === "razorPay" && (orderDetails.orderStatus === "cancelled")) {
        wallet.balance += refundAmount;
        wallet.transactions.push({
          amount: refundAmount,
          description: "Payment for Order " + orderID,
          type: orderType,
        });

        await wallet.save()
        console.log("Wallet updated")

        orderDetails.orderStatus = "cancelled"
        await orderDetails.save()
      }

      res.status(200).json({ message: "Order cancelled successfully.", orderDetails });
    }


  } catch (error) {
    console.log("Error in adminCancel:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const changeOrderStatus = async (req, res) => {
  const { orderId, selectedStatus } = req.body
  console.log("orderId:", orderId)
  try {
    const order = await Ordersdb.findByIdAndUpdate(orderId, {
      $set: {
        orderStatus: selectedStatus
      }
    })

    if (order) {
      console.log('Order status updated successfully:', order);
      const orderDetails = await Ordersdb.findOne({ _id: orderId })

      const refundAmount = orderDetails.orderTotal - orderDetails.couponDiscount
      const orderType = orderDetails.paymentMethod + "(" + orderDetails.orderStatus + ")"
      const orderID = orderDetails.orderId
      const wallet = await Walletdb.findOne({ user: orderDetails.user }).populate("transactions")
      if (orderDetails.paymentMethod === "razorPay" && (orderDetails.orderStatus === "returned")) {
        wallet.balance += refundAmount;
        wallet.transactions.push({
          amount: refundAmount,
          description: "Payment for Order " + orderID,
          type: orderType,
        });

        await wallet.save()
        await orderDetails.save()

        console.log("Wallet updated")
      }

      res.status(200).json({ message: 'Order status updated successfully', orderDetails });
    } else {
      console.log('Order not found');
      // Send response indicating order not found
      res.status(404).json({ error: 'Order not found' });
    }
  } catch (error) {
    console.log("Error in Updating Status:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

const approveRefund = async (req, res) => {
  try {
    const orderId = req.body.orderId;
    console.log("OrderID:", orderId);
    const orderDetails = await Ordersdb.findById(orderId)
      .populate("orderProducts.product")
      .populate("user");

    if (!orderDetails) {
      return res.status(400).json({ message: "Order not found" });
    }
    console.log("OrderDetails:", orderDetails);
    const userId = orderDetails.user._id;
    const refundAmount = orderDetails.orderTotal - orderDetails.couponDiscount
    const orderType = orderDetails.paymentMethod + "(" + orderDetails.orderStatus + ")"
    const orderID = orderDetails.orderId
    console.log("refundAmount:", refundAmount)
    const wallet = await Walletdb.findOne({ user: userId }).populate("transactions")

    if (orderDetails.paymentMethod === "razorPay" && (orderDetails.orderStatus === "return-requested")) {
      wallet.balance += refundAmount;
      wallet.transactions.push({
        amount: refundAmount,
        description: "Payment refund for Order  " + orderID,
        type: orderType,
      });
    }
    if (orderDetails.paymentMethod === "cod" && orderDetails.orderStatus === "return-requested") {
      wallet.balance += refundAmount;
      wallet.transactions.push({
        amount: refundAmount,
        description: "Payment refund for Order " + orderID,
        type: orderType,
      });
    }
    await wallet.save()

    orderDetails.orderStatus = "returned"
    await orderDetails.save()
    res.status(200).json({ message: "Refund approved. Fund added to user's wallet", orderDetails });
  } catch (error) {
    console.log("Error in approving refund:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  paymentOption,
  placeOrder,
  orderSuccess,
  loadOrderDetails,
  loadOrderInvoice,
  cancelOrder,
  cancelOneOrder,
  returnOrder,
  returnOneOrder,
  loadOrders,
  loadOrders1,
  loadOrdersDetails,
  adminCancel,
  changeOrderStatus,
  approveRefund,
}