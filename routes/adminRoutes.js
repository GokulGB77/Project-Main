const express = require('express');
const adminRoute = express();
const session = require('express-session');
const { v4:uuidv4 } = require('uuid');  
const adminController = require('../controllers/adminController');
const dashboardController = require('../controllers/dashboardController');
const productsController = require('../controllers/productsController');
const categoriesController = require('../controllers/categoriesController');
const multer = require("multer")


const adminAuth = require('../middleware/adminAuth')
const path = require("path")
adminRoute.use(express.static(path.join(__dirname, 'public')));

adminRoute.use(session({
  secret: uuidv4(),
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }, // Set secure to true if using HTTPS
  })); 



const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/productAssets/");
  },
  filename: (req, file, cb) => {
    const uniqueFilename =
      file.fieldname + "_" + uuidv4() + path.extname(file.originalname);
    cb(null, uniqueFilename);
  },
});
const upload = multer({ storage: storage });


adminRoute.set('view engine','ejs');
adminRoute.set('views','./views/admins')

adminRoute.get('/',adminController.loadAdminLogin);
adminRoute.get('/',adminController.verifyAdminLogin);
adminRoute.get('/dashboard',dashboardController.loadAdminDashoard);

adminRoute.post('/dashboard',dashboardController.loadAdminDashoard);

adminRoute.get('/user-details',adminController.userDetails)
adminRoute.get("/user-details/block",adminController.blockUser)
adminRoute.get("/user-details/unblock",adminController.unblockUser)


adminRoute.get("/products",productsController.loadAdminProducts);
adminRoute.get("/products/add-product",productsController.loadAddProduct)
adminRoute.post("/products/add-product",upload.array("productImage", 4),productsController.addProduct)

adminRoute.get("/products/edit-product",productsController.editProduct)
adminRoute.post("/products/edit-product",productsController.updateProduct)

adminRoute.get("/products/archive-product",productsController.archiveProduct)
adminRoute.get("/products/unarchive-product",productsController.unarchiveProduct)
adminRoute.get("/categories/delete-product",productsController.deleteProduct)

adminRoute.get("/categories",categoriesController.loadAdmincategories)
adminRoute.post("/categories/add-category",categoriesController.addCategory)
adminRoute.get("/categories/edit-category",categoriesController.editCategory)
adminRoute.post("/categories/edit-category/update",categoriesController.updateCategory)

adminRoute.get("/categories/disable",categoriesController.disableCategory)
adminRoute.get("/categories/disable",categoriesController.disableCategory)

adminRoute.get("/categories/enable",categoriesController.enableCategory)
adminRoute.get("/categories/enable",categoriesController.enableCategory)



adminRoute.get("/logout", adminController.adminLogout);



module.exports = adminRoute ;