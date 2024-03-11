const Userdb = require("../models/userModel")
const Addressdb = require("../models/addressModel")




// Controller function to handle adding a new address
const addNewAddress = async (req, res) => {
  try {

    // Extract the address data from the request body
    const { addname, house, street, city, state, pincode, type, user,mobile } = req.body;
    console.log("current user ID: ", user);

    // Create a new address object
    const newAddress = {
      name: addname,
      house,
      street,
      city,
      state,
      pincode,
      mobile,
      type: type || 'home' // Default to 'home' if type is not provided
    };

    // Check if the user already has an address document
    let existingAddress = await Addressdb.findOne({ user: user });

    if (existingAddress) {
      if (existingAddress.addresses.length >= 4) {
        // Redirect with message if the user has reached the maximum allowed addresses
        req.flash('error', 'You have reached the maximum allowed addresses.');

        return res.redirect("/profile?selected=Address&SizeLimit=true");
      }

      // If the user already has an address document, add the new address to it
      existingAddress.addresses.push(newAddress);
      await existingAddress.save();
    } else {
      // If the user does not have an address document, create a new one
      const address = new Addressdb({
        user: user,
        addresses: [newAddress],
      });

      existingAddress = await address.save();
    }

    // Redirect back to the profile page after adding the address
    req.flash('success', 'New address added successfully.');

    res.redirect("/profile?selected=Address&added=true");
  } catch (error) {
    // Handle errors
    req.flash('error', 'Error adding new address.');

    console.error('Error adding address:', error);
    res.redirect("/profile?selected=Address&notadded=true");
  }
};


//Edit address page loading
const editAddress = async (req, res) => {
  try {
   
    const addressId = req.query.id;

    // Find the document where the addresses array contains an address with the specified ID
    // const addressDetails = await Addressdb.findOne({
    //   'addresses.address._id': addressId
    // });

    const addressDetails = await Addressdb.findOne({
      'addresses._id': addressId
    });
    
    // Check if the address details are found
    if (!addressDetails) {
      return res.status(404).send('Address not found');
    }

    // Find the specific address object within the addresses array
    const addressObject = addressDetails.addresses.find(address => address._id == addressId);

    // Render the editAddress template with the found address object
    res.render('editAddress', { addressObject });
  } catch (error) {
    console.error('Error fetching address details:', error);
    res.redirect('/profile/editAddress',{error});
  }
};



const updateAddress = async (req, res) => {
  try {
    // Extract the address data from the request body
    const { name, house, street, city, state, pincode, type, addressId, mobile } = req.body;
    console.log("Address ID: ", addressId);
    console.log("Address ID received:-----------", addressId);

    // Find the address document where the addresses array contains the address to edit
    const existingAddress = await Addressdb.findOneAndUpdate(
      { "addresses._id": addressId },
      {
        "$set": {
          "addresses.$.name": name,
          "addresses.$.house": house,
          "addresses.$.street": street,
          "addresses.$.city": city,
          "addresses.$.state": state,
          "addresses.$.pincode": pincode,
          "addresses.$.mobile": mobile,
          "addresses.$.type": type || 'home' // Default to 'home' if type is not provided
        }
      },
      { new: true }
    );

    console.log("Existing Address:", existingAddress);

    if (!existingAddress) {
      // Redirect with message if the address to edit is not found
      req.flash('error', 'Address not found.');
      return res.redirect("/profile?selected=Address&notfound=true");
    }

    // Redirect back to the profile page after editing the address
    req.flash('success', 'Address updated successfully.');
    res.redirect("/profile?selected=Address&edited=true");
  } catch (error) {
    // Handle errors
    req.flash('error', 'Error editing address.');
    console.error('Error editing address:', error);
    res.redirect("/profile/edit-address?edited=false");
  }
};

const deleteAddress = async (req, res) => {
  try {
    const addressId = req.query.id; // Get the address ID from the query parameters

    // Find the address document where the user ID matches and the addresses array contains the address to delete
    const existingAddress = await Addressdb.findOne({ "addresses._id": addressId });

    if (!existingAddress) {
      // Redirect with message if the address to delete is not found
      req.flash('error', 'Address not found.');

      return res.redirect("/profile?selected=Address&notfound=true");
    }

    // Remove the address from the addresses array
    existingAddress.addresses = existingAddress.addresses.filter(address => address._id.toString() !== addressId);
    await existingAddress.save();

    // Redirect back to the profile page after deleting the address
    req.flash('success', 'Address deleted successfully.');

    res.redirect("/profile?selected=Address&deleted=true");
  } catch (error) {
    // Handle errors
    req.flash('error', 'Error deleting address.');

    console.error('Error deleting address:', error);
    res.redirect("/profile?selected=Address&notdeleted=true");
  }
};







module.exports = {
  addNewAddress,
  editAddress,
  updateAddress,
  deleteAddress
};



