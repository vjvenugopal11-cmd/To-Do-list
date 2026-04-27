import { useEffect, useState, useRef } from "react";
import API, { pingServer } from "./api";
import "./App.css";

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [label, setLabel] = useState("Personal");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("All");
  const [serverReady, setServerReady] = useState(false);

  const containerRef = useRef(null);
  const completedIdRef = useRef(null);

  // Wake up Render server on app load
  useEffect(() => {
    pingServer().then(() => setServerReady(true));
  }, []);

  // Fetch tasks
  const fetchTasks = async (filterType = "All") => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();

      if (
        filterType !== "All" &&
        filterType !== "Active" &&
        filterType !== "Done"
      ) {
        params.append("label", filterType);
      } else if (filterType === "Active" || filterType === "Done") {
        params.append("status", filterType);
      }

      const res = await API.get(`/?${params.toString()}`);
      setTasks(res.data);
    } catch (err) {
      setError("Failed to load tasks");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (serverReady) {
      fetchTasks(filter);
    }
  }, [filter, serverReady]);

  // Add task
  const addTask = async () => {
    if (!title.trim()) {
      setError("Please enter a task title");
      return;
    }

    setError(null);
    try {
      await API.post("/", {
        title,
        note,
        label,
        dueDate: dueDate || null,
      });

      setTitle("");
      setNote("");
      setLabel("Personal");
      setDueDate("");

      fetchTasks(filter);
    } catch (err) {
      setError("Failed to add task");
      console.error(err);
    }
  };

  // Delete task
  const deleteTask = async (id) => {
    setError(null);
    try {
      await API.delete(`/${id}`);
      setTasks(tasks.filter((task) => task._id !== id));
    } catch (err) {
      setError("Failed to delete task");
      console.error(err);
    }
  };

  // Toggle complete
  const toggleTask = async (id) => {
    const task = tasks.find((t) => t._id === id);

    setError(null);
    try {
      await API.put(`/${id}`, { completed: !task.completed });

      if (!task.completed) {
        completedIdRef.current = id;
        createConfetti();
        setTimeout(() => (completedIdRef.current = null), 1500);
      }

      setTasks(
        tasks.map((t) =>
          t._id === id ? { ...t, completed: !t.completed } : t
        )
      );
    } catch (err) {
      setError("Failed to update task");
      console.error(err);
    }
  };

  // Confetti
  const createConfetti = () => {
    if (!containerRef.current) return;

    for (let i = 0; i < 30; i++) {
      const confetti = document.createElement("div");
      confetti.className = "confetti";
      confetti.style.left = Math.random() * 100 + "%";

      confetti.style.background = [
        "linear-gradient(135deg, #667eea, #764ba2)",
        "linear-gradient(135deg, #f093fb, #f5576c)",
        "linear-gradient(135deg, #4facfe, #00f2fe)",
        "linear-gradient(135deg, #43e97b, #38f9d7)",
      ][Math.floor(Math.random() * 4)];

      containerRef.current.appendChild(confetti);

      setTimeout(() => confetti.remove(), 2000);
    }
  };

  const handleFilter = (filterType) => {
    setFilter(filterType);
  };

  const taskCount = tasks.length;
  const completedCount = tasks.filter((t) => t.completed).length;

  const LABELS = ["Work", "Personal", "Idea", "Urgent", "Study"];

  return (
  <div className="app-wrapper" ref={containerRef}>
    {/* Animated Background */}
    <div className="animated-bg">
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
      <div className="blob blob-3"></div>
    </div>

    <div className="app-container">
      {/* Header */}
      <div className="header">
        <div className="header-content">
          <h1 className="title">My Tasks</h1>
          <span className="task-count">
            {completedCount}/{taskCount} <i class="bi bi-check2-all">done</i>
          </span>
        </div>
      </div>

      {/* Server status */}
      {!serverReady && (
        <div className="error-banner">
          <span>⏳ Connecting to server...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Input Section */}
      <div className="input-section glass-card">
        <input
          className="input-field glass"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title..."
        />

        <textarea
          className="input-field note-field glass"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note..."
          rows="3"
        />

        {/* Labels */}
        <div className="labels-section">
          <span className="label-text">Labels</span>
          <div className="label-buttons">
            {LABELS.map((l) => (
              <button
                key={l}
                className={`label-btn ${label === l ? "active" : ""}`}
                onClick={() => setLabel(l)}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Due date */}
        <div className="due-date-section glass">
          <label>Due Date</label>
          <input
            className="date-input"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <button
          className="add-task-btn glass"
          onClick={addTask}
          disabled={!serverReady || loading}
        >
          {!serverReady ? "Connecting..." : loading ? "Adding..." : "Add Task"}
        </button>
      </div>

      {/* Filters */}
      <div className="filter-section glass">
        {["All", "Active", "Done", ...LABELS].map((f) => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? "active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Tasks */}
      <div className="tasks-list glass">
        {loading && (
          <p style={{ textAlign: "center", opacity: 0.6 }}>
            Loading tasks...
          </p>
        )}

        {!loading && tasks.length === 0 && serverReady && (
          <div className="empty-state">
            <span className="empty-icon">📝</span>
            <p>No tasks yet</p>
            <p className="empty-subtitle">Add your first task above</p>
          </div>
        )}

        {tasks.map((task) => (
          <div
            key={task._id}
            className={`task-item ${task.completed ? "completed" : ""}`}
          >
            {/* Checkbox */}
            <button
              className={`checkbox-btn ${task.completed ? "checked" : ""}`}
              onClick={() => toggleTask(task._id)}
            >
              {task.completed ? "✓" : ""}
            </button>

            {/* Content */}
            <div className="task-content glass">
              <div className="task-title-row">
                <span className="task-title">{task.title}</span>

                {task.label && (
                  <span className="task-label">{task.label}</span>
                )}
              </div>

              {task.note && (
                <div className="task-note">{task.note}</div>
              )}

              {task.dueDate && (
                <div className="task-date">
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                </div>
              )}
            </div>

            {/* Delete */}
            <button
              className="delete-btn"
              onClick={() => deleteTask(task._id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Progress */}
      {tasks.length > 0 && (
        <div className="progress-section">
          <div className="progress-info">
            {completedCount} of {taskCount} completed
          </div>

          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${(completedCount / taskCount) * 100}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  </div>
);
              
}

export default App;
