import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_URL = import.meta.env.REACT_APP_API_URL 

function App() {
  const [tasks, setTasks] = useState([])
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const hasTasks = useMemo(() => tasks.length > 0, [tasks])

  useEffect(() => {
    loadTasks()
  }, [])

  async function loadTasks() {
    setError('')

    try {
      const response = await fetch(`${API_URL}/tasks`)

      if (!response.ok) {
        throw new Error('Failed to load tasks')
      }

      const data = await response.json()
      setTasks(data)
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setIsLoading(false)
    }
  }

  async function addTask(event) {
    event.preventDefault()

    const title = newTaskTitle.trim()

    if (!title) {
      return
    }

    setError('')

    try {
      const response = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      })

      if (!response.ok) {
        throw new Error('Failed to add task')
      }

      const createdTask = await response.json()
      setTasks((currentTasks) => [createdTask, ...currentTasks])
      setNewTaskTitle('')
    } catch (createError) {
      setError(createError.message)
    }
  }

  function startEditing(task) {
    setEditingTaskId(task.id)
    setEditingTitle(task.title)
  }

  function cancelEditing() {
    setEditingTaskId(null)
    setEditingTitle('')
  }

  async function saveTask(taskId) {
    const title = editingTitle.trim()

    if (!title) {
      return
    }

    setError('')

    try {
      const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      })

      if (!response.ok) {
        throw new Error('Failed to update task')
      }

      const updatedTask = await response.json()
      setTasks((currentTasks) =>
        currentTasks.map((task) => (task.id === taskId ? updatedTask : task))
      )
      cancelEditing()
    } catch (updateError) {
      setError(updateError.message)
    }
  }

  async function toggleCompleted(task) {
    setError('')

    try {
      const response = await fetch(`${API_URL}/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: !task.completed }),
      })

      if (!response.ok) {
        throw new Error('Failed to update task status')
      }

      const updatedTask = await response.json()
      setTasks((currentTasks) =>
        currentTasks.map((item) => (item.id === task.id ? updatedTask : item))
      )
    } catch (toggleError) {
      setError(toggleError.message)
    }
  }

  async function deleteTask(taskId) {
    setError('')

    try {
      const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete task')
      }

      setTasks((currentTasks) =>
        currentTasks.filter((task) => task.id !== taskId)
      )

      if (editingTaskId === taskId) {
        cancelEditing()
      }
    } catch (deleteError) {
      setError(deleteError.message)
    }
  }

  return (
    <main className="app-shell">
      <section className="todo-card">
        <h1>To-Do List</h1>

        <form className="task-form" onSubmit={addTask}>
          <input
            type="text"
            value={newTaskTitle}
            onChange={(event) => setNewTaskTitle(event.target.value)}
            placeholder="Add a new task"
            aria-label="Task title"
          />
          <button type="submit">Add</button>
        </form>

        {error && <p className="error-message">{error}</p>}

        {isLoading ? (
          <p className="status-message">Loading tasks...</p>
        ) : !hasTasks ? (
          <p className="status-message">No tasks yet.</p>
        ) : (
          <ul className="task-list">
            {tasks.map((task) => {
              const isEditing = editingTaskId === task.id

              return (
                <li key={task.id} className="task-item">
                  <label className="task-check">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleCompleted(task)}
                    />
                  </label>

                  {isEditing ? (
                    <input
                      className="edit-input"
                      value={editingTitle}
                      onChange={(event) => setEditingTitle(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          saveTask(task.id)
                        }

                        if (event.key === 'Escape') {
                          cancelEditing()
                        }
                      }}
                    />
                  ) : (
                    <span className={task.completed ? 'task-title done' : 'task-title'}>
                      {task.title}
                    </span>
                  )}

                  <div className="task-actions">
                    {isEditing ? (
                      <>
                        <button type="button" onClick={() => saveTask(task.id)}>
                          Save
                        </button>
                        <button type="button" onClick={cancelEditing}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button type="button" onClick={() => startEditing(task)}>
                        Edit
                      </button>
                    )}
                    <button type="button" onClick={() => deleteTask(task.id)}>
                      Delete
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </main>
  )
}

export default App
