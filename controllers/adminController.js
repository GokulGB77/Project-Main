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