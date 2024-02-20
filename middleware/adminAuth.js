const isLogin = async (req, res, next) => {
  try {
    if (req.session.user_id) {}
    else{
      res.redirect('/admin')
    }
    next();
  } catch (error) {
    console.log(error.message);
  }
}

const isLogout = async (req, res, next) => {
  try {
    if (req.session.user_id) {
      res.redirect('/admin/home')
    }
    next();
  } catch (error) {
    console.log(error.message);
  }
}
const isAdmin = async (req,res,next) => {
  try {
  if(req.session.is_admin===1){
    next();
  }
  else{

    res.redirect('/admin',{ message: 'You are not an Authorised Admin' })
  }    
  } catch (error) {
    console.log(error.message)
  }
}

module.exports={
  isLogin,
  isLogout,
  isAdmin
}