const express = require('express');
const userRoute = express();
const session = require('express-session');
const { v4:uuidv4 } = require('uuid');  
const userController = require('../controllers/userController');
const productsController = require('../controllers/productsController');
const addressController = require('../controllers/addressController');
const cartController = require('../controllers/cartController');
const ordersController = require('../controllers/ordersController');
const wishlistController = require('../controllers/wishlistController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');



// Parse cookies before other middleware
userRoute.use(cookieParser());
// userRoute.use(auth.attachTokenToLocals); // Use the middleware
userRoute.use(bodyParser.json());

const passport = require('passport'); 
// const cookieSession = require('cookie-session'); 
// require("../services/passport"); 
// userRoute.use(cookieSession({ 
//   name: 'google-auth-session', 
//   keys: ['key1', 'key2'] 
// })); 
userRoute.use(passport.initialize());




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

userRoute.get('/auth' , passport.authenticate('google', { scope: 
  [ 'email', 'profile' ] 
}));
// Auth Callback 
userRoute.get( '/auth/callback', 
  passport.authenticate( 'google', { 
      successRedirect: '/auth/callback/success', 
      failureRedirect: '/auth/callback/failure'
})); 
// Success  
userRoute.get('/auth/callback/success' , (req , res) => { 
  if(!req.user) 
      res.redirect('/auth/callback/failure'); 
  res.send("Welcome " + req.user.email); 
}); 

// failure 
userRoute.get('/auth/callback/failure' ,userController.registerUserGoogle) 

userRoute.get('/register', userController.loadRegister);
userRoute.post('/register' ,userController.intialRegisterUser);

userRoute.post("/verify-otp",userController.registerUser)
userRoute.get('/resend-otp' ,userController.resendOtp);

userRoute.get('/login',userController.loadLogin);
userRoute.post('/login',userController.loginUser)
userRoute.get("/home",auth.isLogin,userController.loadHomePage)

userRoute.get("/cart/count",auth.isLogin,cartController.cartCount)

userRoute.get('/contact-us',userController.loadContactUs);
userRoute.get('/about-us',userController.loadAboutUs);

userRoute.post("/add-to-wishlist",auth.isLogin,wishlistController.addToWishlist)
userRoute.get('/wishlist',wishlistController.loadwishlist);
userRoute.post("/add-to-cart-from-wishlist",auth.isLogin,wishlistController.addToCart)
userRoute.post("/remove-from-wishlist",auth.isLogin,wishlistController.removeWishlistItem)

userRoute.get('/shop', productsController.loadShop);
userRoute.get('/shop/:page', productsController.loadShop);
userRoute.get('/product-details',productsController.loadProductDetails);
userRoute.post("/add-to-cart",auth.isLogin,cartController.addToCart)
userRoute.get("/cart",auth.isLogin,cartController.loadCart)
// userRoute.get("/shop/side-cart",auth.isLogin,cartController.sideCartDetails)
userRoute.post("/cart/update-cart-quantity",auth.isLogin,cartController.updateCartQuantity)
userRoute.post("/cart/check-product-stock",auth.isLogin,cartController.checkProductStock)
userRoute.post("/cart/remove-cart-product",auth.isLogin,cartController.removeCartProduct)
userRoute.get("/cart/remove-all-products",auth.isLogin,cartController.removeAllCartProducts)

userRoute.get("/checkout",auth.isLogin,cartController.loadCheckout)
userRoute.post("/checkout/add-address",auth.isLogin,addressController.addAddressFrmCart)
userRoute.post("/checkout/apply-coupon",auth.isLogin,cartController.applyCoupon)
userRoute.post("/checkout/remove-coupon",auth.isLogin,cartController.removeCoupon)

userRoute.post("/payment",auth.isLogin,ordersController.paymentOption)
userRoute.get("/place-order",auth.isLogin,ordersController.placeOrder)
userRoute.get("/order-success",auth.isLogin,ordersController.orderSuccess)
userRoute.post("/cancel-order",auth.isLogin,ordersController.cancelOrder)


userRoute.get("/profile",auth.attachTokenToLocals,auth.isLogin,userController.loadProfile)
userRoute.get("/profile/orders",auth.attachTokenToLocals,auth.isLogin,userController.loadProfile)
userRoute.get("/profile/orders",auth.attachTokenToLocals,auth.isLogin,userController.loadOrders)
userRoute.get("/order-details",auth.attachTokenToLocals,auth.isLogin,ordersController.loadOrderDetails)
userRoute.post("/update-user-details",auth.attachTokenToLocals,auth.isLogin,userController.updateDetails)
userRoute.post("/profile/add-address",auth.attachTokenToLocals,auth.isLogin,addressController.addNewAddress)
userRoute.get("/profile/edit-address",auth.attachTokenToLocals,auth.isLogin,addressController.editAddress)
userRoute.post("/profile/edit-address",auth.attachTokenToLocals,auth.isLogin,addressController.updateAddress)
userRoute.get("/profile/delete-address",auth.attachTokenToLocals,auth.isLogin,addressController.deleteAddress)
userRoute.post("/profile/change-password",auth.attachTokenToLocals,auth.isLogin,auth.isUser,userController.changePassword)




userRoute.get('/search/suggestions', productsController.getSearchSuggestions);


userRoute.get('/logout', userController.logoutUser);










// userRoute.get('/compare',userController.loadcompare);



module.exports = userRoute;
