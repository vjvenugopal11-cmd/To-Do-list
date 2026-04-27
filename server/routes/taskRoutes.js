const express = require("express");
const router = express.Router();
const Task = require("../models/Task");

// Validation middleware
const validateTask = (req, res, next) => {
  const { title } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ message: "Task title is required" });
  }
  next();
};

// GET all tasks with filters
router.get("/", async (req, res) => {
  try {
    const { label, status } = req.query;
    const filter = {};

    if (label && label !== "All") {
      filter.label = label;
    }
    if (status === "Active") {
      filter.completed = false;
    } else if (status === "Done") {
      filter.completed = true;
    }

    const tasks = await Task.find(filter).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
});

// GET single task
router.get("/:id", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.json(task);
  } catch (err) {
    res.status(400).json({ message: "Invalid task ID" });
  }
});

// POST create task
router.post("/", validateTask, async (req, res) => {
  try {
    const { title, note, label, dueDate } = req.body;
    const task = new Task({
      title: title.trim(),
      note: note || "",
      label: label || "Personal",
      dueDate: dueDate || null,
      completed: false,
    });
    const saved = await task.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: "Failed to create task" });
  }
});

// PUT update task
router.put("/:id", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Update only provided fields
    if (req.body.title !== undefined) {
      if (!req.body.title.trim()) {
        return res.status(400).json({ message: "Title cannot be empty" });
      }
      task.title = req.body.title.trim();
    }
    if (req.body.completed !== undefined) task.completed = req.body.completed;
    if (req.body.note !== undefined) task.note = req.body.note;
    if (req.body.label !== undefined) task.label = req.body.label;
    if (req.body.dueDate !== undefined) task.dueDate = req.body.dueDate;

    const updated = await task.save();
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: "Failed to update task" });
  }
});

// DELETE task
router.delete("/:id", async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.json({ message: "Task deleted", task });
  } catch (err) {
    res.status(400).json({ message: "Failed to delete task" });
  }
});

module.exports = router;