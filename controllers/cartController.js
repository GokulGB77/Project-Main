const Categoriesdb = require("../models/categoriesModel");
const Productsdb = require("../models/productsModel")
const Userdb = require("../models/userModel")
const Cartdb = require("../models/cartModel")
const Addressdb = require("../models/addressModel")
const MAX_CART_QUANTITY = 10;


const addToCart = async (req, res) => {
  try {
    const productId = req.body.productId;
    const userId =  req.session.userId;

    const userDetails = await Userdb.findById(userId);
    const productDetails = await Productsdb.findById(productId).populate("category");
    const pPrice = productDetails.productPrice;
    const pImg = productDetails.images[0];

    let cart = await Cartdb.findOne({ user: userId });

    // Check if the cart already contains the maximum quantity limit
    let cartQuantity = 0;
    if (cart) {
      cart.cartProducts.forEach(item => {
        cartQuantity += item.quantity;
      });
    }

    if (cartQuantity >= MAX_CART_QUANTITY) {
      return res.status(400).json({ error: "Cart already contains the maximum quantity limit" });
    }

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
        pImg: pImg
      });
    }

    // Calculate cart total
    let cartTotal = 0;
    cart.cartProducts.forEach(item => {
      cartTotal = cartTotal + (item.pPrice * item.quantity) || 0; // Add total price of each product in cart
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
    cart.cartTotal = cart.cartProducts.reduce((total, item) => total + item.totalPrice, 0);
    let deliveryCharge = 500
      const Total = cart.cartTotal + deliveryCharge;

    if (!cart) {
      // Handle case where cart is not found for the provided userId
      return res.render("cart", { userId, cart: { cartProducts: [] }, index: 0 });    }
    
    return res.render("cart", { userId,Total,addresses, cart, index: 0 });
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
          const product = await Productsdb.findById(productId);
          cart.cartProducts.push({
              product: productId,
              quantity: quantity,
              price: product.productPrice,
              totalPrice: product.productPrice * quantity,
          });
      }

      // Update the totalPrice for all products in the cart
      cart.cartProducts.forEach(item => {
        item.totalPrice = item.price * item.quantity;
      });

      // Calculate the new cartTotal based on the updated cartProducts array
      cart.cartTotal = cart.cartProducts.reduce((total, item) => total + item.totalPrice, 0);

      // Save the updated cart to the database
      await cart.save();

      // Prepare the response with updated subtotal and total values
      const productSubtotal = cart.cartProducts.find(item => item.product.toString() === productId).totalPrice;
      const cartTotal = cart.cartTotal;
      let deliveryCharge = 500
      const Total = cart.cartTotal + deliveryCharge;

      res.status(200).json({ message: 'Cart updated successfully', productSubtotal, cartTotal, Total });
  } catch (error) {
      console.error('Error updating cart:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
};

const checkProductStock = async (req, res) => {
  const { productId, quantity } = req.body;

  try {
      // Find the product by ID
      const product = await Productsdb.findById(productId);

      // Check if product exists and has enough stock
      if (product && product.stock >= quantity) {
          res.json({ enoughStock: true });
      } else {
          res.json({ enoughStock: false });
      }
  } catch (error) {
      console.error('Error checking product stock:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
}

const removeCartProduct = async (req, res) => {
  const { productId, cartId } = req.body;

  try {
    // Find the cart by its ID
    const cart = await Cartdb.findById(cartId);

    // Check if the cart exists
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Find the index of the product in the cartProducts array
    const productIndex = cart.cartProducts.findIndex(item => item.product.toString() === productId);
    
    if (productIndex !== -1) {
      // If the product is found in the cartProducts array, remove it
      cart.cartProducts.splice(productIndex, 1);
      
      // Recalculate the cart total based on the updated cartProducts array
      cart.cartTotal = cart.cartProducts.reduce((total, item) => total + item.totalPrice, 0);
      
      // Save the updated cart to the database
      await cart.save();

      // Redirect the user to a specified page
      res.redirect('/cart'); // Change '/cart' to the desired page URL
    } else {
      // If the product is not found in the cartProducts array, send an error response
      res.status(404).json({ message: 'Product not found in the cart' });
    }
  } catch (error) {
    // Handle errors
    console.error('Error removing product from cart:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const removeAllCartProducts = async (req, res) => {
  const { id } = req.query;

  try {
    // Find the cart by its ID
    const cart = await Cartdb.findById(id);

    // Check if the cart exists
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Set cartProducts array to empty
    cart.cartProducts = [];
    
    // Reset cart total to 0
    cart.cartTotal = 0;

    // Save the updated cart to the database
    await cart.save();

    // Redirect the user to a specified page
    res.redirect('/cart'); // Change '/cart' to the desired page URL
  } catch (error) {
    // Handle errors
    console.error('Error removing all products from cart:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const cartCount = async (req, res) => {
  try {
      const userId = req.query.user; 
      // Assuming Cartdb is your Mongoose model for the cart
      const cart = await Cartdb.findOne({ user: userId });
      
      if (!cart) {
          // If cart is not found, return 0 as the count
          res.json({ count: 0 });
          return;
      }
      
      // Assuming cartProducts is an array field in your Cart schema
      const cartCount = cart.cartProducts.length;
      // console.log("cart count is:", cartCount);
      
      // Send the cart count as a JSON response
      res.json({ count: cartCount });
  } catch (error) {
      console.error('Error fetching cart count:', error);
      // Send an error response if there's an error fetching the cart count
      res.status(500).json({ error: 'Failed to fetch cart count' });
  }
};

const loadCheckout = async(req,res) => {
 try {
  const userId = req.session.userId
  const addresses = await Addressdb.findOne({user:userId})
  const addresslist = addresses.addresses
  // const addresses = userDetails.addresses

  const cardId = req.query.id;
  const cart = await Cartdb.findById(cardId)
  const cartProdDetails = cart.cartProducts
 

  console.log("userId:--------",userId);
  console.log("cardId:--------",cardId);
  console.log("Address:--------",addresses.addresses);
  console.log("Cart Product Details:--------",cartProdDetails);
  if(!cart){
   return  res.status(400).send("Error getting cart details")
  }
   return res.render("checkout",{cart,cartProdDetails,userId,addresslist})
 } catch (error) {
  console.error('Error Loading CheckoutPage', error);
    res.status(500).json({ message: 'Internal server error' });
 }
}

module.exports = {
  addToCart,
  cartCount,
  loadCart,
  updateCartQuantity,
  checkProductStock,
  removeCartProduct,
  removeAllCartProducts,
  loadCheckout,
}