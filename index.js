const express = require ("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
// const { v4:uuidv4 } = require('uuid');  
const nocache = require("nocache")

const app = express();

const cookieParser = require('cookie-parser');

// Middleware
app.use(cookieParser());
app.use(nocache())
app.use(bodyParser.urlencoded({ extended: true }));


const path = require("path")
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/CouchCartDB", { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
.then(()=>{
  console.log("MongoDB Connected Successfully");
}).catch ((err)=>{
  console.log("MongoDB Connection Error:",err);

})

app.set('view engine','ejs');



//User Routes
const userRoutes = require('./routes/userRoutes')
app.use('/',userRoutes);

//Admin Routes
const adminRoutes = require('./routes/adminRoutes');
app.use('/admin',adminRoutes);


const PORT = process.env.PORT || 3000;
app.listen(PORT,()=>{
  console.log(`Server is running on http://localhost:${PORT}`);
})