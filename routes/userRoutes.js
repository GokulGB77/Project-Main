const express = require('express');
const userRoute = express();
const session = require('express-session');
const { v4:uuidv4 } = require('uuid');  
const userController = require('../controllers/userController');
const productsController = require('../controllers/productsController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const cookieParser = require('cookie-parser');



// Parse cookies before other middleware
userRoute.use(cookieParser());
userRoute.use(auth.attachTokenToLocals); // Use the middleware

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

userRoute.get('/shop',productsController.loadShop);
userRoute.get('/product-details',productsController.loadProductDetails);

userRoute.get("/profile",auth.isLogin,userController.loadProfileSettings)

userRoute.get('/logout', userController.logoutUser);









// userRoute.get('/about-us',userController.loadAboutUs);
// userRoute.get('/contact-us',userController.loadContactUs);
// userRoute.get('/cart',userController.loadCart);
// userRoute.get('/checkout',userController.loadCheckout);
// userRoute.get('/compare',userController.loadcompare);
// userRoute.get('/wishlist',userController.loadwishlist);



module.exports = userRoute;
