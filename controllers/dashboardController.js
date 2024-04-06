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


const loadSalesReport = async (req, res) => {
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

    const statuses = await Ordersdb.distinct('orderStatus');
    const orders = await Ordersdb.find();


    const salesDetails = await Ordersdb.aggregate([
      { $unwind: "$orderProducts" }, 
      {
          $lookup: {
              from: "Productsdb",
              localField: "orderProducts.product",
              foreignField: "_id",
              as: "product"
          }
      },
      {
          $group: {
              _id: "$orderProducts.product",
              totalOrders: { $sum: 1 },
              totalAmount: { $sum: "$orderProducts.totalPrice" }
          }
      },
      {
          $sort: { totalOrders: -1 } 
      }
  ]);
  

    const productIds = salesDetails.map(sale => sale._id); // Extract product IDs
    const productDocuments = await Productsdb.find({ _id: { $in: productIds } });
    // const productNames = productDocuments.map(product => product.productName);
    const productNamesMap = new Map(productDocuments.map(product => [product._id.toString(), product.productName]));

    salesDetails.forEach(sale => {
      sale.productName = productNamesMap.get(sale._id.toString());
  });

    console.log("salesDetails:", salesDetails)
    // console.log("productNames:", productNames)
    res.render("salesReport", { allOrders, revenue: totalOrderPriceSum, allProducts, allCategories, allUsers, statuses, orders, salesDetails });

  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
}

module.exports = {
  loadAdminDashoard,
  loadSalesReport,
}