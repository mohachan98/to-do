const STORAGE_KEY = "daily-todo-app-v1";

const defaultTasks = [
  { id: crypto.randomUUID(), title: "水を飲む", category: "daily", done: false },
  { id: crypto.randomUUID(), title: "今日の予定を確認する", category: "daily", done: false },
  { id: crypto.randomUUID(), title: "寝る前に明日の準備をする", category: "daily", done: false },
];

const state = {
  tasks: loadTasks(),
};

const form = document.querySelector("#task-form");
const taskInput = document.querySelector("#task-input");
const categoryInput = document.querySelector("#task-category");
const template = document.querySelector("#task-template");
const lists = {
  daily: document.querySelector("#daily-list"),
  idea: document.querySelector("#idea-list"),
};
const counts = {
  daily: document.querySelector("#daily-count"),
  idea: document.querySelector("#idea-count"),
};
const emptyMessages = {
  daily: document.querySelector("#daily-empty"),
  idea: document.querySelector("#idea-empty"),
};

function loadTasks() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return defaultTasks;
  }

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : defaultTasks;
  } catch {
    return defaultTasks;
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
}

function createTask(title, category) {
  return {
    id: crypto.randomUUID(),
    title,
    category,
    done: false,
  };
}

function updateTask(id, changes) {
  state.tasks = state.tasks.map((task) => (task.id === id ? { ...task, ...changes } : task));
  saveTasks();
  renderTasks();
}

function deleteTask(id) {
  state.tasks = state.tasks.filter((task) => task.id !== id);
  saveTasks();
  renderTasks();
}

function addTask(title, category) {
  state.tasks = [createTask(title, category), ...state.tasks];
  saveTasks();
  renderTasks();
}

function renderTasks() {
  Object.values(lists).forEach((list) => list.replaceChildren());

  const grouped = {
    daily: state.tasks.filter((task) => task.category === "daily"),
    idea: state.tasks.filter((task) => task.category === "idea"),
  };

  Object.entries(grouped).forEach(([category, tasks]) => {
    tasks.forEach((task) => {
      const item = renderTask(task);
      lists[category].appendChild(item);
      resizeTitle(item.querySelector(".task-title"));
    });
    counts[category].textContent = String(tasks.filter((task) => !task.done).length);
    emptyMessages[category].classList.toggle("visible", tasks.length === 0);
  });
}

function renderTask(task) {
  const item = template.content.firstElementChild.cloneNode(true);
  const checkbox = item.querySelector(".task-check");
  const titleInput = item.querySelector(".task-title");
  const moveButton = item.querySelector(".move-button");
  const deleteButton = item.querySelector(".delete-button");

  item.dataset.category = task.category;
  item.classList.toggle("done", task.done);
  checkbox.checked = task.done;
  titleInput.value = task.title;
  resizeTitle(titleInput);

  checkbox.addEventListener("change", () => {
    updateTask(task.id, { done: checkbox.checked });
  });

  titleInput.addEventListener("change", () => {
    const nextTitle = titleInput.value.trim();

    if (nextTitle) {
      updateTask(task.id, { title: nextTitle });
      return;
    }

    titleInput.value = task.title;
  });

  titleInput.addEventListener("input", () => {
    resizeTitle(titleInput);
  });

  titleInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      titleInput.blur();
    }
  });

  moveButton.addEventListener("click", () => {
    updateTask(task.id, { category: task.category === "daily" ? "idea" : "daily" });
  });

  deleteButton.addEventListener("click", () => {
    deleteTask(task.id);
  });

  return item;
}

function resizeTitle(input) {
  input.style.height = "auto";
  input.style.height = `${input.scrollHeight}px`;
}

function setToday() {
  const now = new Date();
  const weekday = new Intl.DateTimeFormat("ja-JP", { weekday: "long" }).format(now);
  const date = new Intl.DateTimeFormat("ja-JP", {
    month: "long",
    day: "numeric",
  }).format(now);

  document.querySelector("#weekday").textContent = weekday;
  document.querySelector("#today").textContent = date;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = taskInput.value.trim();

  if (!title) {
    return;
  }

  addTask(title, categoryInput.value);
  taskInput.value = "";
  taskInput.focus();
});

setToday();
renderTasks();

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("./service-worker.js");
}

