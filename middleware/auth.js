const isLogin = async (req, res, next) => {

  try {
    if(req.session.user_id){
      res.redirect("my-account")

    } else { res.redirect('/login')}
      next();

  } catch (error) {
    console.log(error.message);
  }

}

module.exports= { isLogin }