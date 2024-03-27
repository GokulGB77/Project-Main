const Couponsdb = require("../models/couponsModel")

const loadCoupons = async (req,res) => {
try {

  const coupons = await Couponsdb.find() || null
  res.render("coupons",{coupons})

} catch (error) {
  res.status(500).send("Internal Server Error")
  console.log("Coupon load error",error)
}
}


module.exports = {
  loadCoupons,
}