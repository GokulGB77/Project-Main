const Admindb = require("../models/userModel")
const auth = require("../middleware/auth")
const argon2 = require('argon2');



const loadAdminLogin = async (req,res)=>{
  try {
    console.log("adminLogin rendered");
    res.render('adminLogin')
  } catch (error) {
    console.log(error.message)
  }
}


const verifyAdminLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    console.log("req.body.email:", email);
    console.log("req.body.passwod:", password);


    const adminData = await Admindb.findOne({ email: email });
    console.log("adminData:", adminData);

    if (adminData) {
      const passwordMatch = await argon2.verify(adminData.password,password);
      console.log("Password Verifying......");

      if (passwordMatch && adminData.is_admin === 1) {
        console.log("Password Matched..............");
        const userID = adminData._id
        console.log(adminData.name);

        const token = auth.createToken(userID);
        res.cookie("jwt", token, {
          httpOnly: true,
          tokenExpiry: auth.tokenExpiry * 1000,
        });
        console.log(token);  
        res.redirect("/admin/dashboard");
       
      } else if (adminData.is_admin === "0") {
          res.render("login", {errorMessage: "You do not have permission to access the admin panel.",});
      } else {
        res.render('AdminLogin', { message: "Email and Password is Incorrect" });
      }
    } else {
      res.render('AdminLogin', { message: "User not Found!!!" });
      console.log("User not Found!!!");

    }
    req.session.message = null;


  } catch (error) {
    console.log(error.message);
  }
};

const adminLogout = async (req, res) => {
  try {
    req.session.destroy(() => {
      console.log("Admin logged out");
    });
    res.redirect("/admin");
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Logout failed");
  }
};


const userDetails = async (req,res) => {
  try {
    const users = await Admindb.find({})

    res.render("userDetails",{users})

  } catch (error) {
    console.log(error);
    res.status(500).send("User Details failed to fetch");
  }
}

const blockUser = async (req,res) => {
  try {
    const id = req.query.id;
    const user = await Admindb.findByIdAndUpdate(id,{
      status:1
    })
    const users = await Admindb.find({});
    console.log(`Blocked User:${user.name} `);

    res.render("userDetails",{users});
  } catch (error) {
    console.log(error);
    res.status(500).send("User Blocking Failed");
  }
}

const unblockUser = async (req,res) => {
  try {
    const id = req.query.id;
    const user = await Admindb.findByIdAndUpdate(id,{
      status:0
    })
    const users = await Admindb.find({});
    console.log(`Unblocked User:${user.name} `);

    res.render("userDetails",{users});
  } catch (error) {
    console.log(error);
    res.status(500).send("User Blocking Failed");
  }
}



module.exports = {
  loadAdminLogin,
  userDetails,
  verifyAdminLogin,
  adminLogout,
  blockUser,
  unblockUser,
  
}