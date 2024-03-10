const Categoriesdb = require("../models/categoriesModel");
const Productsdb = require("../models/productsModel")
const Userdb = require("../models/userModel")
const Cartdb = require("../models/cartModel")


const addToCart = async (req, res) => {
  try {
    const productId = req.body.productId;
    const userId = req.query.user;

    const userDetails = await Userdb.findById(userId);
    const productDetails = await Productsdb.findById(productId).populate("category");
    const pPrice = productDetails.productPrice;
    const pImg = productDetails.images[0];

    let cart = await Cartdb.findOne({ user: userId });

    if (!cart) {
      // If cart doesn't exist, create a new one
      cart = await Cartdb.create({
        user: userId,
        cartProducts: [],
        cartTotal: 0
      });
    }

    const existingProductIndex = cart.cartProducts.findIndex(item => item.product && item.product.equals(productId));

    if (existingProductIndex !== -1) {
      // If the product exists in the cart, increase its quantity by 1
      cart.cartProducts[existingProductIndex].quantity += 1;
      // Update total price if quantity is more than 1
      if (cart.cartProducts[existingProductIndex].quantity > 1) {
        cart.cartProducts[existingProductIndex].totalPrice = cart.cartProducts[existingProductIndex].price * cart.cartProducts[existingProductIndex].quantity;
      }
    } else {
      // If the product doesn't exist, add it to the cart with quantity 1
      cart.cartProducts.push({
        product: productDetails,
        quantity: 1, // Initialize quantity to 1
        price: pPrice,
        totalPrice: pPrice, // Initialize total price to price of a single product
        pImg:pImg
      });
    }

    // Calculate cart total
    let cartTotal = 0;
    cart.cartProducts.forEach(item => {
      cartTotal += item.totalPrice || 0; // Add total price of each product in cart
    });

    // Set cartTotal
    cart.cartTotal = parseInt(cartTotal);

    // Save the updated cart (with new cart total)
    await cart.save();

    res.status(200).json({ message: "Product added to cart successfully" });
  } catch (error) {
    console.error("Error Adding Product To Cart: ", error);
    res.status(500).json({ error: "Error adding product to cart" });
  }
}

const loadCart = async (req, res) => {
  try {
    const userId = req.query.user;
    if (!userId) {
      // Handle case where userId is missing in the query parameters
      return res.status(400).json({ error: "User ID is required." });
    }
    
    console.log(userId);
    const cart = await Cartdb.findOne({ user: userId }).populate("cartProducts.product");
    
    if (!cart) {
      // Handle case where cart is not found for the provided userId
      return res.status(404).json({ error: "Cart not found." });
    }
    
    return res.render("cart", { userId, cart, index: 0 });
  } catch (error) {
    console.error("Error Loading Cart: ", error);
    res.status(500).json({ error: "Error Loading Cart." });
  }
};


const updateCartQuantity = async (req, res) => {
  try {
    const userId = req.query.user;
    const productId = req.body.productId;
    const newQuantity = req.body.quantity;

    // Find the user's cart and populate the cart products
    const cart = await Cartdb.findOne({ user: userId }).populate("cartProducts.product");

    // Find the index of the product in the cart products array
    const productIndex = cart.cartProducts.findIndex(item => item.product._id.toString() === productId);

    if (productIndex !== -1) {
      // Update the quantity of the product
      cart.cartProducts[productIndex].quantity = newQuantity;

      // Save the updated cart
      await cart.save();

      // Send a success response with user ID included
      res.status(200).json({ userId: userId, message: "Product Quantity Updated Successfully" });
    } else {
      // If the product is not found in the cart, send a 404 error
      res.status(404).json({ error: "Product not found in cart" });
    }
  } catch (error) {
    console.error("Error Updating Cart Quantity: ", error);
    res.status(500).json({ error: "Error Updating Cart Quantity" });
  }
};





module.exports = {
  addToCart,
  loadCart,
  updateCartQuantity,
}