const Userdb = require("../models/userModel")
const Productsdb = require("../models/productsModel")
const Categoriesdb = require("../models/categoriesModel")
const Offersdb = require("../models/offersModel")




const loadOffers = async (req, res) => {
  try {
    const offers = await Offersdb.find().populate("productOffer.products").populate("categoryOffer.category")
    const categoryOffers = offers.categoryOffer
    const productOffers = offers.productsOffer
    const referralOffers = offers.referralOffer

    const categories = await Categoriesdb.find()
    const products = await Productsdb.find().sort({ productName: 1 })
    const referral = await Categoriesdb.find()


    res.render("viewOffers", { offers, categoryOffers, productOffers, referralOffers, categories, products })
  } catch (error) {
    console.error('Error Loading Offers:', error);
    return res.status(500).send("Internal Server Error");
  }
}

const addCategoryOffer = async (req, res) => {
  try {
    const { title, description, startDate, endDate, category, discountPercentage } = req.body
    console.log("category:",category)
    const categories = await Categoriesdb.find()
    const products = await Productsdb.find({category:category})

    console.log('Category Offer Title:', title);


    const categoryOffer = {
      category: category,
      discountPercentage: discountPercentage
    };
    const newOffer = await Offersdb.create({
      title: title,
      description: description,
      startDate: startDate,
      endDate: endDate,
      categoryOffer: categoryOffer
    });

    // Update prices of products in the category
    products.forEach(async (product) => {
      const newProductPriceAfterDiscount = Math.round(product.productPrice * (1 - (discountPercentage / 100)));
      product.categoryOfferPrice = newProductPriceAfterDiscount;
      await product.save();
    });

    

  // Send a response
  res.json({ message: `${newOffer} offer created successfully` });

} catch (error) {
  console.error('Error adding category offer:', error);
  return res.status(500).send("Category offer adding failed");
}
}


const loadAddCategoryOffer = async (req, res) => {
  try {
    const categories = await Categoriesdb.find()

    res.render("addCategoryOffer", { categories })
  } catch (error) {
    console.error('Error adding category:', error);
    return res.status(500).send("Category adding failed");
  }
}
const loadAddProductOffer = async (req, res) => {
  try {
    const products = await Productsdb.find().sort({ productName: 1 })
    res.render("addProductOffer", { products })
  } catch (error) {
    console.error('Error adding category:', error);
    return res.status(500).send("Category adding failed");
  }
}
const loadAddReferralOffer = async (req, res) => {
  try {
    res.render("addReferralOffer")
  } catch (error) {
    console.error('Error adding category:', error);
    return res.status(500).send("Category adding failed");
  }
}

module.exports = {
  loadOffers,
  loadAddCategoryOffer,
  loadAddProductOffer,
  loadAddReferralOffer,
  addCategoryOffer
}