const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const tokenFor = (user) => jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
});
const safeUser = (user) => ({ id: user._id, name: user.name, email: user.email, course: user.course, semester: user.semester, profilePicture: user.profilePicture || "" });

const register = async (req, res) => {
    const { name, email, password, course, semester } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "Name, email and password are required" });
    if (password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters" });
    const normalizedEmail = String(email).trim().toLowerCase();
    if (!emailPattern.test(normalizedEmail)) return res.status(400).json({ message: "Please enter a valid email address" });
    if (await User.exists({ email: normalizedEmail })) return res.status(409).json({ message: "Email is already registered" });
    const user = await User.create({ name: String(name).trim(), email: normalizedEmail, password: await bcrypt.hash(password, 12), course, semester });
    return res.status(201).json({ token: tokenFor(user), user: safeUser(user) });
};

const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });
    const normalizedEmail = String(email).trim().toLowerCase();
    if (!emailPattern.test(normalizedEmail)) return res.status(400).json({ message: "Please enter a valid email address" });
    const user = await User.findOne({ email: normalizedEmail }).select("+password");
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ message: "Invalid email or password" });
    return res.json({ token: tokenFor(user), user: safeUser(user) });
};

const profile = async (req, res) => res.json({ user: safeUser(req.user) });
const updateProfile = async (req, res) => {
    const updates = {};
    ["name", "course", "semester", "profilePicture"].forEach((key) => { if (req.body[key] !== undefined) updates[key] = req.body[key]; });
    if (req.body.email !== undefined) updates.email = String(req.body.email).trim().toLowerCase();
    if (updates.email && await User.exists({ email: updates.email, _id: { $ne: req.user._id } })) return res.status(409).json({ message: "Email is already registered" });
    if (req.body.password !== undefined) {
        if (req.body.password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters" });
        updates.password = await bcrypt.hash(req.body.password, 12);
    }
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ user: safeUser(user) });
};

module.exports = { register, login, profile, updateProfile, createUser: register };
