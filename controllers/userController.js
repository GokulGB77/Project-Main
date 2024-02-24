const Userdb = require("../models/userModel")
const argon2 = require('argon2');

const sendMail = require("../services/sendMail")
const { generateOTP } = require("../services/genereateOtp");
const sendEmailOtp = require("../services/sendMail");
const send_otp = require("../services/sendMail");



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


// Inserting  new user into the database

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

      // Save the user data to the database
      const userData = await user.save();

      // Authentication successful
      req.session.userId = userData._id; // Store user ID in session
      await req.session.save(); // Save the session

      console.log("userId is :", userData._id);
      res.redirect('/'); // Redirect to Home
    } else {
      res.render("otpVerify", { errorMessage: "Not valid OTP" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};




//Login user methods started
const loadLogin = async (req, res) => {
  try {
    res.render('login');
  } catch (error) {
    console.log(error.message);
  }
}


const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await Userdb.findOne({ email });
    if (!user) {
      return res.render('login', { message: "Invalid email or password" });
    }
    const status = user.status;
    if (!status) {
      return res.render('login', { message: "User is Blocked" });
    }
    const isPasswordValid = await argon2.verify(user.password, password);
    if (!isPasswordValid) {
      return res.render('login', { message: "Invalid email or password" });
    }
    req.session.userId = user._id; 
    req.session.save();
    console.log("User logged in...", "userId is :", user._id);
    if (req.session.userId) {
      return res.redirect('/home');
    } else {
      return res.redirect('/login');
    }
  } catch (error) {
    console.log("Login Error:", error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}






const loadHomePage = async (req, res) => {
  try {
    const isLoggedIn = req.session.userId ? true : false;
    console.log("User logged in:",isLoggedIn);
    res.render('homepage', { isLoggedIn });
  } catch (error) {
    console.log(error.message);
  }
}





const loadProfileSettings = async (req, res) => {
  try {
    console.log("User entered profile settings");

  //Check if the user id logged in 
  if(req.session.userId){
    console.log("I am in session");
    res.render("my-account")
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
    console.log("User logged out");
    // Destroy the session
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to logout' });
    }
    // Redirect the user to the login page or any other desired location
    res.redirect('/login');
  });
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