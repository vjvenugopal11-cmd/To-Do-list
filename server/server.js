const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://to-do-list-gamma-tan-62.vercel.app",
    /\.vercel\.app$/,
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));

app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Error:", err));

// Ping route to wake up Render server
app.get("/ping", (req, res) => {
  res.json({ status: "awake" });
});

app.use("/api/tasks", require("./routes/taskRoutes"));

// Serve React build
app.use(express.static(path.join(__dirname, "client/build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client/build/index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});