const express = require("express");
const passport = require("passport");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const router = express.Router();

// Auth pages
router.get("/register", (req, res) => res.render("register"));
router.get("/login", (req, res) => res.render("login"));

// Dashboard (protected)
router.get("/dashboard", ensureAuthenticated, (req, res) => {
  res.render("dashboard", { user: req.user });
});

// Register POST
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.send("Please fill in all fields.");
    }

    const existing = await User.findOne({ email });
    if (existing) return res.send("User already exists!");

    const hash = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hash });

    res.redirect("/auth/login");
  } catch (err) {
    console.error("Error in register route:", err);
    res.status(500).send("Server error. Please try again.");
  }
});

// Login POST
router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/auth/dashboard",
    failureRedirect: "/auth/login",
  })
);

// Google Auth
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/auth/login" }),
  (req, res) => res.redirect("/auth/dashboard")
);

// Logout
router.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      console.error("Logout error:", err);
      return res.redirect("/auth/dashboard");
    }
    res.redirect("/auth/login");
  });
});

// Middleware to protect routes
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/auth/login");
}

module.exports = router;
