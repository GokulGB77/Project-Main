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

const addProductOffer = async (req, res) => {
  try {
    const { title, description, startDate, endDate, productsList, discountPercentage } = req.body
    const categoryDocument = await Categoriesdb.findOne({ _id: category });


    const products = await Productsdb.find({ _id: productsList })
    if (!products) {
      return res.status(404).json({ error: "Products not found" });
    }
    console.log('Products Offer Title:', title);


    const productOffer = {
      applicableProducts: productsList,
      discountPercentage: discountPercentage
    };
    const newOffer = await Offersdb.create({
      title: title,
      startDate: startDate,
      endDate: endDate,
      productOffer: productOffer
    });

    // Update prices of products in the category
    products.forEach(async (product) => {
      // const newProductPriceAfterDiscount = Math.round(product.productPrice * (1 - (discountPercentage / 100)));
      // product.categoryOfferPrice = newProductPriceAfterDiscount;
      if (!product.productOffer) {
        product.productOffer = ""
      }
      product.productOffer = discountPercentage

      await product.save();
    });



    // Send a response
    res.json({ message: `${newOffer} offer created successfully` });

  } catch (error) {
    console.error('Error adding category offer:', error);
    return res.status(500).send("Category offer adding failed");
  }
}
const addCategoryOffer = async (req, res) => {
  try {
    const { title, description, startDate, endDate, category, discountPercentage } = req.body
    console.log("category:", category)
    const categoryDocument = await Categoriesdb.findOne({ _id: category });

    if (!categoryDocument) {
      return res.status(404).json({ error: "Category not found" });
    } const products = await Productsdb.find({ category: category })

    console.log('Category Offer Title:', title);


    const categoryOffer = {
      category: category,
      discountPercentage: discountPercentage
    };
    const newOffer = await Offersdb.create({
      title: title,
      startDate: startDate,
      endDate: endDate,
      categoryOffer: categoryOffer
    });

    if (!categoryDocument.categoryOffer) {
      categoryDocument.categoryOffer = "";
    }
    categoryDocument.categoryOffer = discountPercentage
    await categoryDocument.save()

    // Update prices of products in the category
    // products.forEach(async (product) => {
    //   // const newProductPriceAfterDiscount = Math.round(product.productPrice * (1 - (discountPercentage / 100)));
    //   // product.categoryOfferPrice = newProductPriceAfterDiscount;
    //   await product.save();
    // });



    // Send a response
    res.json({ message: `${newOffer} offer created successfully` });

  } catch (error) {
    console.error('Error adding category offer:', error);
    return res.status(500).send("Category offer adding failed");
  }
}
const toggleCategoryOffer = async (req, res) => {
  try {
      const categoryOfferId = req.query.id; // Assuming 'id' is the parameter name
      console.log(categoryOfferId);
      let offerDoc = await Offersdb.findById(categoryOfferId);

      // Toggle the isActive status
      offerDoc.isActive = !offerDoc.isActive;
      await offerDoc.save();

      const message = offerDoc.isActive ? 'Category Blocked' : 'Category Unblocked';

      // Send a response
      res.json({ message: `${message}: ${offerDoc} offer toggled successfully`, isActive: offerDoc.isActive });
  } catch (error) {
      console.error('Error toggling category offer:', error);
      return res.status(500).send("Category Toggle Failed");
  }
};






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
  addCategoryOffer,
  addProductOffer,
  loadAddCategoryOffer,
  loadAddProductOffer,
  loadAddReferralOffer,
  toggleCategoryOffer
}