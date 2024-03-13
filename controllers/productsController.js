const Productsdb = require("../models/productsModel")
const Categoriesdb = require("../models/categoriesModel");
const sharp = require('sharp'); // Import sharp for image cropping




const loadAdminProducts = async (req, res) => {
  try {
    const products = await Productsdb.find({}).sort({_id:-1})
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

const getCategories = async (req,res) => {
  try {
    const categories = await Categoriesdb.find({}, "categoryName").sort({categoryName:1});
    return categories;
  } catch (error) {
    console.error("Get category from database failed: ",error);
    throw error;
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
      stock: req.body.stock,
      images: imagesToKeep, // Only save the images that are not removed
      productDetails: req.body.productDetails,
      productInfo: req.body.productInfo,
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
    const product = await Productsdb.findOne({_id:id}).populate("category");
    
    
    if(!product){
      return res.status(404).send("Product Not Found");
    }
    console.log("Product fetched using id...",id);
    const categories = await getCategories();

    res.render("editProduct",{product,categories})  

  } catch (error) {
    console.log(error)
    res.status(500).send("Error editing product");


  }
}

const updateProduct = async (req, res) => {
  try {
    const id = req.query.id;
    const exstingData = await Productsdb.findById(id)
    // console.log("Existing dattaa.............",exstingData);
    const updatedProductDetails = {
      productName: req.body.productName,
      stock: req.body.stock,
      productDetails: req.body.productDetails,
      productInfo: req.body.productInfo,
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

    const UpdatedDetails = await Productsdb.findByIdAndUpdate(id, updatedProductDetails).populate("category");
    console.log(UpdatedDetails.category.categoryName);
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
    const products = await Productsdb.find({}).sort({productName:1});
    console.log(`Product Archived: ${product.productName}`);
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
    const products = await Productsdb.find({}).sort({productName:1});
    console.log(`Product Unarchived: ${product.productName}`);
    res.render("viewProducts",{products});
   } catch (error) {
    console.log(error);
    res.status(500).send("Unarchive Product Failed");
  }
}




//--------------------------------------User Side---------------------------------

const loadShop = async (req, res) => {
  try {
    const userId = res.locals.currentUserId;
    console.log("userId in shoppage:---- ", userId);
    const perPage = 12; // Number of items per page
    const page = parseInt(req.query.page) || 1; // Extract page number from query parameters
    const skip = (page - 1) * perPage;
    const limit = perPage;

    // Retrieve total count of all items
    const totalCount = await Productsdb.countDocuments();

    // Retrieve total pages based on total count and per page limit
    const totalPages = Math.ceil(totalCount / perPage);

    // Retrieve sorting criteria from query parameters
    const sortBy = req.query.sortBy || 'default'; // Default sorting criteria

    // Retrieve filter criteria from query parameters
    const filterByCategory = req.query.category || null; // Filter by category, if provided
    const filterByStock = req.query.stock || null; // Filter by color, if provided

    // Construct filter object based on filter criteria
    const filter = { status: 1 };
    if (filterByCategory) {
      filter.category = filterByCategory;
    }
    if (filterByColor) {
      filter.stock = filterByStock;
    }

    // Perform database query based on sorting criteria and filter
    let query;
    switch (sortBy) {
      case 'A-Z':
        query = Productsdb.find(filter).sort({ productName: 1 }).skip(skip).limit(limit).populate("category");
        break;
      case 'Z-A':
        query = Productsdb.find(filter).sort({ productName: -1 }).skip(skip).limit(limit).populate("category");
        break;
      case 'Price high to low':
        query = Productsdb.find(filter).sort({ productPrice: -1 }).skip(skip).limit(limit).populate("category");
        break;
      case 'Price low to high':
        query = Productsdb.find(filter).sort({ productPrice: 1 }).skip(skip).limit(limit).populate("category");
        break;
      case 'latest':
        query = Productsdb.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("category");
        break;
      default:
        query = Productsdb.find(filter).skip(skip).limit(limit).populate("category");
    }

    // Execute the query to retrieve paginated items
    const allItems = await query;

    // Render view with paginated items, pagination metadata, and filter criteria
    res.render("shop", { allItems, totalPages, currentPage: page, totalCount, perPage, sortBy, filterByCategory, userId });
  } catch (error) {
    console.log(error);
    res.status(500).send("Products page render failed");
  }
}






const loadProductDetails = async (req,res) => {
  try {
    const id= req.query.id
    const relatedProducts = await Productsdb.find({}).populate("category").limit(4)

    const product = await Productsdb.findById(id).populate("category");
    if (!product) {
      return res.status(404).send("Product not found");
    }
    res.render("productDetails",{product,relatedProducts})
  } catch (error) {
    console.log(error.message)
    res.status(500).send("Internal Server Error");

  }

}



const getSearchSuggestions = async (req, res) => {
  try {
      const partialQuery = req.query.query;
      if (!partialQuery) {
          return res.status(400).json({ error: 'Missing search query' });
      }

      // Query the database for suggestions based on the partial query
      const regex = new RegExp(partialQuery, 'i');
      const suggestions = await Productsdb.find({ productName: { $regex: regex } }).limit(5);

      // Extract the product names from the suggestions
      const suggestionNames = suggestions.map(product => product.productName);

      res.json(suggestionNames);
  } catch (error) {
      console.error('Error fetching search suggestions:', error);
      res.status(500).json({ error: 'An error occurred while fetching search suggestions' });
  }
};

module.exports = { getSearchSuggestions };



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
  loadProductDetails,
  getSearchSuggestions,
}