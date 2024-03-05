const Userdb = require("../models/userModel")
const Addressdb = require("../models/addressModel")



// Controller function to handle adding a new address
const addNewAddress = async (req, res) => {
  try {
    // Access the current user's _id from res.locals.currentUser
    const userId = res.locals.currentUserId;

    // Extract the address data from the request body
    const { addname, house, street, city, state, pincode, type } = req.body;

    // Create a new address object
    const newAddress = {
      name:addname,
      house,
      street,
      city,
      state,
      pincode,
      type: type || 'home' // Default to 'home' if type is not provided
    };

    // Check if the user already has an address document
    const existingAddress = await Addressdb.findOne({ user: userId });

    if (existingAddress) {
      if (existingAddress.addresses.length >= 4) {
        // Redirect with message if the user has reached the maximum allowed addresses
        return res.redirect("/profile?selected=Address&SizeLimit=true");
      }

      // If the user already has an address document, add the new address to it
      existingAddress.addresses.push(newAddress);
      await existingAddress.save();
    } else {
      // If the user does not have an address document, create a new one
      const address = new Addressdb({
        user: userId,
        address: [newAddress],
      });

      await address.save();
    }

    // Redirect back to the profile page after adding the address
    res.redirect("/profile?selected=Address?added=true");
  } catch (error) {
    // Handle errors
    console.error('Error adding address:', error);
    res.redirect("/profile?selected=Address&notadded=true");
  }
};




module.exports = {
  addNewAddress
};



