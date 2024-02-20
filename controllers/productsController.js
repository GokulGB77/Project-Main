const Productsdb = require("../models/productsModel")

const loadAdminProducts = async (req, res) => {
  try {
    // const productId = req.params.productId;
    // const products = await Productsdb.findById(productId);

    // if (!product) {
    //   return res.status(404).send("Product not found");
    // }

    // res.render("viewProducts", { products });
    console.log("Products page loaded");
    res.render("viewProducts", {title: 'Products'});

  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const loadAddProduct = async (req, res) => {
  try {
    //const categories = await getCategories();
    res.render("addProduct" );//,{ categories }
  } catch (error) {
    console.log(error.message);
  }
};

const add_Product = async (req, res) => {
  try {

    const images = req.files.map((file) => file.filename);

    const sizeNames = ["XS", "S", "M", "L", "XL", "XXL"];

    const sizes = sizeNames.map((size) => ({
      size: size,
      quantity: req.body.sizes[size] || 0,
    }));

    console.log(req.body);

    const newProduct = new Product({
      pname: req.body.ProductName,
      price: req.body.ProductPrice,
      description: req.body.ProductDetails,
      sizes: sizes,
      category: req.body.productCategory,
      is_listed: req.body.listed,
      brand: req.body.ProductBrand,
      images: images,
    });

    await newProduct.save();
    console.log(newProduct);
    res.redirect("/admin/products");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  loadAdminProducts,
  loadAddProduct,
}