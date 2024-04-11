const Userdb = require("../models/userModel")
const Cartdb = require("../models/cartModel")
const Addressdb = require("../models/addressModel")
const Ordersdb = require("../models/ordersModel")
const Productsdb = require("../models/productsModel")
const Categoriesdb = require("../models/categoriesModel")
const Walletdb = require("../models/walletModel")
const Couponsdb = require("../models/couponsModel")


const loadAdminDashoard = async (req, res) => {
  try {
    const allProducts = await Productsdb.find()
    const allCategories = await Categoriesdb.find()
    const allOrders = await Ordersdb.find({ orderStatus: "delivered" });
    const allUsers = await Userdb.find()

    const totalOrderPriceSum = allOrders.reduce((accumulator, currentOrder) => {
      const orderTotalPriceSum = currentOrder.orderProducts.reduce((productAccumulator, currentProduct) => {
        return productAccumulator + currentProduct.totalPrice;
      }, 0);
      return accumulator + orderTotalPriceSum;
    }, 0);

    console.log("Total sum of all order products' totalPrice:", totalOrderPriceSum);

    res.render("dashboard", { title: 'Admin Dashboard', allOrders, revenue: totalOrderPriceSum, allProducts, allCategories, allUsers, });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};



console.log("nothing")

// const loadSalesReport = async (req, res) => {
//   try {
//     const allProducts = await Productsdb.find()
//     const allCategories = await Categoriesdb.find()
//     const allOrdersCount = await Ordersdb.find({ orderStatus: "delivered" });
//     const allOrders = await Ordersdb.find({}).sort({ orderDate: -1 });
//     const allUsers = await Userdb.find()

//     const totalOrderPriceSum = allOrders.reduce((accumulator, currentOrder) => {
//       const orderTotalPriceSum = currentOrder.orderProducts.reduce((productAccumulator, currentProduct) => {
//         return productAccumulator + currentProduct.totalPrice;
//       }, 0);
//       return accumulator + orderTotalPriceSum;
//     }, 0);

//     const statuses = await Ordersdb.distinct('orderStatus');

//     // Calculate orderPriceWODiscount for each order
//     const ordersObj = allOrders.map(order => {
//       let orderPriceWODiscount = 0;
//       order.orderProducts.forEach(prod => {
//         orderPriceWODiscount += prod.quantity * prod.priceWithoutOffer;
//       });
//       return {
//         ...order.toObject(), // Convert Mongoose document to plain JavaScript object
//         orderPriceWODiscount: orderPriceWODiscount
//       };
//     });

//     const orders = allOrders.map(order => {
//       let orderPriceWODiscount = 0;
//       order.orderProducts.forEach(prod => {
//         orderPriceWODiscount += prod.quantity * prod.priceWithoutOffer;
//       });
//       return {
//         ...order.toObject(), // Convert Mongoose document to plain JavaScript object
//         orderPriceWODiscount: orderPriceWODiscount
//       };
//     });

//     const totalOrdersAmount = orders.reduce((total, order) => {
//       return total + order.orderTotal;
//     }, 0);
//     const totalOrdersCount = orders.length
//     const averageOrderTotal = totalOrdersAmount / totalOrdersCount;

//     const deliveredOrders = orders.filter(order => order.orderStatus === 'delivered');
//     const numberOfDeliveredOrders = deliveredOrders.length;
//     const pendingOrders = orders.filter(order => order.orderStatus === 'pending');
//     const numberOfpendingOrders = pendingOrders.length;
//     const cancelledOrders = orders.filter(order => order.orderStatus === 'cancelled');
//     const numberOfcancelledOrders = cancelledOrders.length;


//     // console.log('Number of Delivered Orders:', numberOfDeliveredOrders);
//     // console.log('Number of Pending Orders:', numberOfpendingOrders);
//     // console.log('Number of Cancelled Orders:', numberOfcancelledOrders);

//     const couponDiscountSum = orders.reduce((total, order) => {
//       return total + order.couponDiscount;
//     }, 0);

//     console.log('Coupon Discount Sum:', couponDiscountSum);

//     const offerDiscountSum = orders.reduce((total, order) => {
//       const orderPriceWODiscount = order.orderPriceWODiscount || 0;
//       return total + (orderPriceWODiscount - order.orderTotal);
//     }, 0);

//     console.log('Offer Discount Sum:', offerDiscountSum);


//     res.render("salesReport", { allOrders, revenue: totalOrderPriceSum, allProducts, allCategories, allUsers, statuses, ordersObj,
//       orders,totalOrdersAmount,offerDiscountSum,totalOrdersCount,averageOrderTotal,numberOfDeliveredOrders,numberOfpendingOrders,numberOfcancelledOrders,couponDiscountSum,
//       offerDiscountSum

//      });

//   } catch (error) {
//     console.log(error.message);
//     res.status(500).send("Internal Server Error");
//   }
// }
const loadSalesReport = async (req, res) => {
  try {
    const allProducts = await Productsdb.find()
    const allCategories = await Categoriesdb.find()
    const allOrdersCount = await Ordersdb.find({ orderStatus: "delivered" });
    const allOrders = await Ordersdb.find({ orderStatus: "delivered" }).sort({ orderDate: -1 });
    const allOrdersUnwinded = await Ordersdb.aggregate([
      { $unwind: "$orderProducts" },
      { $match: { orderStatus: "delivered" } },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "productsdbs",
          localField: "orderProducts.product",
          foreignField: "_id",
          as: "orderProducts.prodDetails"
        }
      }
    ]);

    console.log("allOrdersUnwinded:", allOrdersUnwinded)

    const allUsers = await Userdb.find({ status: 1 })


    const statuses = await Ordersdb.distinct('orderStatus');

    // Calculate orderPriceWODiscount for each order
    const ordersObj = allOrders.map(order => {
      let orderPriceWODiscount = 0;
      order.orderProducts.forEach(prod => {
        orderPriceWODiscount += prod.quantity * prod.priceWithoutOffer;
      });
      return {
        ...order.toObject(), // Convert Mongoose document to plain JavaScript object
        orderPriceWODiscount: orderPriceWODiscount
      };
    });
    let totalPriceSum = 0;
    let totalPriceWithoutOfferSum = 0;

    allOrdersUnwinded.forEach(order => {
      totalPriceSum += order.orderProducts.totalPrice;
      totalPriceWithoutOfferSum += order.orderProducts.totalPriceWithoutOffer;
    });

    console.log("Total Price Sum:", totalPriceSum);
    console.log("Total Price Without Offer Sum:", totalPriceWithoutOfferSum);

    const totalOrdersAmount = allOrdersUnwinded.reduce((total, order) => {
      return total + order.orderProducts.totalPrice;
    }, 0);
    const totalOrdersCount = allOrdersUnwinded.length

    const deliveredOrders = allOrdersUnwinded.length;
    const numberOfDeliveredOrders = deliveredOrders.length;

    const couponDiscountSum = allOrders.reduce((total, order) => {
      return total + order.couponDiscount;
    }, 0);

    // console.log('Coupon Discount Sum:', couponDiscountSum);

    const offerDiscountSum = allOrdersUnwinded.reduce((total, order) => {
      const totalPriceWithoutOffer = order.orderProducts.totalPriceWithoutOffer || 0;
      return total + (totalPriceWithoutOffer - order.orderProducts.totalPrice);
    }, 0);

    // console.log('Offer Discount Sum:', offerDiscountSum);


    res.render("salesReport", {
      allOrders, allOrdersUnwinded, allProducts, totalPriceSum, totalPriceWithoutOfferSum, allCategories, allUsers, statuses, ordersObj, totalOrdersAmount, offerDiscountSum, totalOrdersCount, numberOfDeliveredOrders, couponDiscountSum,
      offerDiscountSum

    });

  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
}




