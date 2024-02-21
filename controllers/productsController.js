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
    // Get all uploaded file names
    const uploadedImages = req.files.map((file) => file.filename);

    // Get removed file names (if any)
    const removedImages = req.body.removeImage || [];

    // Filter out removed files from uploaded images
    const imagesToKeep = uploadedImages.filter((image) => !removedImages.includes(image));

    // Remaining logic remains the same
    let productTags;
    if (req.body.productTags) {
      productTags = req.body.productTags.split(" ").map((tag) => tag.trim());
    } else {
      productTags = [];
    }

    const newProduct = new Productsdb({
      productName: req.body.productName,
      productSku: req.body.productSku,
      productQty: req.body.productQty,
      images: imagesToKeep, // Only save the images that are not removed
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
    const id =req.query.id
    const product = await Productsdb.findOne({_id:id}) //    const product = await Product.findById(id).populate("category");


    if(!product){
      return res.status(404).send("Product Not Found");
    }
    console.log("Product fetched using id...",id);

    //const categories = await getCategories();
    res.render("editProduct",{product})   //    res.render("editProduct",{product , categories})

  } catch (error) {
    console.log(error)
    res.status(500).send("Internal Server Error");


  }
}

const updateProduct = async (req,res) =>{
  try {
    const images = req.files.map((file) => file.filename);
    let productTags;
    if (req.body.productTags) {
      productTags = req.body.productTags.split(" ").map(tag => tag.trim());
    } else {
      productTags = [];
    }
    const newProduct =  Productsdb.findOneAndUpdate({
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
    console.log(error)
    res.status(500).send("Update Product Details Failed.......")
  }
}

module.exports = {
  loadAdminProducts,
  loadAddProduct,
  addProduct,
  editProduct,
  updateProduct
}