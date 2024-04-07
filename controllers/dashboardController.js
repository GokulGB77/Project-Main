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

//     console.log(orders);


//     // const salesDetails = await Ordersdb.aggregate([
//     //   { $unwind: "$orderProducts" },
//     //   {
//     //     $lookup: {
//     //       from: "Productsdb",
//     //       localField: "orderProducts.product",
//     //       foreignField: "_id",
//     //       as: "product"
//     //     }
//     //   },
//     //   {
//     //     $group: {
//     //       _id: "$orderProducts.product",
//     //       totalOrders: { $sum: 1 },
//     //       totalAmount: { $sum: "$orderProducts.totalPrice" },
//     //       totalAmountWODiscount: { $sum: "$orderProducts.totalPriceWithoutOffer" }
//     //     }
//     //   },
//     //   {
//     //     $sort: { totalOrders: -1 }
//     //   }
//     // ]);


//     // const productIds = salesDetails.map(sale => sale._id); // Extract product IDs
//     // const productDocuments = await Productsdb.find({ _id: { $in: productIds } });
//     // // const productNames = productDocuments.map(product => product.productName);
//     // const productNamesMap = new Map(productDocuments.map(product => [product._id.toString(), product.productName]));

//     // salesDetails.forEach(sale => {
//     //   sale.productName = productNamesMap.get(sale._id.toString());
//     // });

//     // console.log("productNames:", productNames)
//     res.render("salesReport", { allOrders, revenue: totalOrderPriceSum, allProducts, allCategories, allUsers, statuses, orders });
//     // res.render("salesReport", { allOrders, revenue: totalOrderPriceSum, allProducts, allCategories, allUsers, statuses, orders, salesDetails });

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
    const allOrders = await Ordersdb.find({}).sort({ orderDate: -1 });
    const allUsers = await Userdb.find()

    const totalOrderPriceSum = allOrders.reduce((accumulator, currentOrder) => {
      const orderTotalPriceSum = currentOrder.orderProducts.reduce((productAccumulator, currentProduct) => {
        return productAccumulator + currentProduct.totalPrice;
      }, 0);
      return accumulator + orderTotalPriceSum;
    }, 0);

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

    const orders = allOrders.map(order => {
      let orderPriceWODiscount = 0;
      order.orderProducts.forEach(prod => {
        orderPriceWODiscount += prod.quantity * prod.priceWithoutOffer;
      });
      return {
        ...order.toObject(), // Convert Mongoose document to plain JavaScript object
        orderPriceWODiscount: orderPriceWODiscount
      };
    });

    const totalOrdersAmount = orders.reduce((total, order) => {
      return total + order.orderTotal;
    }, 0);
    const totalOrdersCount = orders.length
    const averageOrderTotal = totalOrdersAmount / totalOrdersCount;
    
    const deliveredOrders = orders.filter(order => order.orderStatus === 'delivered');
    const numberOfDeliveredOrders = deliveredOrders.length;
    const pendingOrders = orders.filter(order => order.orderStatus === 'pending');
    const numberOfpendingOrders = pendingOrders.length;
    const cancelledOrders = orders.filter(order => order.orderStatus === 'cancelled');
    const numberOfcancelledOrders = cancelledOrders.length;

    
    // console.log('Number of Delivered Orders:', numberOfDeliveredOrders);
    // console.log('Number of Pending Orders:', numberOfpendingOrders);
    // console.log('Number of Cancelled Orders:', numberOfcancelledOrders);

    const couponDiscountSum = orders.reduce((total, order) => {
      return total + order.couponDiscount;
    }, 0);

    console.log('Coupon Discount Sum:', couponDiscountSum);

    const offerDiscountSum = orders.reduce((total, order) => {
      const orderPriceWODiscount = order.orderPriceWODiscount || 0;
      return total + (orderPriceWODiscount - order.orderTotal);
    }, 0);
    
    console.log('Offer Discount Sum:', offerDiscountSum);

    
    res.render("salesReport", { allOrders, revenue: totalOrderPriceSum, allProducts, allCategories, allUsers, statuses, ordersObj,
      orders,totalOrdersAmount,offerDiscountSum,totalOrdersCount,averageOrderTotal,numberOfDeliveredOrders,numberOfpendingOrders,numberOfcancelledOrders,couponDiscountSum,
      offerDiscountSum

     });

  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
}



const generateSalesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;


    console.log(startDate)
    console.log(endDate)



    const allOrders = await Ordersdb.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ orderDate:-1 })
    const orders = allOrders.map(order => {
      let orderPriceWODiscount = 0;
      order.orderProducts.forEach(prod => {
        orderPriceWODiscount += prod.quantity * prod.priceWithoutOffer;
      });
      return {
        ...order.toObject(), // Convert Mongoose document to plain JavaScript object
        orderPriceWODiscount: orderPriceWODiscount
      };
    });

    const totalOrdersAmount = orders.reduce((total, order) => {
      return total + order.orderTotal;
    }, 0);
    const totalOrdersCount = orders.length
    const averageOrderTotal = totalOrdersAmount / totalOrdersCount;
    
    const deliveredOrders = orders.filter(order => order.orderStatus === 'delivered');
    const numberOfDeliveredOrders = deliveredOrders.length;
    const pendingOrders = orders.filter(order => order.orderStatus === 'pending');
    const numberOfpendingOrders = pendingOrders.length;
    const cancelledOrders = orders.filter(order => order.orderStatus === 'cancelled');
    const numberOfcancelledOrders = cancelledOrders.length;

    
    console.log('Number of Delivered Orders:', numberOfDeliveredOrders);
    console.log('Number of Pending Orders:', numberOfpendingOrders);
    console.log('Number of Cancelled Orders:', numberOfcancelledOrders);

    const couponDiscountSum = orders.reduce((total, order) => {
      return total + order.couponDiscount;
    }, 0);

    console.log('Coupon Discount Sum:', couponDiscountSum);

    const offerDiscountSum = orders.reduce((total, order) => {
      const orderPriceWODiscount = order.orderPriceWODiscount || 0;
      return total + (orderPriceWODiscount - order.orderTotal);
    }, 0);
    
    console.log('Offer Discount Sum:', offerDiscountSum);


    
    res.json({ 
      orders,
      totalOrdersAmount,
      totalOrdersCount,
      averageOrderTotal,
      numberOfDeliveredOrders,
      numberOfpendingOrders,
      numberOfcancelledOrders, 
      couponDiscountSum,
      offerDiscountSum,
      startDate, endDate

    });

  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};


