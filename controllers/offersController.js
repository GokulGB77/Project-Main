const Userdb = require("../models/userModel")
const Productsdb = require("../models/productsModel")
const Categoriesdb = require("../models/categoriesModel")
const Offersdb = require("../models/offersModel")




const loadOffers = async (req, res) => {
  try {
    const cOffers = await Offersdb.find({ "categoryOffer.discountPercentage": {  $ne: 0 } }).populate("productOffer.products").populate("categoryOffer.category")
    const categoryOffers = cOffers.categoryOffer
    
    const pOffers = await Offersdb.find({ "productOffer.discountPercentage": {  $ne: 0 } }).populate("productOffer.products").populate("categoryOffer.category")
    const productOffers = pOffers.productsOffer
    
    const rOffers = await Offersdb.find({ "productOffer.discountPercentage": {  $ne: 0 } }).populate("productOffer.products").populate("categoryOffer.category")
    const referralOffers = rOffers.referralOffer

    const categories = await Categoriesdb.find()
    const products = await Productsdb.find().sort({ productName: 1 })
    const referral = await Userdb.find()


    res.render("viewOffers", { cOffers, pOffers, rOffers, categoryOffers, productOffers, referralOffers, categories, products })
  } catch (error) {
    console.error('Error Loading Offers:', error);
    return res.status(500).send("Internal Server Error");
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
      categoryOffer: categoryOffer,
      productOffer: {},

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
      res.json({ message: `Category ${offerDoc.isActive ? 'Blocked' : 'Unblocked'} successfully`, isActive: offerDoc.isActive });
      } catch (error) {
      console.error('Error toggling category offer:', error);
      return res.status(500).send("Category Toggle Failed");
  }
};

const addProductOffer = async (req, res) => {
  try {
    // Extract data from the request body
    const { title, startDate, endDate, selectedProducts, discountPercentage } = req.body;
    console.log("discountPercentage:",discountPercentage)
    console.log("Type:",typeof(discountPercentage))
    // Query the database for the selected products
    const products = await Productsdb.find({ _id: { $in: selectedProducts } });
    const discountPercentageInt =  parseFloat(discountPercentage)
    // Check if products were found
    if (!products || products.length === 0) {
      return res.status(404).json({ error: "Products not found" });
    }

    // Log the title of the product offer
    console.log('Products Offer Title:', title);

    // Construct the product offer object
    const productOffer = {
      applicableProducts: selectedProducts, // Use selectedProducts array
      discountPercentage: discountPercentageInt
    };

    // Create a new offer document
    const newOffer = await Offersdb.create({
      title: title,
      startDate: startDate,
      endDate: endDate,
      productOffer: productOffer,
      categoryOffer: {} // Assuming you have categoryOffer data, adjust as needed
    });

    // Update prices of products in the offer
    await Promise.all(products.map(async (product) => {
      // Update the product offer information
      product.productOffer = discountPercentageInt
     

      // Save the product changes
      await product.save();
    }));

    // Send a response

    res.json({ message: `${newOffer} offer created successfully` });

  } catch (error) {
    console.error('Error adding product offer:', error);
    return res.status(500).send("Product offer adding failed");
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
  addCategoryOffer,
  addProductOffer,
  loadAddCategoryOffer,
  loadAddProductOffer,
  loadAddReferralOffer,
  toggleCategoryOffer
}