const generateData = async (startDate, endDate) => {
  try {
    let endDate1 = new Date(endDate);
    endDate1.setDate(endDate1.getDate() + 1);
    endDate1 = endDate1.toISOString().slice(0, 10);

    const allProducts = await Productsdb.find();
    const allCategories = await Categoriesdb.find();
    const allOrdersCount = await Ordersdb.find({ orderStatus: "delivered" });
    const allOrders = await Ordersdb.find({ orderStatus: "delivered", "createdAt": { $gte: new Date(startDate), $lt: new Date(endDate1) } }).sort({ orderDate: -1 });
    const allOrdersUnwinded = await Ordersdb.aggregate([
      { $unwind: "$orderProducts" },
      {
        $match: {
          "createdAt": {
            $gte: new Date(startDate),
            $lt: new Date(endDate1)
          },
          "orderStatus": "delivered"
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "productsdbs",
          localField: "orderProducts.product",
          foreignField: "_id",
          as: "orderProducts.prodDetails"
        }
      }
    ]);
    const allUsers = await Userdb.find({ status: 1 });

    const statuses = await Ordersdb.distinct('orderStatus');

    const ordersObj = allOrders.map(order => {
      let orderPriceWODiscount = 0;
      order.orderProducts.forEach(prod => {
        orderPriceWODiscount += prod.quantity * prod.priceWithoutOffer;
      });
      return {
        ...order.toObject(),
        orderPriceWODiscount: orderPriceWODiscount
      };
    });

    let totalPriceSum = 0;
    let totalPriceWithoutOfferSum = 0;

    allOrdersUnwinded.forEach(order => {
      totalPriceSum += order.orderProducts.totalPrice;
      totalPriceWithoutOfferSum += order.orderProducts.totalPriceWithoutOffer;

      const productNameWords = order.orderProducts.prodDetails[0].productName.split(" ");
      const firstThreeWords = productNameWords.slice(0, 3).join(" ");
      order.orderProducts.firstThreeWords = firstThreeWords;
    });

    console.log("Total Price Sum:", totalPriceSum);
    console.log("Total Price Without Offer Sum:", totalPriceWithoutOfferSum);

    const totalOrdersAmount = allOrdersUnwinded.reduce((total, order) => {
      return total + order.orderProducts.totalPrice;
    }, 0);

    const totalOrdersCount = allOrdersUnwinded.length;

    const deliveredOrders = allOrdersUnwinded.length;
    const numberOfDeliveredOrders = deliveredOrders.length;

    const couponDiscountSum = allOrders.reduce((total, order) => {
      return total + order.couponDiscount;
    }, 0);

    const offerDiscountSum = allOrdersUnwinded.reduce((total, order) => {
      const totalPriceWithoutOffer = order.orderProducts.totalPriceWithoutOffer || 0;
      return total + (totalPriceWithoutOffer - order.orderProducts.totalPrice);
    }, 0);

    return {
      allOrders,
      allOrdersUnwinded,
      allProducts,
      totalPriceSum,
      totalPriceWithoutOfferSum,
      allCategories,
      allUsers,
      statuses,
      ordersObj,
      totalOrdersAmount,
      offerDiscountSum,
      totalOrdersCount,
      numberOfDeliveredOrders,
      couponDiscountSum,
      startDate,
      endDate,
    };

  } catch (error) {
    throw new Error(error.message);
  }
}

const generateSalesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    const data = await generateData(startDate, endDate);
    
    res.json(data);

  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
}

const fs = require('fs');
const ejs = require('ejs');
const PDFDocument = require('pdfkit');

const generateSalesReportPDF = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const data = await generateData(startDate, endDate);

   
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};




// const generateSalesReport = async (req, res) => {
//   try {
//     const { startDate, endDate } = req.body;

//     const allProducts = await Productsdb.find();
//     const allCategories = await Categoriesdb.find();
//     const allOrdersCount = await Ordersdb.find({ orderStatus: "delivered" });
//     const allOrders = await Ordersdb.find({ orderStatus: "delivered" }).sort({ orderDate: -1 });
//     const allOrdersUnwinded = await Ordersdb.aggregate([
//       { $unwind: "$orderProducts" },
//       { $match: { orderStatus: "delivered" } },
//       {
//         $match: {
//           createdAt: {
//             $gte: startDate,
//             $lte: endDate
//           }
//         }
//       },
//       { $sort: { createdAt: -1 } },
//       {
//         $lookup: {
//           from: "productsdbs",
//           localField: "orderProducts.product",
//           foreignField: "_id",
//           as: "orderProducts.prodDetails"
//         }
//       }
      
//     ]);
//     console.log("Fetched sales report data:", allOrdersUnwinded);


//     console.log("allOrdersUnwinded:", allOrdersUnwinded);

//     const allUsers = await Userdb.find({ status: 1 });

//     const statuses = await Ordersdb.distinct('orderStatus');

//     const ordersObj = allOrders.map(order => {
//       let orderPriceWODiscount = 0;
//       order.orderProducts.forEach(prod => {
//         orderPriceWODiscount += prod.quantity * prod.priceWithoutOffer;
//       });
//       return {
//         ...order.toObject(),
//         orderPriceWODiscount: orderPriceWODiscount
//       };
//     });

