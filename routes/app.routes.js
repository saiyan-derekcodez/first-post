import { Router } from "express";
import customerModel from './../models/customer.model.js'
import productModel from './../models/product.model.js'
import cartModel from "../models/cart.model.js";
import bcrypt from 'bcrypt';
import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId;

// create an instance of the express router
const router = Router();

router.get('/', (req, res) => {
  res.render('home');
})

router.get('/register', (req, res) => {
  res.render('register');
})

router.get('/login', (req, res) => {
  res.render('login');
})

router.get('/cart', async (req, res) => {
  const userEmail = req.cookies.userId;

  // get all the items in the cart
  const cartItems = await cartModel.findOne({ userEmail });

  if (cartItems == null) {
    res.render('cart', {});
    return;
  }

  // getting the unique items
  const uniqueItems = Array.from(new Set(cartItems.items));

  // get quantity of each item
  const quantity = {};
  for (let i = 0; i < cartItems.items.length; i++) {
    const productId = cartItems.items[i];

    // this checks if the productId key exists in the quantity object
    if (quantity.hasOwnProperty(productId)) {
      quantity[productId] += 1;

      // increases if the id already is there
    } else {
      quantity[productId] = 1;
      // creates the id if it isnot there

      // { productId: 1 }
    }
  }

  const itemInfo = {}
  for (let i = 0; i < uniqueItems.length; i++) {
    const productId = uniqueItems[i];

    const info = await productModel.findOne({ _id: productId });

    itemInfo[productId] = info;
  }

  const userInfo = await customerModel.findOne({ email: userEmail });


  res.render('cart', { userInfo, quantity, uniqueItems, itemInfo })
});

router.post('/register', async (req, res) => {
  const customerInfo = req.body;

  try {
    await customerModel.create(customerInfo);

    // remove any previous identification
    res.clearCookie('userId');
    res.clearCookie('super');

    res.cookie('userId', req.body.email);

    res.redirect('/products');
  } catch (error) {
    res.render('register', { error: error.message });
  }

})

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // remove any previous identification
    res.clearCookie('userId');
    res.clearCookie('super');

    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASS) {
      res.cookie('userId', email);
      res.cookie('super', '1');

      // cookies = {
      //   userId: email,
      //   super: 1
      // }

      res.redirect('/products');
      return;
    }

    const user = await customerModel.findOne({ email: email });

    if (user === null) {
      res.render('login', { error: "Invalid credentials" })
      return;
    }

    if (bcrypt.compareSync(password, user.password) === false) {
      res.render('login', { error: "Invalid credentials" })
      return;
    }

    res.cookie('userId', email);

    res.redirect('/products')
  } catch (error) {
    res.render('login', { error: error.message })
  }
})

router.get('/products', async (req, res) => {
  const cookie = req.cookies;

  // check if cookie is set
  if (cookie.userId == undefined) {
    res.redirect('/');
    return;
  }

  // check db
  if (typeof cookie.super === 'undefined') {
    const userEmail = cookie.userId;

    const users = await customerModel.find({ email: userEmail });

    if (users.length === 0) {
      res.redirect('/');
      return;
    }
  }

  // fetch the products from the DB
  const products = await productModel.find({});

  res.render('products', { products, isAdmin: cookie.super });
})

router.delete('/product/:productId', async (req, res) => {
  const { productId } = req.params;

  try {
    // mongoDB _id are stored like so
    // _id: { '$oid': '<actual id>' }
    // so by casting to ObjectId I make sure I have the correct id format

    await productModel.deleteOne({ _id: new ObjectId(productId) });

    res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.post('/product', async (req, res) => {
  const productInfo = req.body;

  try {
    await productModel.create(productInfo);

    res.status(200).json({ message: "Product added successfully" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.get('/product/:productId', async (req, res) => {
  const { productId } = req.params;

  try {
    // fetch the product from the db
    const product = await productModel.findOne({ _id: new mongoose.Types.ObjectId(productId) });

    if (product === null) {
      res.status(404).json({ message: "No product found" });
      return;
    }

    res.status(200).json({ product })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.patch('/product/:productId', async (req, res) => {
  const { productId } = req.params;
  const update = req.body;

  try {

    // await productModel.updateOne(
    //  { ...query },
    //  { price: 500, quantity: 4 }
    // )

    // await productModel.updateOne(
    //  { name: 'mirabel' }, // what exists
    //  { name: 'angela' }  // what you want to change to
    // )

    // MAKE THE UPDATE
    await productModel.updateOne(
      { _id: new mongoose.Types.ObjectId(productId) },
      { $set: { ...update } }
    );

    // $set is an atomic operator in mongoDB that explicitly tells the DB to overwrite a field

    // THE ... is called spread operator, you can look it up on w3schools

    res.status(200).json({ message: "Update successful" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.post('/cart', async (req, res) => {
  const { productId } = req.body;
  const userEmail = req.cookies.userId;

  try {
    await cartModel.updateOne(
      { userEmail: userEmail },
      { $push: { items: productId }  },
      { upsert: true }
    );

    res.status(200).json({ message: "Item added" })
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
})

// export router instance
export default router;