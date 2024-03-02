const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

const url = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bnezpcs.mongodb.net/bestfit`;
const connectionParams = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};
mongoose
  .connect(url, connectionParams)
  .then(() => {
    console.log("Connected to the database");
  })
  .catch((err) => {
    console.error(`Error connecting to the database:\n${err}`);
  });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  sub: { type: String, required: true },
  picture: { type: String, required: true },
  username: { type: String, unique: true, required: true },
});

const User = mongoose.model("User", userSchema);

app.get("/", (req, res) => {
  res.send("App is working");
});

app.get("/user/:sub", async (req, res) => {
  const { sub } = req.params;

  try {
    // Check if the user data exists in the database
    let userData = await User.findOne({ sub }).exec();
    console.log("userData", userData);
    if (userData) {
      res.json(userData);
    } else {
      // If user data doesn't exist, fetch it from the API
      try {
        const apiUserData = await fetchUserDataFromAPI(sub);

        // Create a new user document in MongoDB
        userData = await User.create({
          sub: apiUserData.data.user_id,
          picture: apiUserData.data.picture,
          username: apiUserData.data.username,
          name: apiUserData.data.name,
          email: apiUserData.data.email,
        });

        // Retrieve the newly created user data
        userData = await User.findOne({ sub }).exec();

        res.json(userData);
      } catch (apiError) {
        console.error("Error fetching user data from API:", apiError);
        res.status(500).json({ message: "Error fetching user data from API" });
      }
    }
  } catch (error) {
    console.error("Error getting user data:", error);
    res.status(500).json({ message: "Server error" });
  }
});

function fetchUserDataFromAPI(sub) {
  const options = {
    method: "GET",
    url: `https://dev-w6w73v6food6memp.us.auth0.com/api/v2/users/${sub}`,
    headers: { Authorization: `Bearer ${process.env.TOKEN}` },
  };
  return axios(options);
}

// app.post("/signin", async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     // Find the user by email
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(401).json({ message: "Not Registered" });
//     }

//     if (user.password !== password) {
//       return res.status(401).json({ message: "Invalid credentials" });
//     }

//     const { name, _id } = user;
//     res.status(200).json({ message: "Signin successful", name, email, _id });
//   } catch (error) {
//     res.status(500).json({ message: "Error occurred while signing in" });
//   }
// });

// const dummyData = [
//   {
//     image:
//       "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSNrLXOAYxfl2e7o2oFwHQclX_a1lmD5Nnkog&usqp=CAU",
//     rating: 4.5,
//     verified: true,
//     name: "Stylish Stitches",
//     address: "123 MG Road, Fort, Mumbai - 400001",
//     priceRange: "₹400-₹500",
//     deliveryTime: "1-2 days",
//     email: "stylishstiches@gmail.com",
//     phoneNumber: "9876543211",
//     price: 400,
//   },
//   {
//     image:
//       "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSxmVtF9EF7L4-W11_PNrMK85Jdpjy5SP6uXg&usqp=CAU",
//     rating: 4.2,
//     verified: true,
//     name: "Fashionable Fabrics",
//     address: "567 Linking Road, Bandra, Mumbai - 400050",
//     priceRange: "₹500-₹600",
//     deliveryTime: "2-3 days",
//     email: "Fashionable@gmail.com",
//     phoneNumber: "9876543211",
//     price: 500,
//   },
//   {
//     image:
//       "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS5mMW6a1X0qGsdVQgQZm1GdqLTQrE5R-rU3A&usqp=CAU",
//     rating: 4.7,
//     verified: false,
//     name: "Elegant Embroidery",
//     address: "789 Hill Road, Bandra West, Mumbai - 400050",
//     priceRange: "₹500-₹600",
//     deliveryTime: "3-4 days",
//     email: "stylisembroidery@gmail.com",
//     phoneNumber: "9876543211",
//     price: 500,
//   },
//   {
//     image:
//       "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTFG2tNQXUHWpKXoaIy-ts1FrfHxmtSiR7aeg&usqp=CAU",
//     rating: 3.8,
//     verified: true,
//     name: "Silk Sensation",
//     address: "90 Kalbadevi Road, Mumbai - 400002",
//     priceRange: "₹350-₹450",
//     deliveryTime: "2-3 days",
//     email: "stylissilk@gmail.com",
//     phoneNumber: "9876543211",
//     price: 350,
//   },
//   {
//     image:
//       "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSbuGxyDStqfAXKorKwvehvjQhsBn4uvY4p1g&usqp=CAU",
//     rating: 4.4,
//     verified: false,
//     name: "Royal Raiment",
//     address: "246 Colaba Causeway, Colaba, Mumbai - 400005",
//     priceRange: "₹400-₹500",
//     deliveryTime: "1-2 days",
//     email: "royalstiches@gmail.com",
//     phoneNumber: "9876543211",
//     price: 400,
//   },
//   {
//     image:
//       "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS2X68ywVaJWlXWbrxY1orBl9D8VsGy18tjhg&usqp=CAU",
//     rating: 4.0,
//     verified: true,
//     name: "Trendy Textiles",
//     address: "34 Link Road, Malad West, Mumbai - 400064",
//     priceRange: "₹300-₹400",
//     deliveryTime: "3-4 days",
//     email: "stylistesxtiles@gmail.com",
//     phoneNumber: "9876543211",
//     price: 300,
//   },
//   {
//     image:
//       "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR3Z5ft-FZWICMskt-3frVxgFJ5MYQymxQ7Eg&usqp=CAU",
//     rating: 3.5,
//     verified: true,
//     name: "Ethnic Ensemble",
//     address: "567 Hill Road, Bandra West, Mumbai - 400050",
//     priceRange: "₹450-₹550",
//     deliveryTime: "4-5 days",
//     email: "ensemblestiches@gmail.com",
//     phoneNumber: "9876543211",
//     price: 450,
//   },
//   {
//     image:
//       "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQqIMHzce2EWBU6Aq7vlD5JkxhRbuP3JPOFqQ&usqp=CAU",
//     rating: 4.9,
//     verified: true,
//     name: "Designer Drape",
//     address: "12 Veera Desai Road, Andheri West, Mumbai - 400058",
//     priceRange: "₹400-₹500",
//     deliveryTime: "2-3 days",
//     email: "stylisdrape@gmail.com",
//     phoneNumber: "9876543211",
//     price: 400,
//   },
//   {
//     image:
//       "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTXMn22_kKZir50EFoQFXO8AhFrKZOItCgZeA&usqp=CAU",
//     rating: 3.7,
//     verified: false,
//     name: "Yousuf & Sons Tailoring Firm",
//     address: "88 Hill Road, Bandra West, Mumbai - 400050",
//     priceRange: "₹350-₹450",
//     deliveryTime: "1-2 days",
//     email: "youufsonss@gmail.com",
//     phoneNumber: "9876543211",
//     price: 350,
//   },
//   {
//     image:
//       "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSTnwbsGiNXBYzIhT050T_YNIgpJJYGpCGfiA&usqp=CAU",
//     rating: 4.6,
//     verified: true,
//     name: "Tom Tailor",
//     address: "999 Powai Vihar, Powai, Mumbai - 400076",
//     priceRange: "₹300-₹400",
//     deliveryTime: "3-4 days",
//     email: "tomtailor@gmail.com",
//     phoneNumber: "9876543211",
//     price: 300,
//   },
// ];

