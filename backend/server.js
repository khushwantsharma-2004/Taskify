const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");

const connectDB = require("./config/db");

dotenv.config();

connectDB();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "https://localhost:5173" }));

// app.options("*", cors());
app.use(express.json({ limit: "3mb" }));
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
    res.json({
        message: "Student Task Manager API is running"
    });
});

const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);
const resourceRoutes = require("./routes/resourceRoutes");
app.use("/api/subjects", resourceRoutes.subjects);
app.use("/api/tasks", resourceRoutes.tasks);
app.use("/api/attendance", resourceRoutes.attendance);
app.use("/api/notes", resourceRoutes.notes);

const auth = require("./middleware/auth");
const { dashboard } = require("./controllers/resourceController");
app.get("/api/dashboard", auth, dashboard);

app.use((req, res) => res.status(404).json({ message: "Route not found" }));
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError || error.message === "Only PDF files are allowed.") {
        return res.status(400).json({ message: error.message });
    }
    if (error.name === "ValidationError") return res.status(400).json({ message: error.message });
    if (error.code === 11000) return res.status(409).json({ message: "A record with these values already exists" });
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;