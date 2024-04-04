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
    const allProducts  =await Productsdb.find()
    const allCategories  =await Categoriesdb.find()
    const allOrders = await Ordersdb.find({orderStatus:"delivered"});

    const totalOrderPriceSum = allOrders.reduce((accumulator, currentOrder) => {
      const orderTotalPriceSum = currentOrder.orderProducts.reduce((productAccumulator, currentProduct) => {
        return productAccumulator + currentProduct.totalPrice;
      }, 0);
      return accumulator + orderTotalPriceSum;
    }, 0);

    console.log("Total sum of all order products' totalPrice:", totalOrderPriceSum);

    res.render("dashboard", { title: 'Admin Dashboard',allOrders, revenue:totalOrderPriceSum ,allProducts,allCategories});
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};


module.exports = {
  loadAdminDashoard,
}