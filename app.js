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

const tokenSchema = new mongoose.Schema({
  access_token: String,
  expires_at: Date,
});

// Define the model
const Token = mongoose.model("Token", tokenSchema);

// Function to retrieve a valid token
async function getValidToken() {
  const token = await Token.findOne();

  if (!token || token.expires_at < new Date()) {
    const newToken = await fetchNewToken();
    return newToken;
  }

  return token.access_token;
}

// Function to fetch a new token from Auth0
async function fetchNewToken() {
  const data = {
    client_id: `${process.env.CLIENT_ID}`,
    client_secret: `${process.env.CLIENT_SECRET}`,
    audience: "https://dev-w6w73v6food6memp.us.auth0.com/api/v2/",
    grant_type: "client_credentials",
  };

  try {
    const response = await axios.post(
      "https://dev-w6w73v6food6memp.us.auth0.com/oauth/token",
      data,
      {
        headers: {
          "content-type": "application/json",
        },
      }
    );
    const expires_in = 86400;
    const { access_token } = response.data;

    // Calculate expiration time
    const expires_at = new Date(Date.now() + expires_in * 1000);

    // Save token to the database
    await Token.deleteMany(); // Remove existing token
    await Token.create({ access_token, expires_at });

    return access_token;
  } catch (error) {
    console.error("Error fetching new token:", error);
    throw error;
  }
}

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

async function fetchUserDataFromAPI(sub) {
  const token = await getValidToken();
  const options = {
    method: "GET",
    url: `https://dev-w6w73v6food6memp.us.auth0.com/api/v2/users/${sub}`,
    headers: { Authorization: `Bearer ${token}` },
  };
  return axios(options);
}

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