const generateSalesReportPDF = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;


    console.log(startDate)
    console.log(endDate)


    const allOrders = await Ordersdb.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ orderDate:-1 })
    const orders = allOrders.map(order => {
      let orderPriceWODiscount = 0;
      order.orderProducts.forEach(prod => {
        orderPriceWODiscount += prod.quantity * prod.priceWithoutOffer;
      });
      return {
        ...order.toObject(), // Convert Mongoose document to plain JavaScript object
        orderPriceWODiscount: orderPriceWODiscount
      };
    });

    const totalOrdersAmount = orders.reduce((total, order) => {
      return total + order.orderTotal;
    }, 0);
    const totalOrdersCount = orders.length
    const averageOrderTotal = totalOrdersAmount / totalOrdersCount;
    
    const deliveredOrders = orders.filter(order => order.orderStatus === 'delivered');
    const numberOfDeliveredOrders = deliveredOrders.length;
    const pendingOrders = orders.filter(order => order.orderStatus === 'pending');
    const numberOfpendingOrders = pendingOrders.length;
    const cancelledOrders = orders.filter(order => order.orderStatus === 'cancelled');
    const numberOfcancelledOrders = cancelledOrders.length;

    
    // console.log('Number of Delivered Orders:', numberOfDeliveredOrders);
    // console.log('Number of Pending Orders:', numberOfpendingOrders);
    // console.log('Number of Cancelled Orders:', numberOfcancelledOrders);

    const couponDiscountSum = orders.reduce((total, order) => {
      return total + order.couponDiscount;
    }, 0);

    console.log('Coupon Discount Sum:', couponDiscountSum);

    const offerDiscountSum = orders.reduce((total, order) => {
      const orderPriceWODiscount = order.orderPriceWODiscount || 0;
      return total + (orderPriceWODiscount - order.orderTotal);
    }, 0);
    
    console.log('Offer Discount Sum:', offerDiscountSum);


    
    res.render("salesReportPDF",{ 
      orders,
      totalOrdersAmount,
      totalOrdersCount,
      averageOrderTotal,
      numberOfDeliveredOrders,
      numberOfpendingOrders,
      numberOfcancelledOrders, 
      couponDiscountSum,
      offerDiscountSum,
      startDate, endDate

    });

  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};


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


const generateSalesReportPdf = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;


    console.log(startDate)
    console.log(endDate)


    const allOrders = await Ordersdb.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ orderDate:-1 })
    const orders = allOrders.map(order => {
      let orderPriceWODiscount = 0;
      order.orderProducts.forEach(prod => {
        orderPriceWODiscount += prod.quantity * prod.priceWithoutOffer;
      });
      return {
        ...order.toObject(), // Convert Mongoose document to plain JavaScript object
        orderPriceWODiscount: orderPriceWODiscount
      };
    });

    const totalOrdersAmount = orders.reduce((total, order) => {
      return total + order.orderTotal;
    }, 0);
    const totalOrdersCount = orders.length
    const averageOrderTotal = totalOrdersAmount / totalOrdersCount;
    
    const deliveredOrders = orders.filter(order => order.orderStatus === 'delivered');
    const numberOfDeliveredOrders = deliveredOrders.length;
    const pendingOrders = orders.filter(order => order.orderStatus === 'pending');
    const numberOfpendingOrders = pendingOrders.length;
    const cancelledOrders = orders.filter(order => order.orderStatus === 'cancelled');
    const numberOfcancelledOrders = cancelledOrders.length;

    
    // console.log('Number of Delivered Orders:', numberOfDeliveredOrders);
    // console.log('Number of Pending Orders:', numberOfpendingOrders);
    // console.log('Number of Cancelled Orders:', numberOfcancelledOrders);

    const couponDiscountSum = orders.reduce((total, order) => {
      return total + order.couponDiscount;
    }, 0);

    console.log('Coupon Discount Sum:', couponDiscountSum);

    const offerDiscountSum = orders.reduce((total, order) => {
      const orderPriceWODiscount = order.orderPriceWODiscount || 0;
      return total + (orderPriceWODiscount - order.orderTotal);
    }, 0);
    
    console.log('Offer Discount Sum:', offerDiscountSum);


    
    res.render("salesReportPDF",{ 
      orders,
      totalOrdersAmount,
      totalOrdersCount,
      averageOrderTotal,
      numberOfDeliveredOrders,
      numberOfpendingOrders,
      numberOfcancelledOrders, 
      couponDiscountSum,
      offerDiscountSum,
      startDate, endDate

    });
  } catch (error) {
    console.error("Error:", error);
  }

};




module.exports = {
  loadAdminDashoard,
  loadSalesReport,
  generateSalesReport,
  generateSalesReportPDF,
  generateSalesReportPdf,
}