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
      <div className="animated-bg">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      <div className="app-container">
        {/* Header */}
        <div className="header">
          <div className="header-content">
            <h1 className="title">My tasks</h1>
            <span className="task-count">{taskCount} tasks</span>
          </div>
        </div>

        {/* Server waking up banner */}
        {!serverReady && (
          <div className="error-banner" style={{ background: "rgba(100, 100, 200, 0.3)" }}>
            <span>⏳ Connecting to server, please wait...</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="error-banner">
            <span>{error}</span>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {/* Input */}
        <div className="input-section glass-card">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title..."
          />

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note..."
            rows="3"
          />

          <select
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          >
            {LABELS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>

          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />

          <button onClick={addTask} disabled={!serverReady || loading}>
            {!serverReady ? "Connecting..." : loading ? "Adding..." : "Add task"}
          </button>
        </div>

        {/* Filters */}
        <div className="filter-section">
          {["All", "Active", "Done", ...LABELS].map((f) => (
            <button
              key={f}
              className={filter === f ? "active" : ""}
              onClick={() => handleFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Tasks */}
        <div className="tasks-list">
          {loading && <p style={{ textAlign: "center", opacity: 0.6 }}>Loading tasks...</p>}
          {!loading && tasks.length === 0 && serverReady && (
            <p style={{ textAlign: "center", opacity: 0.6 }}>No tasks yet. Add one above!</p>
          )}
          {tasks.map((task) => (
            <div key={task._id} className={`task-item ${task.completed ? "completed" : ""}`}>
              <div className="task-info">
                <span className="task-title">{task.title}</span>
                {task.note && <span className="task-note">{task.note}</span>}
                <div className="task-meta">
                  {task.label && <span className="task-label">{task.label}</span>}
                  {task.dueDate && (
                    <span className="task-due">
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              <div className="task-actions">
                <button
                  className={`btn-done ${task.completed ? "btn-undo" : ""}`}
                  onClick={() => toggleTask(task._id)}
                >
                  {task.completed ? "Undo" : "Done"}
                </button>
                <button
                  className="btn-delete"
                  onClick={() => deleteTask(task._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Progress */}
        {tasks.length > 0 && (
          <div className="progress-section">
            <div className="progress-text">
              {completedCount} / {taskCount} completed
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${(completedCount / taskCount) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
