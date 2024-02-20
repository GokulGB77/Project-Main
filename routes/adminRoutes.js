const express = require('express');
const adminRoute = express();
const session = require('express-session');
const { v4:uuidv4 } = require('uuid');  
const adminController = require('../controllers/adminController');
const dashboardController = require('../controllers/dashboardController');
const productsController = require('../controllers/productsController');


const adminAuth = require('../middleware/adminAuth')


adminRoute.use(session({
  secret: uuidv4(),
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }, // Set secure to true if using HTTPS
  }));  


adminRoute.set('view engine','ejs');
adminRoute.set('views','./views/admins')

adminRoute.get('/',adminController.loadAdminLogin);
adminRoute.get('/',adminController.verifyAdminLogin);
adminRoute.get('/dashboard',dashboardController.loadAdminDashoard);

adminRoute.post('/dashboard',dashboardController.loadAdminDashoard);
adminRoute.get("/products",productsController.loadAdminProducts);
adminRoute.get("/products/addProduct",productsController.loadAddProduct)


adminRoute.get("/logout", adminController.adminLogout);



module.exports = adminRoute ;