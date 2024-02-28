const Userdb = require("../models/userModel")
const Productsdb = require("../models/productsModel")
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');


const sendMail = require("../services/sendMail")
const { generateOTP } = require("../services/genereateOtp");
const sendEmailOtp = require("../services/sendMail");
const send_otp = require("../services/sendMail");
const { request } = require("../routes/userRoutes");
const auth = require("../middleware/auth")



const securePassword = async (password) => {
  try {
    const passwordHash = await argon2.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.error('Error hashing password:', error);
  }
}

const loadRegister = async (req, res) => {
  try {
    const jwtcookie = req.cookies.jwt;
    if(jwtcookie){
      return res.redirect("/")
    } 
    res.render('register',{layout:false,currentPage: 'register' })
  } catch (error) {
    console.log(error.message)
  }
}


// const generateRandomCode = () => {
//   return Math.floor(1000 + Math.random() * 9000).toString(); // Generates a random number between 1000 and 9999 as a string
// };

//intial signup
const intialRegisterUser = async (req, res) => {
  try {

    const spassword = await securePassword(req.body.password);

    //Check if the email or mobile number already exists in the database
    const existingUser = await Userdb.findOne({ $or: [{ email: req.body.email }, { mobile: req.body.mobile }] });
    if (existingUser) {
      return res.render('register', { message: "Email or mobile number already exists. Please use a different one." });
    }

    const OTP = generateOTP()
    //const otpExpiration = Date.now() + 5000 //5 * 60000 =  OTP expires in 5 minutes
    req.session.tempUserDetails = {
      name: req.body.name,
      email: req.body.email,
      mobile: req.body.mobile,
      password: spassword,
      is_admin: 0,
      is_verified: 0,
      status:0,
      otp: OTP,
      // Adding expiration time
      // otpExpiration:  otpExpiration

    };

    req.session.save()
    console.log("This is the tempUserDetails:", req.session.tempUserDetails);
    if (req.session.tempUserDetails) {
      const subject = "Verify Your CouchCart. Account"

      console.log(OTP);
      const html = `<p> Your verification code is: ${OTP} </p>`
      await sendEmailOtp(req.body.email, subject, html);
      console.log("This is the tempUserDetails:", req.session.tempUserDetails);
      res.render("otpVerify", { errorMessage: null });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const resendOtp = async (req, res) => {
  try {
    const OTP = generateOTP(); // Generate a new OTP
    // const newOtpExpiration = Date.now() + 5 * 60000; // 5 * 60000 = OTP expires in 5 minutes
    // Update the OTP in the session data
    req.session.tempUserDetails.otp = OTP;
    // req.session.otpExpiration = newOtpExpiration
    req.session.save()
    console.log("This is the tempUserDetails:", req.session.tempUserDetails);

    const { email } = req.session.tempUserDetails;
    const subject = "Resend OTP for CouchCart Account";
    console.log(OTP);

    const html = `<p>Your new verification code is: ${OTP}</p>`;

    // Resend the OTP via email
    await sendEmailOtp(email, subject, html);

    res.render("otpVerify", { errorMessage: null }); // Render the OTP verification page
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};



const registerUser = async (req, res) => {
  try {
    // Check if OTP is expired
    // if (req.session.tempUserDetails && req.session.tempUserDetails.otpExpiration && Date.now() > req.session.tempUserDetails.otpExpiration) {
      // OTP expired
    //   return res.render("otpVerify", { errorMessage: "OTP expired. Please resend OTP." });
    // }

    if (req.body.otp === req.session.tempUserDetails.otp) {
  
        const user = new Userdb({
        name: req.session.tempUserDetails.name,
        email: req.session.tempUserDetails.email,
        mobile: req.session.tempUserDetails.mobile,
        password: req.session.tempUserDetails.password,
        is_admin: 0,
        is_verified: 1,
      });

      const userData = await user.save();


      const userID = userData._id; 
      const token = auth.createToken(userID);
      res.cookie("jwt", token, {
        httpOnly: true,
        tokenExpiry: auth.tokenExpiry * 1000,
      });

      console.log("userId is :", userData._id);
      console.log("token :", token);
      res.redirect('/'); // Redirect to Home
    } else {
      res.render("otpVerify", { errorMessage: "Not valid OTP" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};




const loadLogin = async (req, res) => {
  try {
    const jwtcookie = req.cookies.jwt;
    if(jwtcookie){
      return res.redirect("/")
    } 
      return res.render('login');
  } catch (error) {
    console.log(error.message);
  }
}



const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const userData = await Userdb.findOne({ email });
    if (!userData) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const status = userData.status;
    if (!status) {
      return res.status(403).json({ message: "User is blocked" });
    }

    const isPasswordValid = await argon2.verify(userData.password, password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const userID = userData._id; 
    const token = auth.createToken(userID);
    res.cookie("jwt", token, {
      httpOnly: true,
      tokenExpiry: auth.tokenExpiry * 1000,
    });

    console.log("User logged in...", "User Name: ", userData.name);
    return res.redirect('/home');
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}



const loadHomePage = async (req, res) => {
  try {
    const token = req.cookies.jwt ? true : false;
    const tokenId = req.cookies.jwt
    res.locals.token = tokenId,
    console.log("User logged in:",tokenId);
    try {
      const allItems = await Productsdb.find({}).populate("category").sort({ _id: 1 })
      const newArrivals= await Productsdb.find({}).populate("category").sort({ _id: -1 })
      const bestSellers= await Productsdb.find({}).populate("category").sort({ productName: 1 })
      const saleItems= await Productsdb.find({}).populate("category").sort({ productName: -1 })
      res.render('homepage', { tokenId, newArrivals,allItems,bestSellers,saleItems});

    } catch (error) {
      console.log("Error getting product data from db:",error)
      res.status(404).send("Error getting product data from db")
    }


  } catch (error) {
    console.log(error.message);
  }
}





const loadProfileSettings = async (req, res) => {
  try {
  console.log("User entered profile settings");
  const token = req.cookies.jwt;
  console.log(`userToken: ${token}`)
  if(token){
    console.log("I am in session");
    res.render("profile",{token})
  } else {
    res.redirect("/login")
  }
  } catch (error) {
    console.log(error)
    res.status(500).send("LoadProfileSettings failed")
  }
}



const logoutUser = async (req, res) => {
  try {
    console.log("User logged out..Session Destroyed");

    // Clear the JWT token from cookies
    res.cookie('jwt', '', { expires: new Date(0) });
    res.redirect("/login",);
  
  } catch (error) {
    console.log(error);
    res.status(500).send("Logout User Failed")
  }
};








module.exports={
  securePassword,
  loadRegister,
  loadLogin,
  loadHomePage,
  intialRegisterUser,
  registerUser,
  loginUser,
  loadProfileSettings,
  resendOtp,
  logoutUser,
  
  
  

}




































// const loadAboutUs = async (req,res)=>{
//   try {
//     res.render("about-us")
//   } catch (error) {
//     console.log(error.message);    
//   }
// } 



 // loadContactUs,
  // loadCart,
  // loadCheckout,
  // loadcompare,
  // loadwishlist,

// const loadContactUs = async (req,res)=>{
//   try {
//     res.render("contact-us")
//   } catch (error) {
//     console.log(error.message);    
//   }
// }

// const loadCart = async (req,res)=>{
//   try {
//     res.render("cart")
//   } catch (error) {
//     console.log(error.message);    
//   }
// }

// const loadCheckout = async (req,res)=>{
//   try {
//     res.render("checkout")
//   } catch (error) {
//     console.log(error.message);    
//   }
// }

// const loadcompare = async (req,res)=>{
//   try {
//     res.render("compare")
//   } catch (error) {
//     console.log(error.message);    
//   }
// }

// const loadwishlist = async (req,res)=>{
//   try {
//     res.render("wishlist")
//   } catch (error) {
//     console.log(error.message);    
//   }
// }