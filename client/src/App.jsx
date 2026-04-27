import { useEffect, useState, useRef } from "react";
import API from "./api";
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
  const [completedId, setCompletedId] = useState(null);
  const containerRef = useRef(null);

  // Fetch tasks
  const fetchTasks = async (filterType = "All") => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterType !== "All" && filterType !== "Active" && filterType !== "Done") {
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
    fetchTasks(filter);
  }, []);

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
      await fetchTasks(filter);
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
      setTasks(tasks.filter(task => task._id !== id));
    } catch (err) {
      setError("Failed to delete task");
      console.error(err);
    }
  };

  // Toggle complete with celebration
  const toggleTask = async (id) => {
    const task = tasks.find(t => t._id === id);
    setError(null);
    try {
      await API.put(`/${id}`, { completed: !task.completed });
      
      // Celebration effect
      if (!task.completed) {
        setCompletedId(id);
        createConfetti();
        setTimeout(() => setCompletedId(null), 1500);
      }

      setTasks(tasks.map(t =>
        t._id === id ? { ...t, completed: !t.completed } : t
      ));
    } catch (err) {
      setError("Failed to update task");
      console.error(err);
    }
  };

  // Create confetti effect
  const createConfetti = () => {
    if (!containerRef.current) return;
    
    for (let i = 0; i < 30; i++) {
      const confetti = document.createElement("div");
      confetti.className = "confetti";
      confetti.style.left = Math.random() * 100 + "%";
      confetti.style.delay = Math.random() * 0.3 + "s";
      confetti.style.background = [
        "linear-gradient(135deg, #667eea, #764ba2)",
        "linear-gradient(135deg, #f093fb, #f5576c)",
        "linear-gradient(135deg, #4facfe, #00f2fe)",
        "linear-gradient(135deg, #43e97b, #38f9d7)"
      ][Math.floor(Math.random() * 4)];
      
      containerRef.current.appendChild(confetti);
      
      setTimeout(() => confetti.remove(), 2000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addTask();
    }
  };

  const handleFilter = (filterType) => {
    setFilter(filterType);
    fetchTasks(filterType);
  };

  const taskCount = tasks.length;
  const completedCount = tasks.filter(t => t.completed).length;

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

        {/* Error Message */}
        {error && (
          <div className="error-banner">
            <span>{error}</span>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {/* Input Section */}
        <div className="input-section glass-card">
          <div className="input-group">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Task title..."
              className="input-field"
            />
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add a note..."
              className="input-field note-field"
              rows="3"
            />
          </div>

          {/* Labels */}
          <div className="labels-section">
            <span className="label-text">Label:</span>
            <div className="label-buttons">
              {LABELS.map((lbl) => (
                <button
                  key={lbl}
                  className={`label-btn ${label === lbl ? "active" : ""}`}
                  onClick={() => setLabel(lbl)}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          {/* Due Date */}
          <div className="due-date-section">
            <label>Due date & time:</label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="date-input"
            />
          </div>

          <button onClick={addTask} className="add-task-btn">
            {loading ? "Adding..." : "Add task"}
          </button>
        </div>

        {/* Filter Buttons */}
        <div className="filter-section">
          {["All", "Active", "Done", ...LABELS].map((f) => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? "active" : ""}`}
              onClick={() => handleFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Tasks Section */}
        <div className="tasks-header">
          <h2>TASKS</h2>
        </div>

        {loading && tasks.length === 0 ? (
          <div className="empty-state">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <p>No tasks here yet</p>
            <p className="empty-subtitle">Add one to get started!</p>
          </div>
        ) : (
          <div className="tasks-list">
            {tasks.map((task, idx) => (
              <div
                key={task._id}
                className={`task-item ${task.completed ? "completed" : ""} ${
                  completedId === task._id ? "celebration" : ""
                }`}
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <button
                  className={`checkbox-btn ${task.completed ? "checked" : ""}`}
                  onClick={() => toggleTask(task._id)}
                  title={task.completed ? "Mark incomplete" : "Mark complete"}
                >
                  {task.completed ? "✓" : ""}
                </button>

                <div className="task-content">
                  <div className="task-title-row">
                    <span className="task-title">{task.title}</span>
                    <span className="task-label">{task.label}</span>
                  </div>
                  {task.note && <p className="task-note">{task.note}</p>}
                  {task.dueDate && (
                    <p className="task-date">
                      📅 {new Date(task.dueDate).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <button
                  className="delete-btn"
                  onClick={() => deleteTask(task._id)}
                  title="Delete task"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Progress Bar */}
        {tasks.length > 0 && (
          <div className="progress-section">
            <div className="progress-info">
              <span>{completedCount} of {taskCount} completed</span>
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