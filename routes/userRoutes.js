const express = require('express');
const userRoute = express();
const session = require('express-session');
const { v4:uuidv4 } = require('uuid');  
const userController = require('../controllers/userController');


userRoute.use(session({
  secret: uuidv4(),
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }, // Set secure to true if using HTTPS
  }));  

  userRoute.use((req, res, next) => {
    res.locals.isLoggedIn = req.session.userId ? true : false;
    next();
  });

userRoute.set('view engine','ejs');
userRoute.set('views','./views/users')


userRoute.get('/',userController.loadHomePage);
userRoute.get('/register', userController.loadRegister);
userRoute.post('/register' ,userController.intialRegisterUser);

userRoute.post("/verify-otp",userController.registerUser)
userRoute.get('/resend-otp' ,userController.resendOtp);

userRoute.get('/login',userController.loadLogin);
userRoute.post('/login',userController.loginUser)
userRoute.get("/home",userController.loadHomePage)
userRoute.get("/profile",userController.loadProfileSettings)

userRoute.get('/logout', userController.logoutUser);


// userRoute.get('*',(req,res)=>{
//   res.render("error404")
// });






// userRoute.get('/shop',userController.loadShop);
userRoute.get('/about-us',userController.loadAboutUs);
// userRoute.get('/contact-us',userController.loadContactUs);
// userRoute.get('/cart',userController.loadCart);
// userRoute.get('/checkout',userController.loadCheckout);
// userRoute.get('/compare',userController.loadcompare);
// userRoute.get('/wishlist',userController.loadwishlist);



module.exports = userRoute;
