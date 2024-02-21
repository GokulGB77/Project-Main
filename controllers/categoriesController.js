const Categoriesdb = require("../models/categoriesModel");
const { response } = require("../routes/userRoutes");


const loadAdmincategories = async(req,res)=>{
  try {
  //const category = await Categorydb.find({});

  res.render("adminCategories")
  } catch (error) {
    console.log(error);
    res.status(500).send("Category Loading Failed")
  }
}

const addCategory = async (req,res) => {
  try {
    res.redirect("adminCategories")
  } catch (error) {
    console.log(error)
    res.status(500).send("Category adding failed")
  }
}


module.exports = {
  loadAdmincategories,
  addCategory,
}