//     let totalPriceSum = 0;
//     let totalPriceWithoutOfferSum = 0;

//     allOrdersUnwinded.forEach(order => {
//       totalPriceSum += order.orderProducts.totalPrice;
//       totalPriceWithoutOfferSum += order.orderProducts.totalPriceWithoutOffer;
//     });

//     console.log("Total Price Sum:", totalPriceSum);
//     console.log("Total Price Without Offer Sum:", totalPriceWithoutOfferSum);

//     const totalOrdersAmount = allOrdersUnwinded.reduce((total, order) => {
//       return total + order.orderProducts.totalPrice;
//     }, 0);
    
//     const totalOrdersCount = allOrdersUnwinded.length;

//     const deliveredOrders = allOrdersUnwinded.length;
//     const numberOfDeliveredOrders = deliveredOrders.length;

//     const couponDiscountSum = allOrders.reduce((total, order) => {
//       return total + order.couponDiscount;
//     }, 0);

//     const offerDiscountSum = allOrdersUnwinded.reduce((total, order) => {
//       const totalPriceWithoutOffer = order.orderProducts.totalPriceWithoutOffer || 0;
//       return total + (totalPriceWithoutOffer - order.orderProducts.totalPrice);
//     }, 0);

//     res.setHeader('Content-Type', 'application/json');

//     res.json({
//       allOrders,
//       allOrdersUnwinded,
//       allProducts,
//       totalPriceSum,
//       totalPriceWithoutOfferSum,
//       allCategories,
//       allUsers,
//       statuses,
//       ordersObj,
//       totalOrdersAmount,
//       offerDiscountSum,
//       totalOrdersCount,
//       numberOfDeliveredOrders,
//       couponDiscountSum,
//       startDate,
//       endDate,
//     });

//   } catch (error) {
//     console.log(error.message);
//     res.status(500).send("Internal Server Error");
//   }
// }








// const generateSalesReportPDF = async (req, res) => {
//   try {
//     const { startDate, endDate } = req.body;


//     console.log(startDate)
//     console.log(endDate)


//     const allOrders = await Ordersdb.find({
//       createdAt: {
//         $gte: startDate,
//         $lte: endDate
//       }
//     }).sort({ orderDate: -1 })
//     const orders = allOrders.map(order => {
//       let orderPriceWODiscount = 0;
//       order.orderProducts.forEach(prod => {
//         orderPriceWODiscount += prod.quantity * prod.priceWithoutOffer;
//       });
//       return {
//         ...order.toObject(), // Convert Mongoose document to plain JavaScript object
//         orderPriceWODiscount: orderPriceWODiscount
//       };
//     });

//     const totalOrdersAmount = orders.reduce((total, order) => {
//       return total + order.orderTotal;
//     }, 0);
//     const totalOrdersCount = orders.length
//     const averageOrderTotal = totalOrdersAmount / totalOrdersCount;

//     const deliveredOrders = orders.filter(order => order.orderStatus === 'delivered');
//     const numberOfDeliveredOrders = deliveredOrders.length;
//     const pendingOrders = orders.filter(order => order.orderStatus === 'pending');
//     const numberOfpendingOrders = pendingOrders.length;
//     const cancelledOrders = orders.filter(order => order.orderStatus === 'cancelled');
//     const numberOfcancelledOrders = cancelledOrders.length;


//     // console.log('Number of Delivered Orders:', numberOfDeliveredOrders);
//     // console.log('Number of Pending Orders:', numberOfpendingOrders);
//     // console.log('Number of Cancelled Orders:', numberOfcancelledOrders);

//     const couponDiscountSum = orders.reduce((total, order) => {
//       return total + order.couponDiscount;
//     }, 0);

//     console.log('Coupon Discount Sum:', couponDiscountSum);

//     const offerDiscountSum = orders.reduce((total, order) => {
//       const orderPriceWODiscount = order.orderPriceWODiscount || 0;
//       return total + (orderPriceWODiscount - order.orderTotal);
//     }, 0);

//     console.log('Offer Discount Sum:', offerDiscountSum);



