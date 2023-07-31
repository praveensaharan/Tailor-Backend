const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = mongoose.model("User");

router.post("/", async (req, res) => {
  const { name, email, gender, phoneNumber, password, username } = req.body;
  if (!username) {
    return res.status(400).json({ message: "Username is required" });
  }

  try {
    // Check if the username or email is already taken
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "Username or email already taken" });
    }

    // Create and save the user to the database
    const newUser = new User({
      name,
      email,
      gender,
      phoneNumber,
      password,
      username,
    });
    await newUser.save();

    res.status(201).json({ message: "Signup successful" });
  } catch (error) {
    console.error("Error occurred while signing up:", error);
    res.status(500).json({ message: "Error occurred while signing up" });
  }
});

module.exports = router;
