import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/todoapp";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Todo Schema
const todoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: "",
  },
  completed: {
    type: Boolean,
    default: false,
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update timestamp before saving
// Update timestamp before saving
todoSchema.pre("save", function () {
  this.updatedAt = Date.now();
});

const Todo = mongoose.model("Todo", todoSchema);

// Routes

// Get all todos
app.get("/api/todos", async (req, res) => {
  try {
    const { completed, priority, sort } = req.query;

    let query = {};
    if (completed !== undefined) {
      query.completed = completed === "true";
    }
    if (priority) {
      query.priority = priority;
    }

    let sortOption = { createdAt: -1 };
    if (sort === "priority") {
      sortOption = { priority: -1, createdAt: -1 };
    } else if (sort === "title") {
      sortOption = { title: 1 };
    }

    const todos = await Todo.find(query).sort(sortOption);
    res.json({ success: true, data: todos });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new todo
app.post("/api/todos", async (req, res) => {
  try {
    const { title, description, priority } = req.body;

    if (!title) {
      return res
        .status(400)
        .json({ success: false, message: "Title is required" });
    }

    const todo = new Todo({
      title,
      description,
      priority,
    });

    await todo.save();
    res.status(201).json({ success: true, data: todo });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Delete todo
app.delete("/api/todos/:id", async (req, res) => {
  try {
    const todo = await Todo.findByIdAndDelete(req.params.id);

    if (!todo) {
      return res
        .status(404)
        .json({ success: false, message: "Todo not found" });
    }

    res.json({ success: true, message: "Todo deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Todo API is running" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
