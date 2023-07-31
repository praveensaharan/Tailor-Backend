const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  gender: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  password: { type: String, required: true },
  username: { type: String, unique: true, required: true },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
