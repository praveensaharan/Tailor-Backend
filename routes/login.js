const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = mongoose.model("User");

router.post("/", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Not Registered" });
    }

    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const { name } = user;
    res.status(200).json({ message: "Signin successful", name, email });
  } catch (error) {
    res.status(500).json({ message: "Error occurred while signing in" });
  }
});

module.exports = router;
