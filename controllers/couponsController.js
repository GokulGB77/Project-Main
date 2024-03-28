const Couponsdb = require("../models/couponsModel")

const loadCoupons = async (req, res) => {
  try {
    const perPage = 5;
    const page = parseInt(req.query.page) || 1;
    const totalCoupons = await Couponsdb.countDocuments();
    // const totalCoupons = await Couponsdb.countDocuments({
    //   expiryDate: { $gte: new Date() },
    // });
    const totalPages = Math.ceil(totalCoupons / perPage);

    const coupons = await Couponsdb.find()
      // .populate({ path: 'category', select: 'categoryName' })
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage) || null;


    res.render("coupons",
      {
        coupons,
        totalCoupons,
        totalPages,
        currentPage: page
      })
  } catch (error) {
    res.status(500).send("Internal Server Error")
    console.log("Coupon load error", error)
  }
}

// Server-side code
const getCouponList = async (req, res) => {
  try {
      const coupons = await Couponsdb.find({});
      res.json(coupons);
  } catch (error) {
      res.status(500).send("Internal Server Error");
      console.log("Error fetching coupon list", error);
  }
};

const addCoupon = async (req, res) => {
  try {
    const { name, code, discountType, discountValue, expiryDate, minimumOffer, maximumOffer } = req.body;
    const formattedExpiryDate = new Date(expiryDate);
    // const formattedDate = formattedExpiryDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
    const coupon = await Couponsdb.create({
      name,
      code,
      discountType,
      discountValue,
      expiryDate: expiryDate,
      minimumOffer,
      maximumOffer,
      status: 'active',
    });

    res.status(200).json({ success: true, coupon });
  } catch (error) {
    res.status(500).send("Internal Server Error");
    console.log("Coupon load error", error);
  }
};


const updateCoupon = async (req, res) => {
  try {
    const { couponId, name, code, discountType, discountValue, minimumOffer, maximumOffer, expiryDate } = req.body;
    const formattedExpiryDate = new Date(expiryDate);

    // Format the expiry date as "dd-mm-yyyy"
    const formattedDate = formattedExpiryDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '-');
    
    console.log("CouponId:", couponId);
    const coupon = await Couponsdb.findByIdAndUpdate( couponId , {
      $set: {
        name: name,
        code: code,
        discountType: discountType,
        discountValue: discountValue,
        minimumOffer: minimumOffer,
        maximumOffer: maximumOffer,
        expiryDate: expiryDate
      }
    })
    console.log("coupon updated succesfullyy...")
    req.session.toastMessage = "Coupon details updated successfully"; 

    res.redirect("/admin/coupons")
  } catch (error) {
    res.status(500).send("Internal Server Error")
    console.log("Coupon load error", error)
  }
}

const activateCoupon = async (req, res) => {
  try {
    const couponId = req.query.id;
    const coupon = await Couponsdb.findByIdAndUpdate(
      couponId,
      { $set: { status: "active" } },
      { new: true }
    );

    if (!coupon) {
      return res.status(404).json({ error: "Coupon not found" });
    }
    req.session.toastMessage = "Coupon Activated!"; 

    res.status(200).json({ coupon,message: `Status of ${coupon.name} changed` });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
    console.error("Coupon load error", error);
  }
};
const deactivateCoupon = async (req, res) => {
  try {
    const couponId = req.query.id;
    const coupon = await Couponsdb.findByIdAndUpdate(
      couponId,
      { $set: { status: "inactive" } },
      { new: true }
    );

    if (!coupon) {
      return res.status(404).json({ error: "Coupon not found" });
    }
    req.session.toastMessage = "Coupon Deactivated!"; 

    res.status(200).json({ coupon,message: `Status of ${coupon.name} changed` });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
    console.error("Coupon load error", error);
  }
};

module.exports = {
  loadCoupons,
  getCouponList,
  addCoupon,
  updateCoupon,
  activateCoupon,
  deactivateCoupon,
}