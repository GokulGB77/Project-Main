const express = require('express');
const userRoute = express();
const session = require('express-session');
const { v4:uuidv4 } = require('uuid');  
const userController = require('../controllers/userController');
const productsController = require('../controllers/productsController');
const addressController = require('../controllers/addressController');
const cartController = require('../controllers/cartController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');



// Parse cookies before other middleware
userRoute.use(cookieParser());
// userRoute.use(auth.attachTokenToLocals); // Use the middleware
userRoute.use(bodyParser.json());

userRoute.use(session({
  secret: uuidv4(),
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }, // Set secure to true if using HTTPS
  }));  


  userRoute.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });


userRoute.set('view engine','ejs');
userRoute.set('views','./views/users')

userRoute.get("*",auth.isUser)

userRoute.get('/',userController.loadHomePage);
userRoute.get('/register', userController.loadRegister);
userRoute.post('/register' ,userController.intialRegisterUser);

userRoute.post("/verify-otp",userController.registerUser)
userRoute.get('/resend-otp' ,userController.resendOtp);

userRoute.get('/login',userController.loadLogin);
userRoute.post('/login',userController.loginUser)
userRoute.get("/home",auth.isLogin,userController.loadHomePage)

userRoute.get('/shop', productsController.loadShop);
userRoute.get('/shop/:page', productsController.loadShop);
userRoute.get('/product-details',productsController.loadProductDetails);
userRoute.post("/add-to-cart",auth.isLogin,cartController.addToCart)
userRoute.get("/cart",auth.isLogin,cartController.loadCart)
// userRoute.get("/shop/side-cart",auth.isLogin,cartController.sideCartDetails)
userRoute.post("/cart/update-cart-quantity",auth.isLogin,cartController.updateCartQuantity)

userRoute.get("/profile",auth.attachTokenToLocals,auth.isLogin,userController.loadProfile)
userRoute.post("/update-user-details",auth.attachTokenToLocals,auth.isLogin,userController.updateDetails)
userRoute.post("/profile/add-address",auth.attachTokenToLocals,auth.isLogin,addressController.addNewAddress)
userRoute.get("/profile/edit-address",auth.attachTokenToLocals,auth.isLogin,addressController.editAddress)
userRoute.post("/profile/edit-address",auth.attachTokenToLocals,auth.isLogin,addressController.updateAddress)
userRoute.get("/profile/delete-address",auth.attachTokenToLocals,auth.isLogin,addressController.deleteAddress)
userRoute.post("/profile/change-password",auth.attachTokenToLocals,auth.isLogin,auth.isUser,userController.changePassword)




userRoute.get('/search/suggestions', productsController.getSearchSuggestions);


userRoute.get('/logout', userController.logoutUser);









// userRoute.get('/about-us',userController.loadAboutUs);
// userRoute.get('/contact-us',userController.loadContactUs);
// userRoute.get('/cart',userController.loadCart);
// userRoute.get('/checkout',userController.loadCheckout);
// userRoute.get('/compare',userController.loadcompare);
// userRoute.get('/wishlist',userController.loadwishlist);



module.exports = userRoute;
