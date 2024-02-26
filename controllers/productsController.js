const Productsdb = require("../models/productsModel")
const Categoriesdb = require("../models/categoriesModel");



const loadAdminProducts = async (req, res) => {
  try {
    const products = await Productsdb.find({})
    // .populate({
    //   path: 'categories',
    //   select: 'name',
    //   match: { categoryStatus: 0 }, // Only populate categories with categoryStatus: 0
    // });;
    if(!products){
      return res.status(404).send("Product Not Found")
    }
    res.render("viewProducts", { products: products });
  } catch (error) {
    console.log(error.message);
    console.log("Error loading Product List page: ",error.message);

    res.status(500).send("Error loading Product List page");
  }
};


const loadAddProduct = async (req, res) => {
  try {
    const categories = await getCategories();
    console.log("Add product page loadedd...");
    res.render("addProduct",{ categories });
  } catch (error) {
    console.log("Error loading Product Add page: ",error.message);
  }
};


const getCategories = async (req,res) => {
  try {
    const categories = await Categoriesdb.find({}, "categoryName");
    return categories;
  } catch (error) {
    console.error("Get category from database failed: ",error);
    throw error;
  }
};

const addProduct = async (req, res) => {
  try {
    const uploadedImages = req.files.map((file) => file.filename);

    const removedImages = req.body.removeImage || [];

    const imagesToKeep = uploadedImages.filter((image) => !removedImages.includes(image));

    let productTags;
    if (req.body.productTags) {
      productTags = req.body.productTags.split(",").map((tag) => tag.trim());
    } else {
      productTags = [];
    }

    const newProduct = new Productsdb({
      productName: req.body.productName,
      productSku: req.body.productSku,
      stock: req.body.stock,
      images: imagesToKeep, // Only save the images that are not removed
      productDetails: req.body.productDetails,
      productPrice: req.body.productPrice,
      status: req.body.status,
      productTags: productTags,
      category: req.body.productCategory,
    });

    await newProduct.save();
    // await newProduct.populate('category', 'categoryName').execPopulate();

    console.log("New Product Added..........");
    res.redirect("/admin/products");
  } catch (error) {
    console.error("Error Saving Product Data: ",error);
    res.status(500).send("Error Saving Product Data");
  }
};


const editProduct = async (req,res)=>{
  try {
    console.log("Edit Product Page Loaded");
    const id =req.query.id
    const product = await Productsdb.findOne({_id:id})
    
    
    if(!product){
      return res.status(404).send("Product Not Found");
    }
    console.log("Product fetched using id...",id);
    const categories = await getCategories();

    //const categories = await getCategories();
    res.render("editProduct",{product,categories})  

  } catch (error) {
    console.log(error)
    res.status(500).send("Error editing product:", error);


  }
}

const updateProduct = async (req, res) => {
  try {
    const id = req.query.id;
    const exstingData = await Productsdb.findById(id)
    // console.log("Existing dattaa.............",exstingData);
    const updatedProductDetails = {
      productName: req.body.productName,
      productSku: req.body.productSku,
      stock: req.body.stock,
      productDetails: req.body.productDetails,
      productPrice: req.body.productPrice,
      status: req.body.status,
      category: req.body.productCategory,
    };
    // console.log("Product details updated:",updatedProductDetails);

    if (req.body.productTags) {
      updatedProductDetails.productTags = req.body.productTags.split(",").map(tag => tag.trim());
    } else {
      updatedProductDetails.productTags = [];
    }

    if (req.files && req.files.length > 0) {
      const uploadedImages = req.files.map((file) => file.filename);
      updatedProductDetails.images = uploadedImages;
    }

    const UpdatedDetails = await Productsdb.findByIdAndUpdate(id, updatedProductDetails);
    // console.log(UpdatedDetails);
    console.log("Product details updated..........");
    res.redirect("/admin/products");
  } catch (error) {
    console.log(error);
    res.status(500).send("Update Product Details Failed.......");
  }
};

const archiveProduct = async(req,res) => {
  try {
    const id= req.query.id;
    const product = await Productsdb.findByIdAndUpdate(id,{
      status:1
    })
    const products = await Productsdb.find({});
    console.log(`Product Archived: ${product}`);
    res.render("viewProducts",{products});
   } catch (error) {
    console.log(error);
    res.status(500).send("Archive Product Failed");
  }
}

const unarchiveProduct = async(req,res) => {
  try {
    const id= req.query.id;
    const product = await Productsdb.findByIdAndUpdate(id,{
      status:0
    })
    const products = await Productsdb.find({});
    console.log(`Product Unarchived: ${product}`);
    res.render("viewProducts",{products});
   } catch (error) {
    console.log(error);
    res.status(500).send("Unarchive Product Failed");
  }
}




const loadShop = async (req,res)=>{
  try {
    const products = await Productsdb.find({})
    console.log("Products Fetched From Database");
    res.render("shop",{products})
  } catch (error) {
    console.log(error);
    res.status(500).send("Products page render failed")    
  }
}


module.exports = {
  loadAdminProducts,
  loadAddProduct,
  addProduct,
  editProduct,
  updateProduct,
  archiveProduct,
  unarchiveProduct,
  loadShop,
  getCategories,
}