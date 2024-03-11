const Categoriesdb = require("../models/categoriesModel");
const Productsdb = require("../models/productsModel")
const Userdb = require("../models/userModel")
const Cartdb = require("../models/cartModel")
const Addressdb = require("../models/addressModel")


const addToCart = async (req, res) => {
  try {
    const productId = req.body.productId;
    const userId =  req.session.userId;

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
      cartTotal = cartTotal + (item.pPrice*item.quantity) || 0; // Add total price of each product in cart
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
    const userId = req.session.userId;
    console.log("userId:req.session.userId:--",userId)
    const addressDocument = await Addressdb.findOne({ user: userId });
    const addresses = addressDocument ? addressDocument.addresses : [];
    if (!userId) {
      // Handle case where userId is missing in the query parameters
      return res.status(400).json({ error: "User ID is required." });
    }
    
    const cart = await Cartdb.findOne({ user: userId }).populate("cartProducts.product");
    
    if (!cart) {
      // Handle case where cart is not found for the provided userId
      return res.render("cart", { userId, cart: { cartProducts: [] }, index: 0 });    }
    
    return res.render("cart", { userId,addresses, cart, index: 0 });
  } catch (error) {
    console.error("Error Loading Cart: ", error);
    res.status(500).json({ error: "Error Loading Cart." });
  }
};



const updateCartQuantity = async (req, res) => {
  const { productId, cartId, quantity } = req.body;

  try {
      // Find the cart by its ID
      const cart = await Cartdb.findById(cartId);
    
      // Find the index of the product in the cartProducts array
      const productIndex = cart.cartProducts.findIndex(item => item.product.toString() === productId);

      if (productIndex !== -1) {
          // If the product is found in the cartProducts array, update its quantity
          cart.cartProducts[productIndex].quantity = quantity;
          // Update totalPrice based on the new quantity
          cart.cartProducts[productIndex].totalPrice = cart.cartProducts[productIndex].price * quantity;
      } else {
          // If the product is not found in the cartProducts array, push a new item
          // Assuming you have access to product price here
          const product = await Productdb.findById(productId);
          cart.cartProducts.push({
              product: productId,
              quantity: quantity,
              price: product.productPrice,
              totalPrice: product.productPrice * quantity,
          });
      }

      // Calculate the new cartTotal based on the updated cartProducts array
      cart.cartTotal = cart.cartProducts.reduce((total, item) => total + item.totalPrice, 0);

      // Save the updated cart to the database
      await cart.save();

      // Prepare the response with updated subtotal and total values
      const productSubtotal = cart.cartProducts.find(item => item.product.toString() === productId).totalPrice;
      const cartTotal = cart.cartTotal;

           // Log the values to ensure they are correct
          //  console.log("Product Subtotal:", productSubtotal);
          //  console.log("Cart Total:", cartTotal);
      res.status(200).json({ message: 'Cart updated successfully', productSubtotal, cartTotal });
  } catch (error) {
      console.error('Error updating cart:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
};








module.exports = {
  addToCart,
  loadCart,
  updateCartQuantity,
}