// mongoose
//   .connect(url, connectionParams)
//   .then(() => {
//     console.log("Connected to the database");
//     // Add the dummyData to the database
//     dummyData.forEach(async (data) => {
//       try {
//         const tailor = new Tailor(data);
//         await tailor.save();
//         console.log("Added data to the database:", data.name);
//       } catch (error) {
//         console.error("Error adding data to the database:", error);
//       }
//     });
//   })
//   .catch((err) => {
//     console.error(`Error connecting to the database:\n${err}`);
//   });

const tailorSchema = new mongoose.Schema({
  image: { type: String, required: true },
  rating: { type: Number, required: true },
  verified: { type: Boolean, required: true },
  name: { type: String, required: true },
  address: { type: String, required: true },
  priceRange: { type: String, required: true },
  deliveryTime: { type: String, required: true },
  email: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  price: { type: Number, required: true },
});

const Tailor = mongoose.model("Tailor", tailorSchema);
app.get("/tailors", async (req, res) => {
  try {
    const tailors = await Tailor.find();
    res.status(200).json(tailors);
  } catch (error) {
    console.error("Error retrieving tailor shop data:", error);
    res.status(500).json({ message: "Error retrieving data" });
  }
});

app.get("/tailors/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const blog = await Tailor.findById(id); // Assuming `User` is the correct model name
    res.json(blog);
  } catch (error) {
    console.error("Error fetching blog:", error);
    res.status(500).send("Something went wrong");
  }
});

const CommentSchema = new mongoose.Schema({
  blogPostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tailor",
  },
  name: {
    type: String,
    required: true,
  },
  topic: {
    type: String,
  },
  message: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    default: 0,
  },
});

const Comment = mongoose.model("Comment", CommentSchema);
app.post("/comments/:blogPostId", async (req, res) => {
  const { blogPostId } = req.params;
  const { topic, rating, message, name } = req.body;

  try {
    const comment = new Comment({
      blogPostId,
      topic,
      rating,
      message,
      name,
    });

    await comment.save();
    res.status(201).json(comment);
  } catch (error) {
    console.error("Error inserting comment:", error);
    res.status(500).send("Something went wrong");
  }
});

app.get("/commentsget/:blogPostId", async (req, res) => {
  const { blogPostId } = req.params;
  try {
    const comments = await Comment.find({ blogPostId });
    res.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).send("Something went wrong");
  }
});

const orderSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  cardNumber: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  cvc: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  expiry: {
    type: String,
    required: true,
  },
  focused: {
    type: String,
    required: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  fullNameOrder: {
    type: String,
    required: true,
  },
  item: {
    type: String,
    required: true,
  },
  mobile: {
    type: String,
    required: true,
  },
  zip: {
    type: String,
    required: true,
  },
  orderPrice: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const Order = mongoose.model("Order", orderSchema);

app.post("/create-order/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const {
      address,
      cardNumber,
      city,
      cvc,
      email,
      expiry,
      focused,
      fullName,
      fullNameOrder,
      item,
      mobile,
      zip,
      orderPrice,
    } = req.body;

    // Create a new order instance
    const order = new Order({
      userId,
      address,
      cardNumber,
      city,
      cvc,
      email,
      expiry,
      focused,
      fullName,
      fullNameOrder,
      item,
      mobile,
      zip,
      orderPrice,
    });

    // Save the order to the database
    await order.save();

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: "Failed to create the order." });
  }
});

app.get("/orderget/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const comments = await Order.find({ userId });
    res.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).send("Something went wrong");
  }
});

if (process.env.NODE_ENV === "production") {
  // Set static folder
  app.use(express.static(path.resolve(__dirname, "client", "build")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
  });
}

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`App is listening on port ${port}`);
});
