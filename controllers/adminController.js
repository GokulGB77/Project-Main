const Admindb = require("../models/userModel")
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

      if (passwordMatch) {
        console.log("Password Matched..............");

        if (adminData.is_admin === 0) {
          console.log("You are not an authorised admin..........");

          res.render('login', { message: "You are not an authorised admin..........." });
        } else {
          console.log("Authorised admin Loggedin");

          req.session.admin_id = adminData._id;
          req.session.is_admin = adminData.is_admin;
          res.redirect("/dashboard");
        }

      } else {
        console.log("1 Email and Password is Incorrect");

        res.render('login', { message: "Email and Password is Incorrect" });
      }
    } else {
      res.render('login', { message: "Email and Password is Incorrect" });
      console.log("2 Email and Password is Incorrect");

    }

  } catch (error) {
    console.log(error.message);
  }
};

const adminLogout= async(req,res)=>{
  try {
    console.log("Admin logged out");
    res.redirect("/")
  } catch (error) {
    console.log(error.message);
  }
}



module.exports = {
  loadAdminLogin,
  verifyAdminLogin,
  adminLogout
}