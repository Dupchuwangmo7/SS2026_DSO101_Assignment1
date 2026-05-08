import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || '';

function App() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchTodos(); }, []);

  const fetchTodos = async () => {
    try {
      const res = await fetch(`${API_URL}/api/todos`);
      const data = await res.json();
      setTodos(data);
    } catch {
      setError('Failed to connect to backend.');
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async () => {
    if (!input.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: input.trim() }),
      });
      const data = await res.json();
      setTodos([data, ...todos]);
      setInput('');
    } catch {
      setError('Failed to add task.');
    }
  };

  const toggleTodo = async (todo) => {
    try {
      const res = await fetch(`${API_URL}/api/todos/${todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !todo.completed }),
      });
      const updated = await res.json();
      setTodos(todos.map(t => t.id === updated.id ? updated : t));
    } catch {
      setError('Failed to update task.');
    }
  };

  const saveEdit = async (id) => {
    if (!editText.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editText.trim() }),
      });
      const updated = await res.json();
      setTodos(todos.map(t => t.id === updated.id ? updated : t));
      setEditingId(null);
    } catch {
      setError('Failed to edit task.');
    }
  };

  const deleteTodo = async (id) => {
    try {
      await fetch(`${API_URL}/api/todos/${id}`, { method: 'DELETE' });
      setTodos(todos.filter(t => t.id !== id));
    } catch {
      setError('Failed to delete task.');
    }
  };

  const pending = todos.filter(t => !t.completed).length;
  const done = todos.filter(t => t.completed).length;

  return (
    <div className="app">
      <div className="noise" />
      <div className="container">
        <header>
          <div className="logo">TASKR</div>
          <p className="subtitle">Get things done, one task at a time.</p>
          <div className="stats">
            <span className="stat pending">{pending} pending</span>
            <span className="divider">·</span>
            <span className="stat done">{done} done</span>
          </div>
        </header>

        {error && <div className="error" onClick={() => setError('')}>{error} ✕</div>}

        <div className="input-row">
          <input
            className="task-input"
            placeholder="Add a new task…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTodo()}
          />
          <button className="add-btn" onClick={addTodo}>Add</button>
        </div>

        {loading ? (
          <div className="loading">Loading tasks…</div>
        ) : todos.length === 0 ? (
          <div className="empty">No tasks yet. Add one above!</div>
        ) : (
          <ul className="todo-list">
            {todos.map(todo => (
              <li key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
                <button className="check-btn" onClick={() => toggleTodo(todo)}>
                  {todo.completed ? '✔' : '○'}
                </button>

                {editingId === todo.id ? (
                  <input
                    className="edit-input"
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') saveEdit(todo.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    autoFocus
                  />
                ) : (
                  <span className="todo-title">{todo.title}</span>
                )}

                <div className="actions">
                  {editingId === todo.id ? (
                    <>
                      <button className="action-btn save" onClick={() => saveEdit(todo.id)}>Save</button>
                      <button className="action-btn cancel" onClick={() => setEditingId(null)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button className="action-btn edit" onClick={() => { setEditingId(todo.id); setEditText(todo.title); }}>Edit</button>
                      <button className="action-btn delete" onClick={() => deleteTodo(todo.id)}>Delete</button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default App;
