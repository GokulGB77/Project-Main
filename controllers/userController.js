const Userdb = require("../models/userModel")
const Productsdb = require("../models/productsModel")
const Addressdb = require("../models/addressModel")
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');


const sendMail = require("../services/sendMail")
const { generateOTP } = require("../services/genereateOtp");
const sendEmailOtp = require("../services/sendMail");
const send_otp = require("../services/sendMail");
const { request } = require("../routes/userRoutes");
const auth = require("../middleware/auth");
const { devNull } = require("os");



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
    if (jwtcookie) {
      return res.redirect("/")
    }
    res.render('register', { layout: false, currentPage: 'register' })
  } catch (error) {
    console.log(error.message)
  }
}



const intialRegisterUser = async (req, res) => {
  try {

    const spassword = await securePassword(req.body.password);

    //Check if the email or mobile number already exists in the database
    const existingUser = await Userdb.findOne({ $or: [{ email: req.body.email }, { mobile: req.body.mobile }] });
    if (existingUser) {
      return res.render('register', { message: "Email or mobile number already exists. Please use a different one." });
    }

    const OTP = generateOTP()
    const otpExpirationTime = 20000; // 5 * 60 * 1000 = 5 minutes in milliseconds

    req.session.tempUserDetails = {
      name: req.body.name,
      email: req.body.email,
      mobile: req.body.mobile,
      password: spassword,
      is_admin: 0,
      is_verified: 0,
      status: 0,
      otp: OTP,
      // Adding expiration time
      otpExpiration: otpExpirationTime

    };

    req.session.save()
    if (req.session.tempUserDetails) {
      const subject = "Verify Your CouchCart. Account"

      console.log(OTP);
      const html = `<p> Your verification code is: ${OTP} </p>`
      await sendEmailOtp(req.body.email, subject, html);
      console.log("First otp is: " + OTP);

      res.render("otpVerify", { errorMessage: null });


      setTimeout(() => {
        // Clear the OTP from the session
        req.session.tempUserDetails.otp = null;
        req.session.tempUserDetails.otpExpiration = null;
        req.session.save()
        console.log('First OTP expired');
      }, otpExpirationTime);
    }
  } catch (error) {
    console.log(error.message);
  }
};

