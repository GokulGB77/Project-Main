const jwt = require("jsonwebtoken");
const tokenExpiry = 3 * 24 * 60 * 60;
const Userdb = require("../models/userModel");
const secretKey = process.env.JWT_SECRET;

const createToken = (id) => {
  return jwt.sign({id},secretKey, {
    expiresIn: tokenExpiry,
  })
}




const isLogin = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;
    if(token){
      jwt.verify(token,secretKey,(error,decodedToken) => {
        if(error){
          console.log(error.message);
          res.redirect('/login')
        } else {
          console.log(decodedToken);
          next()
        }
      });
    } else { res.redirect("/") }
  } catch (error) {
    console.log(error.message);
    res.redirect('/login')
  }
}

const isUser = async (req, res, next) => {
  const token = req.cookies.jwt;
  if (token) {
    jwt.verify(token, secretKey, async (err, decodedToken) => {
      if (error) {
        console.log("Error:", error.message);
        res.locals.currentUser = null;
        next();
      } else {
        try {
          let user = await Userdb.findById(decodedToken.id);
          res.locals.currentUser = user;
          next();
        } catch (userError) {
          console.log("User Error:", userError.message);
          res.locals.currentUser = null;
          next();
        }
      }
    });
  } else {
    res.locals.currentUser = null;
    console.log("No token found");
    next();
  }
};






// const isLogout = async (req,res) => {

// }

module.exports= { 
  createToken,
  isLogin, 
  isUser,
  // isLogout,
}