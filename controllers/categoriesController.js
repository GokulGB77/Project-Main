const Categoriesdb = require("../models/categoriesModel");
const { response } = require("../routes/userRoutes");


const loadAdmincategories = async(req,res)=>{
  try {
  const category = await Categoriesdb.find({});
  res.render("adminCategories",{category})
  } catch (error) {
    console.log(error);
    res.status(500).send("Category Loading Failed")
  }
}

const addCategory = async (req,res) => {
  try {
    const category = await Categoriesdb.create({
      categoryName: req.body.categoryName,
      categoryDetails: req.body.categoryDetails, 
      categoryStatus: req.body.categoryStatus
    })
    console.log(category);
    res.redirect("/admin/categories");

  } catch (error) {
    console.log(error);
    res.status(500).send("Category adding failed");
  }
}

const editCategory = async (req,res) => {
  try {
    const id = req.query.id;
    const categoryClicked = await Categoriesdb.findById(id) ;  
    const category = await Categoriesdb.find({});

    if(!categoryClicked){
      return res.status(404).send("Category Not Found");
    }
    console.log("Product fetched using id...",id);
    res.render("editCategory",{categoryClicked, category})

    
  } catch (error) {
    console.log(error);
    res.status(500).send("Error viewing category");
  }
}

const updateCategory = async (req,res) => {
  try {
    const id =req.query.id;
    
    const updatedCategory = await Categoriesdb.findByIdAndUpdate(id,{
      categoryName: req.body.categoryName,
      categoryDetails: req.body.categoryDetails, 
      categoryStatus: req.body.categoryStatus
    })
    const category = await Categoriesdb.find({})
    
    console.log("Category Updated:",updatedCategory.categoryName);
    res.render("adminCategories",{category,updatedCategory})


  } catch (error) {
    console.log(error);
    res.status(500).send("Category Updation Failed.. Try Again!!")
  }
}

module.exports = {
  loadAdmincategories,
  addCategory,
  editCategory,
  updateCategory
}