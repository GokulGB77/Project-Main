const Productsdb = require("../models/productsModel")


const loadAdminProducts = async (req, res) => {
  try {
    const products = await Productsdb.find({});
    res.render("viewProducts", { products: products });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};
const loadAddProduct = async (req, res) => {
  try {
    //const categories = await getCategories();
    console.log("Add product page loadedd...");
    res.render("addProduct");//,{ categories }
  } catch (error) {
    console.log(error.message);
  }
};

const addProduct = async (req, res) => {
  try {

    const images = req.files.map((file) => file.filename);
    console.log(req.body.productTags);
    let productTags;
    if (req.body.productTags) {
      productTags = req.body.productTags.split(" ").map(tag => tag.trim());
    } else {
      productTags = [];
    }
    const newProduct = new Productsdb({
      productName: req.body.productName,
      productSku: req.body.productSku,
      productQty: req.body.productQty,
      images: images,
      productDetails: req.body.productDetails,
      productPrice: req.body.productPrice,
      status: req.body.status,
      productTags: productTags,
      category: req.body.productCategory,

    });

    await newProduct.save();
    console.log("New Product Added..........");
    res.redirect("/admin/products");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error Saving Product Data");
  }
};

const editProduct = async (req,res)=>{
  try {
    console.log("Edit Product Page Loaded");
    const id =req.query.productId
    const product = await Productsdb.findById(id)

    if(!product){
      return res.status(404).send("Product Not Found");
    }

    //const categories = await getCategories();
    res.render("editProduct",{product })   //    res.render("editProduct",{product , categories})

  } catch (error) {
    console.log(error)
    res.status(500).send("Internal Server Error");

  }
}

module.exports = {
  loadAdminProducts,
  loadAddProduct,
  addProduct,
  editProduct,
}