//     res.render("salesReportPDF", {
//       orders,
//       totalOrdersAmount,
//       totalOrdersCount,
//       averageOrderTotal,
//       numberOfDeliveredOrders,
//       numberOfpendingOrders,
//       numberOfcancelledOrders,
//       couponDiscountSum,
//       offerDiscountSum,
//       startDate, endDate

//     });

//   } catch (error) {
//     console.log(error.message);
//     res.status(500).send("Internal Server Error");
//   }
// };


// const generateSalesReport = async (req, res) => {
//   try {
//     const { startDate, endDate, sortBy } = req.body;

//     let sortByValue;
//     if (sortBy == "Quantity Sold") {
//       sortByValue = "totalQuantity";
//     } else {
//       sortByValue = "totalPrice";

//     }
//     const result = await Ordersdb.aggregate([
//       {
//         $unwind: "$orderProducts" 
//       },
//       {
//         $group: {
//           _id: "$orderProducts.product",
//           totalQuantity: { $sum: "$orderProducts.quantity" }, // Sum of quantity
//           totalPrice: { $sum: "$orderProducts.totalPrice" }, // Sum of totalPrice
//           totalOrderPriceWithoutOffer: { $sum: "$orderProducts.totalPriceWithoutOffer" } // Sum of totalPriceWithoutOffer
//         }
//       },
//       {
//         $sort: { sortByValue: -1 } 
//       }
//     ]);

//     if (result.length > 0) {
//       const { totalQuantity, totalPrice, totalOrderPriceWithoutOffer } = result[0];
//       console.log("Total Quantity:", result);
//     } else {
//       console.log("No orders found.");
//     }
//   } catch (error) {
//     console.error("Error:", error);
//   }

// };


// const generateSalesReportPdf = async (req, res) => {
//   try {
//     const { startDate, endDate } = req.query;


//     console.log(startDate)
//     console.log(endDate)


//     const allOrders = await Ordersdb.find({
//       createdAt: {
//         $gte: startDate,
//         $lte: endDate
//       }
//     }).sort({ orderDate: -1 })
//     const orders = allOrders.map(order => {
//       let orderPriceWODiscount = 0;
//       order.orderProducts.forEach(prod => {
//         orderPriceWODiscount += prod.quantity * prod.priceWithoutOffer;
//       });
//       return {
//         ...order.toObject(), // Convert Mongoose document to plain JavaScript object
//         orderPriceWODiscount: orderPriceWODiscount
//       };
//     });

//     const totalOrdersAmount = orders.reduce((total, order) => {
//       return total + order.orderTotal;
//     }, 0);
//     const totalOrdersCount = orders.length
//     const averageOrderTotal = totalOrdersAmount / totalOrdersCount;

//     const deliveredOrders = orders.filter(order => order.orderStatus === 'delivered');
//     const numberOfDeliveredOrders = deliveredOrders.length;
//     const pendingOrders = orders.filter(order => order.orderStatus === 'pending');
//     const numberOfpendingOrders = pendingOrders.length;
//     const cancelledOrders = orders.filter(order => order.orderStatus === 'cancelled');
//     const numberOfcancelledOrders = cancelledOrders.length;


//     // console.log('Number of Delivered Orders:', numberOfDeliveredOrders);
//     // console.log('Number of Pending Orders:', numberOfpendingOrders);
//     // console.log('Number of Cancelled Orders:', numberOfcancelledOrders);

//     const couponDiscountSum = orders.reduce((total, order) => {
//       return total + order.couponDiscount;
//     }, 0);

//     console.log('Coupon Discount Sum:', couponDiscountSum);

//     const offerDiscountSum = orders.reduce((total, order) => {
//       const orderPriceWODiscount = order.orderPriceWODiscount || 0;
//       return total + (orderPriceWODiscount - order.orderTotal);
//     }, 0);

//     console.log('Offer Discount Sum:', offerDiscountSum);



//     res.render("salesReportPDF", {
//       orders,
//       totalOrdersAmount,
//       totalOrdersCount,
//       averageOrderTotal,
//       numberOfDeliveredOrders,
//       numberOfpendingOrders,
//       numberOfcancelledOrders,
//       couponDiscountSum,
//       offerDiscountSum,
//       startDate, endDate

//     });
//   } catch (error) {
//     console.error("Error:", error);
//   }

// };




module.exports = {
  loadAdminDashoard,
  loadSalesReport,
  generateSalesReport,
  generateSalesReportPDF,
}