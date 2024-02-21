const Userdb = require("../models/userModel")
const argon2 = require('argon2');

const sendMail = require("../services/sendMail")
const { generateOTP } = require("../services/genereateOtp");
const sendEmailOtp = require("../services/sendMail");
const send_otp = require("../services/sendMail");

// Function to securely hash passwords using bcrypt
const securePassword = async (password) => {
  try {
    const passwordHash = await argon2.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.error('Error hashing password:', error);
  }
}

// Function to render the registration page
const loadRegister = async (req, res) => {
  try {
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

    //  Hash the user's password
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
    req.session.save();
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


// Inserting  new user into the database
const registerUser = async (req, res) => {
  try { 
    // Check if OTP is expired
    // if (req.session.tempUserDetails && req.session.tempUserDetails.otpExpiration && Date.now() > req.session.tempUserDetails.otpExpiration) {
      // OTP expired
    //   return res.render("otpVerify", { errorMessage: "OTP expired. Please resend OTP." });
    // }

    if (req.body.otp === req.session.tempUserDetails.otp) {
      //OTP is valid

      //Create a new User instance in the database with the provided data
      const user = new Userdb({
        name: req.session.tempUserDetails.name,
        email: req.session.tempUserDetails.email,
        mobile: req.session.tempUserDetails.mobile,
        password: req.session.tempUserDetails.password,
        is_admin: 0,
        is_verified: 1
      });

      // Save the user data to the database
      const userData = await user.save();
      // const userID = userData._id;
      // const token = authRoutes.createToken(userID);
      // res.cookie("jwt", token,{httpOnly:true,maxAge:authRoutes.maxAge*1000});
      // console.log(token);
      res.redirect("/");
    } else {
      res.render("otpVerify", { errorMessage: "Not valid OTP" });
    }

    // Authentication successful
    req.session.userId = user._id; // Store user ID in session
    req.session.save()
    console.log("userId is :",user._id);
    // res.redirect('/'); // Redirect to Home
    // Check if user is already logged in
    if (req.session.userId) {
      // User is logged in, redirect to profile settings page
      res.redirect('/');
    } else {
      // User is not logged in, redirect to home page
      res.redirect('/login');
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");

  }
}




//Login user methods started
const loadLogin = async (req, res) => {
  try {
    res.render('login');
  } catch (error) {
    console.log(error.message);
  }
}


const loginUser = async (req,res) => {
  const {email, password} = req.body;

  try {
    // Find user by email
    const user = await Userdb.findOne({email});
    if(!user){
      return res.status(400).json({message:"Invalid email or password"});
    }
    
    // Compare passwords
    const isPasswordValid = await argon2.verify(user.password, password);
    if(!isPasswordValid) {
      return res.status(400).json ({message: "Invalid email or password"});
    }
    
    // Authentication successful
    req.session.userId = user._id; // Store user ID in session
    req.session.save()
    console.log("userId is :",user._id);
    // res.redirect('/'); // Redirect to Home
    // Check if user is already logged in
    if (req.session.userId) {
      // User is logged in, redirect to profile settings page
      res.redirect('/');
    } else {
      // User is not logged in, redirect to home page
      res.redirect('/login');
    }


  } catch (error) {
    console.log("Login Error:",error);
    res.status(500).json({ message: 'Internal server error' });

  }
}





//Homepage
// const loadHomePage = async (req, res) => {
//   try {
//     res.render('homepage');
//   } catch (error) {
//     console.log(error.message);
//   }
// }

const loadHomePage = async (req, res) => {
  try {
    const isLoggedIn = req.session.userId ? true : false;
    console.log("isLoggedIn:",isLoggedIn);
    res.render('homepage', { isLoggedIn });
  } catch (error) {
    console.log(error.message);
  }
}



const loadProfileSettings = async (req, res) => {
  console.log("I am in controller");

  //Check if the user id logged in 
  if(req.session.userId){
    console.log("I am in session");
    res.render("my-account")
  } else {
    res.redirect("/login")
  }
}
const logoutUser = (req, res) => {
  // Destroy the session
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to logout' });
    }
    // Redirect the user to the login page or any other desired location
    res.redirect('/login');
  });
};





const loadAboutUs = async (req,res)=>{
  try {
    res.render("about-us")
  } catch (error) {
    console.log(error.message);    
  }
} 



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
  // loadShop,
  loadAboutUs,
  // loadContactUs,
  // loadCart,
  // loadCheckout,
  // loadcompare,
  // loadwishlist,
  

}
// const loadShop = async (req,res)=>{
//   try {
//     res.render("shop")
//   } catch (error) {
//     console.log(error.message);    
//   }
// }



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