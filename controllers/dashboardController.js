const loadAdminDashoard = async (req, res) => {
  try {
  
    res.render("dashboard", {title: 'Admin Dashboard'});
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};


module.exports = {
  loadAdminDashoard,
}