const resendOtp = async (req, res) => {
  try {
    const OTP = generateOTP();
    const newOtpExpiration = 20000; // 5 * 60 * 1000 = 5 minutes in milliseconds


    // Update the OTP in the session data
    req.session.tempUserDetails.otp = OTP;
    req.session.otpExpiration = newOtpExpiration
    req.session.save()

    const { email } = req.session.tempUserDetails;
    const subject = "Resend OTP for CouchCart Account";

    const html = `<p>Your new verification code is: ${OTP}</p>`;

    // Resend the OTP via email
    await sendEmailOtp(email, subject, html);
    console.log("New otp is: " + OTP);

    // res.render("otpVerify", { errorMessage: null }); // Render the OTP verification page
    res.status(200)
    setTimeout(() => {
      // Clear the OTP from the session
      req.session.tempUserDetails.otp = null;
      req.session.tempUserDetails.newOtpExpiration = null;
      req.session.save()
      console.log('New OTP expired');
    }, newOtpExpiration);


  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};



const registerUser = async (req, res) => {
  try {
    

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
      res.status(200).json({userId: userID});
    } else {
      res.status(400).json({});
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};




const loadLogin = async (req, res) => {
  try {
    const jwtcookie = req.cookies.jwt;
    if (jwtcookie) {
      return res.redirect("/")
    }
    const { error } = req.query
    let errorMessage = '';

    switch (error) {
      case 'blocked':
        errorMessage = 'User is blocked';
        break;
      case 'usernotfound':
        errorMessage = 'User Not Found';
        break;
      case 'invalid':
        errorMessage = 'Invalid Credentials';
        break;
      default:
        errorMessage = '';
    }


    return res.render('login', { error, errorMessage });
  } catch (error) {
    console.log(error.message);
  }
}



const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const userData = await Userdb.findOne({ email });
    if (!userData) {
      return res.redirect('/login?error=usernotfound');
    }

    const status = userData.status;
    if (!status) {
      return res.redirect('/login?error=blocked');
    }

    const isPasswordValid = await argon2.verify(userData.password, password);
    if (!isPasswordValid) {
      return res.redirect('/login?error=invalid');
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
    const userId = req.query.userId
    const token = req.cookies.jwt ? true : false;
    const tokenId = req.cookies.jwt
    res.locals.token = tokenId,
      console.log("User logged in:", tokenId);
    try {
      // const categoryLiving = await Productsdb.find({category:"Living Room Furniture"}).populate("category")
      const products = await Productsdb.find({ status: 1 }).populate("category")
      const allItems = await Productsdb.find({ status: 1 }).populate("category").sort({ _id: 1 }).limit(16);
      const newArrivals = await Productsdb.find({ status: 1 }).populate("category").sort({ _id: -1 }).limit(16);
      const bestSellers = await Productsdb.find({ status: 1 }).populate("category").sort({ productName: 1 }).limit(16);
      const saleItems = await Productsdb.find({ status: 1 }).populate("category").sort({ productName: -1 }).limit(16);
      res.render('homepage', { tokenId, newArrivals, allItems, bestSellers, saleItems, products,userId })

    } catch (error) {
      console.log("Error getting product data from db:", error)
      res.status(404).send("Error getting product data from db")
    }


  } catch (error) {
    console.log(error.message);
  }
}





const loadProfile = async (req, res) => {

  try {
    const userId = req.query.userId
    console.log("User entered User profile");
    const token = req.cookies.jwt;
    const currentUser = res.locals.currentUser;
    console.log("Current User: ", currentUser.name);
    console.log("userId:", res.locals.currentUserId)
    // Use findOne to retrieve a single user document
    const user = await Userdb.findOne({ _id: currentUser._id }).populate('addresses');
    const addressDocument = await Addressdb.findOne({ user: currentUser._id }).sort({_id:1});
    let addresses = addressDocument ? addressDocument.addresses : [];
       // Reorder addresses to show the last added address as the first one
       addresses = addresses.reverse();
    if (token) {
      res.render("profile", { token, currentUser, addresslist: addresses, user,userId });
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("LoadProfile failed");
  }
};



const updateDetails = async (req, res) => {
  try {
    const newName = req.body.name;
    const newMobile = req.body.newMobile
    const id = req.query.id
    console.log(newName, newMobile, id);
    const updateDb = await Userdb.findByIdAndUpdate(id, {
      name: newName,
      mobile: newMobile,
    })
    console.log("User Details Updated");
    res.redirect("/profile?success=true")

  } catch (error) {
    console.log(error)
    res.redirect("/profile?success=false")
  }

}



const changePassword = async (req, res) => {
  try {
      const { currentPwd, newPwd, user1 } = req.body;
      const currentUser = user1; // Assuming currentUser is the username or ID of the current user
      const isUser = await Userdb.findById(currentUser);
      console.log("currentPwd:",currentPwd);
      console.log("currentUser:",user1);
      console.log("isUser:",true);
      
      if (!isUser) {
        return res.status(404).send("User not found");
      }
      const samePassword = await argon2.verify(isUser.password,newPwd)
      if(samePassword){
        return res.redirect("/profile?selected=change-password&samepass=true")
        
      }
      // Verify if the current password matches the user's password
      const isPasswordMatch = await argon2.verify(isUser.password, currentPwd);
      console.log("Passwrod matched with existing password:");
      
      if (!isPasswordMatch) {
        return res.redirect("/profile?selected=change-password&currentpwd=false")
      }

      // Hash the new password
      const hashedNewPwd = await securePassword(newPwd);
      console.log("hashedNewPwd",hashedNewPwd)
      // Update the user's password
      isUser.password = hashedNewPwd;
      await isUser.save();

      console.log("Password Updated Successfully");
      return res.redirect("/profile?updated=true")
    } catch (error) {
      console.log(error);
      res.redirect("/profile?window=change-password&updated=false")
  }
};




const logoutUser = async (req, res) => {
  try {
    console.log("User logged out..Session Destroyed");
    const token = req.cookies.jwt

    // Clear the JWT token from cookies
    res.cookie('jwt', '', { expires: new Date(0) });
    res.redirect("/login",);

  } catch (error) {
    console.log(error);
    res.status(500).send("Logout User Failed")
  }
};








module.exports = {
  securePassword,
  loadRegister,
  loadLogin,
  loadHomePage,
  intialRegisterUser,
  registerUser,
  loginUser,
  loadProfile,
  resendOtp,
  logoutUser,
  updateDetails,
  changePassword,




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