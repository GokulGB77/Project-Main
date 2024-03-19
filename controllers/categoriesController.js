const Categoriesdb = require("../models/categoriesModel");
const { response } = require("../routes/userRoutes");


const loadAdmincategories = async (req, res) => {
  try {
    const categories = await Categoriesdb.find({});
    res.render("adminCategories", { categories, errorMessage: "" });
  } catch (error) {
    console.log(error);
    res.status(500).send("Category Loading Failed");
  }
}

const addCategory = async (req, res) => {
  try {
    // const existingCategory = await Categoriesdb.findOne({categoryName :req.body.categoryName })
    const existingCategory = await Categoriesdb.findOne({ categoryName: { $regex: new RegExp('^' + req.body.categoryName + '$', 'i') } });
    if (existingCategory) {
      const categories = await Categoriesdb.find();
      return res.render("adminCategories", {
        categories, errorMessage: "Category already exists",
      });

    }
    const category = await Categoriesdb.create({
      categoryName: req.body.categoryName,
      categoryDetails: req.body.categoryDetails,
      categoryStatus: req.body.categoryStatus
    });

    const categories = await Categoriesdb.find();
    console.log(`Category '${category.categoryName}' added successfully.`);
    return res.render("adminCategories", { categories, errorMessage: "" });
  } catch (error) {
    console.error('Error adding category:', error);
    return res.status(500).send("Category adding failed");
  }
}

const editCategory = async (req, res) => {
  try {
    const id = req.query.id;
    const categoryClicked = await Categoriesdb.findById(id);
    const categories = await Categoriesdb.find({});

    if (!categoryClicked) {
      return res.status(404).send("Category Not Found");
    }
    console.log("Product fetched using id...", id);
    res.render("editCategory", { categoryClicked, categories, errorMessage: null });


  } catch (error) {
    console.log(error);
    res.status(500).send("Error viewing category");
  }
}

const updateCategory = async (req, res) => {
  try {
    const id = req.query.id;
    const categoryClicked = await Categoriesdb.findById(id);

    const existingCategory = await Categoriesdb.findOne({ 
      categoryName: { $regex: new RegExp(req.body.categoryName, "i") }
    })
    if (existingCategory) {
      const categories = await Categoriesdb.find();

      return res.render("editCategory", {
        categories, categoryClicked, errorMessage: "Category already exists",
      });

    }

    const updatedCategory = await Categoriesdb.findByIdAndUpdate(id, {
      categoryName: req.body.categoryName,
      categoryDetails: req.body.categoryDetails,
      categoryStatus: req.body.categoryStatus
    })
    const categories = await Categoriesdb.find({});

    console.log("Category Updated:", updatedCategory.categoryName);
    res.render("adminCategories", { categories, updatedCategory, errorMessage: "" });


  } catch (error) {
    console.log("Category Updation Failed: ", error);
    res.status(500).send("Category Updation Failed.. Try Again!!");
  }
}
// const updateCategory = async (req, res) => {
//   try {
//     const formData = req.body;
//     const categoryName = formData.categoryName;
//     const categoryDetails = formData.categoryDetails;
//     const categoryStatus = formData.categoryStatus;
//     const categoryClickedId = formData.categoryClickedId;

//     console.log("categoryName:",categoryName)
//     console.log("categoryDetails:",categoryDetails)
//     console.log("categoryStatus:",categoryStatus)
//     console.log("categoryClickedId:",categoryClickedId)
//     // const categoryClicked = await Categoriesdb.findById(categoryClickedId);

//     const existingCategory = await Categoriesdb.findOne({ _id: categoryClickedId })
//     if (existingCategory) {
//       const categories = await Categoriesdb.find();

//       return res.status(404).send({errorMessage: "Category already exists"});
//       // return res.render("editCategory", {
//       //   categories, categoryClicked, errorMessage: "Category already exists",
//       // });

//     }

//     const updatedCategory = await Categoriesdb.findByIdAndUpdate(categoryClickedId, {
//       categoryName: categoryName,
//       categoryDetails: categoryDetails,
//       categoryStatus: categoryStatus
//     })
//     const categories = await Categoriesdb.find({});

//     console.log("Category Updated:", updatedCategory.categoryName);
//     res.status(200).json({ categories, updatedCategory});
//     // res.render("adminCategories", { categories, updatedCategory, errorMessage: "" });

//   } catch (error) {
//     console.error("Category Updation Failed: ", error);
//     res.status(500).send(`Category Updation Failed: ${error.message}`);
//   }
// }

const disableCategory = async (req, res) => {
  try {
    const id = req.query.id;
    const disabledCategory = await Categoriesdb.findByIdAndUpdate(id, {
      categoryStatus: 0
    })
    const categories = await Categoriesdb.find({});

    console.log("Category Disabled:", disabledCategory.categoryName);
    res.render("adminCategories", { categories, errorMessage: "" });

  } catch (error) {
    console.log("Category disabling failed: ", error);
    res.status(500).send("Category disabling failed");
  }
}

const enableCategory = async (req, res) => {
  try {
    const id = req.query.id;
    const enabledCategory = await Categoriesdb.findByIdAndUpdate(id, {
      categoryStatus: 1
    });
    const categories = await Categoriesdb.find({});

    console.log("Category Enabled:", enabledCategory.categoryName);
    res.render("adminCategories", { categories, errorMessage: "" });

  } catch (error) {
    console.log("Category enabling failed: ", error);
    res.status(500).send("Category enabling failed");
  }
}




module.exports = {
  loadAdmincategories,
  addCategory,
  editCategory,
  updateCategory,
  disableCategory,
  enableCategory,

}