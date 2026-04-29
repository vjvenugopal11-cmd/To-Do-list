import { useEffect, useState, useRef } from "react";
import API, { pingServer } from "./api";
import "./App.css";

function App() {
  // ---------------- STATES ----------------
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [label, setLabel] = useState("Personal");
  const [dueDate, setDueDate] = useState("");
  // const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("All");
  const [serverReady, setServerReady] = useState(false);

  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");
  const [search, setSearch] = useState("");

  const containerRef = useRef(null);
  // const completedIdRef = useRef(null);

  const LABELS = ["Work", "Personal", "Idea", "Urgent", "Study"];

  // ---------------- SERVER WAKE ----------------
  useEffect(() => {
    pingServer().then(() => setServerReady(true));
  }, []);

  // ---------------- FETCH TASKS ----------------
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (serverReady) fetchTasks(filter);
  }, [filter, serverReady]);

  // ---------------- ADD TASK ----------------
  const addTask = async () => {
    if (!title.trim()) {
      setError("Please enter a task title");
      return;
    }

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
    }
  };

  // ---------------- UPDATE TASK ----------------
  const updateTask = async (id) => {
    try {
      await API.put(`/${id}`, { title: editText });

      setTasks((prev) =>
        prev.map((t) =>
          t._id === id ? { ...t, title: editText } : t
        )
      );

      setEditId(null);
      setEditText("");
    } catch {
      setError("Failed to update task");
    }
  };

  // ---------------- DELETE TASK ----------------
  const deleteTask = async (id) => {
    try {
      await API.delete(`/${id}`);

      setTasks((prev) => prev.filter((task) => task._id !== id));
    } catch {
      setError("Failed to delete task");
    }
  };

  // ---------------- TOGGLE TASK ----------------
  const toggleTask = async (id) => {
    const task = tasks.find((t) => t._id === id);

    try {
      await API.put(`/${id}`, { completed: !task.completed });

      setTasks((prev) =>
        prev.map((t) =>
          t._id === id ? { ...t, completed: !t.completed } : t
        )
      );

      if (!task.completed) {
        createConfetti();
      }
    } catch {
      setError("Failed to update task");
    }
  };

  // ---------------- CONFETTI ----------------
  const createConfetti = () => {
    if (!containerRef.current) return;

    for (let i = 0; i < 25; i++) {
      const confetti = document.createElement("div");
      confetti.className = "confetti";
      confetti.style.left = Math.random() * 100 + "%";

      containerRef.current.appendChild(confetti);

      setTimeout(() => confetti.remove(), 2000);
    }
  };

  // ---------------- FILTERED TASKS ----------------
  const filteredTasks = tasks
    .filter((task) =>
      task.title.toLowerCase().includes(search.toLowerCase())
    );

  const taskCount = tasks.length;
  const completedCount = tasks.filter((t) => t.completed).length;

  // ---------------- UI ----------------
  return (
    <div className="app-wrapper" ref={containerRef}>

      {/* HEADER */}
      <div className="header">
        <h1>My Tasks</h1>
        <p>{completedCount}/{taskCount} Done</p>
      </div>

      {/* SEARCH */}
      <div className="search-box">
        <input
          type="text"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* INPUT */}
      <div className="input-section">

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
        />

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note"
        />

        <div className="label-buttons">
          {LABELS.map((l) => (
            <button
              key={l}
              className={label === l ? "active" : ""}
              onClick={() => setLabel(l)}
            >
              {l}
            </button>
          ))}
        </div>

        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />

        <button onClick={addTask}>
          Add Task
        </button>
      </div>

      {/* FILTERS */}
      <div className="filters">
        {["All", "Active", "Done", ...LABELS].map((f) => (
          <button
            key={f}
            className={filter === f ? "active" : ""}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* TASK LIST */}
      <div className="task-list">

        {filteredTasks.map((task) => (
          <div key={task._id} className="task-item">

            <button onClick={() => toggleTask(task._id)}>
              {task.completed ? "✓" : ""}
            </button>

            {/* TITLE / EDIT */}
            {editId === task._id ? (
              <input
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onBlur={() => updateTask(task._id)}
                onKeyDown={(e) =>
                  e.key === "Enter" && updateTask(task._id)
                }
                autoFocus
              />
            ) : (
              <span
                onDoubleClick={() => {
                  setEditId(task._id);
                  setEditText(task.title);
                }}
                className={task.completed ? "done" : ""}
              >
                {task.title}
              </span>
            )}

            <button onClick={() => deleteTask(task._id)}>
              ×
            </button>

          </div>
        ))}

      </div>

      {/* ERROR */}
      {error && <p className="error">{error}</p>}

    </div>
  );
}

export default App;
