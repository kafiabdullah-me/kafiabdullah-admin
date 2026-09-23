import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  getIdTokenResult
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ------------------------------
// DOM
// ------------------------------
const loginView = document.getElementById("loginView");
const dashboardView = document.getElementById("dashboardView");

const loginForm = document.getElementById("loginForm");
const adminEmail = document.getElementById("adminEmail");
const adminPassword = document.getElementById("adminPassword");
const loginBtn = document.getElementById("loginBtn");
const loginMessage = document.getElementById("loginMessage");

const currentUser = document.getElementById("currentUser");
const dashboardMessage = document.getElementById("dashboardMessage");
const logoutBtn = document.getElementById("logoutBtn");

const projectsList = document.getElementById("projectsList");
const postsList = document.getElementById("postsList");

const projectForm = document.getElementById("projectForm");
const postForm = document.getElementById("postForm");
const projectId = document.getElementById("projectId");
const postId = document.getElementById("postId");

const newProjectBtn = document.getElementById("newProjectBtn");
const cancelProjectBtn = document.getElementById("cancelProjectBtn");
const newPostBtn = document.getElementById("newPostBtn");
const cancelPostBtn = document.getElementById("cancelPostBtn");

const projectMessage = document.getElementById("projectMessage");
const postMessage = document.getElementById("postMessage");

function setMessage(el, text, type = "") {
  if (!el) return;
  el.textContent = text;
  el.className = `message ${type}`.trim();
}

function setBusy(button, busy, busyText, normalText) {
  if (!button) return;
  button.disabled = busy;
  button.textContent = busy ? busyText : normalText;
}

// ------------------------------
// AUTH
// ------------------------------
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    loginView.classList.remove("hidden");
    dashboardView.classList.add("hidden");
    currentUser.textContent = "";
    return;
  }

  loginView.classList.add("hidden");
  dashboardView.classList.remove("hidden");
  currentUser.textContent = user.email || "Signed-in user";

  try {
    // Force-refresh claims so an admin claim added recently is detected.
    const token = await getIdTokenResult(user, true);

    if (token.claims.admin !== true) {
      setMessage(
        dashboardMessage,
        "Login successful, but this Firebase account does not have the admin claim (admin: true). Firestore rules may block dashboard data. Add the admin custom claim, then sign out and sign in again.",
        "error"
      );
    } else {
      setMessage(dashboardMessage, "Admin access verified.", "success");
    }
  } catch (error) {
    console.error("CLAIM CHECK ERROR:", error);
  }

  await Promise.all([loadProjects(), loadPosts()]);
});

// Prevent the browser from submitting the login form as a GET request.
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = adminEmail.value.trim();
  const password = adminPassword.value;

  if (!email || !password) {
    setMessage(loginMessage, "Enter your email and password.", "error");
    return;
  }

  setBusy(loginBtn, true, "Signing in…", "Sign in");
  setMessage(loginMessage, "Signing in…");

  try {
    await signInWithEmailAndPassword(auth, email, password);

    // Remove old ?email=...&password=... query strings if they exist.
    window.history.replaceState({}, document.title, window.location.pathname);

    setMessage(loginMessage, "Login successful.", "success");
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    const messages = {
      "auth/api-key-not-valid": "Firebase API key is invalid or restricted. Update admin/firebase-config.js with the current Web App config from Firebase Console.",
      "auth/invalid-credential": "Email or password is incorrect.",
      "auth/invalid-email": "Please enter a valid email address.",
      "auth/user-not-found": "No Firebase Authentication user was found with this email.",
      "auth/wrong-password": "Incorrect password.",
      "auth/too-many-requests": "Too many attempts. Please try again later.",
      "auth/user-disabled": "This Firebase Authentication user is disabled."
    };

    setMessage(
      loginMessage,
      messages[error.code] || `Login failed: ${error.message}`,
      "error"
    );
  } finally {
    setBusy(loginBtn, false, "Signing in…", "Sign in");
  }
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

// ------------------------------
// TABS
// ------------------------------
document.querySelectorAll("[data-tab]").forEach((button) => {
  button.addEventListener("click", () => {
    const tab = button.dataset.tab;

    document.querySelectorAll("[data-tab]").forEach((b) => {
      b.classList.toggle("active", b.dataset.tab === tab);
    });

    document.getElementById("projectsTab").classList.toggle("hidden", tab !== "projects");
    document.getElementById("postsTab").classList.toggle("hidden", tab !== "posts");
  });
});

// ------------------------------
// PROJECT FORM
// ------------------------------
newProjectBtn.addEventListener("click", () => openProjectForm());
cancelProjectBtn.addEventListener("click", () => closeProjectForm());

function openProjectForm(data = null, id = "") {
  projectForm.classList.remove("hidden");
  projectId.value = id;
  document.getElementById("projectTitle").value = data?.title || "";
  document.getElementById("projectDescription").value = data?.description || "";
  document.getElementById("projectUrl").value = data?.url || "";
  document.getElementById("projectLabel").value = data?.label || "";
  document.getElementById("projectTags").value = Array.isArray(data?.tags) ? data.tags.join(", ") : "";
  document.getElementById("projectPublished").checked = data?.published !== false;
  document.getElementById("saveProjectBtn").textContent = id ? "Update project" : "Save project";
  projectForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function closeProjectForm() {
  projectForm.reset();
  projectId.value = "";
  document.getElementById("projectPublished").checked = true;
  projectForm.classList.add("hidden");
  setMessage(projectMessage, "");
}

projectForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage(projectMessage, "Saving…");

  const id = projectId.value.trim();
  const data = {
    title: document.getElementById("projectTitle").value.trim(),
    description: document.getElementById("projectDescription").value.trim(),
    url: document.getElementById("projectUrl").value.trim(),
    label: document.getElementById("projectLabel").value.trim(),
    tags: document.getElementById("projectTags").value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    published: document.getElementById("projectPublished").checked
  };

  try {
    if (id) {
      await updateDoc(doc(db, "projects", id), data);
      setMessage(projectMessage, "Project updated successfully.", "success");
    } else {
      await addDoc(collection(db, "projects"), {
        ...data,
        createdAt: serverTimestamp()
      });
      setMessage(projectMessage, "Project saved successfully.", "success");
    }

    await loadProjects();
    setTimeout(closeProjectForm, 500);
  } catch (error) {
    console.error("PROJECT SAVE ERROR:", error);
    setMessage(projectMessage, friendlyFirestoreError(error), "error");
  }
});

// ------------------------------
// BLOG FORM
// ------------------------------
newPostBtn.addEventListener("click", () => openPostForm());
cancelPostBtn.addEventListener("click", () => closePostForm());

function openPostForm(data = null, id = "") {
  postForm.classList.remove("hidden");
  postId.value = id;
  document.getElementById("postTitle").value = data?.title || "";
  document.getElementById("postExcerpt").value = data?.excerpt || "";
  document.getElementById("postContent").value = data?.content || "";
  document.getElementById("postPublished").checked = data?.published !== false;
  document.getElementById("savePostBtn").textContent = id ? "Update post" : "Save post";
  postForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function closePostForm() {
  postForm.reset();
  postId.value = "";
  document.getElementById("postPublished").checked = true;
  postForm.classList.add("hidden");
  setMessage(postMessage, "");
}

postForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage(postMessage, "Saving…");

  const id = postId.value.trim();
  const data = {
    title: document.getElementById("postTitle").value.trim(),
    excerpt: document.getElementById("postExcerpt").value.trim(),
    content: document.getElementById("postContent").value.trim(),
    published: document.getElementById("postPublished").checked
  };

  try {
    if (id) {
      await updateDoc(doc(db, "posts", id), data);
      setMessage(postMessage, "Blog post updated successfully.", "success");
    } else {
      await addDoc(collection(db, "posts"), {
        ...data,
        createdAt: serverTimestamp()
      });
      setMessage(postMessage, "Blog post saved successfully.", "success");
    }

    await loadPosts();
    setTimeout(closePostForm, 500);
  } catch (error) {
    console.error("POST SAVE ERROR:", error);
    setMessage(postMessage, friendlyFirestoreError(error), "error");
  }
});

// ------------------------------
// PROJECTS
// ------------------------------
async function loadProjects() {
  projectsList.innerHTML = '<div class="empty">Loading projects…</div>';

  try {
    const snapshot = await getDocs(collection(db, "projects"));
    const items = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));

    items.sort((a, b) => timestampMs(b.createdAt) - timestampMs(a.createdAt));

    if (!items.length) {
      projectsList.innerHTML = '<div class="empty">No projects yet.</div>';
      return;
    }

    projectsList.innerHTML = items.map((item) => `
      <article class="item">
        <div>
          <strong>${escapeHTML(item.title || "Untitled")}</strong>
          <small>${escapeHTML(item.description || "")}</small>
          <span class="${item.published ? "live" : "draft"}">
            ${item.published ? "Published" : "Draft"}
          </span>
        </div>
        <div class="row-actions">
          <button type="button" data-edit-project="${item.id}">Edit</button>
          <button type="button" class="danger" data-delete-project="${item.id}">Delete</button>
        </div>
      </article>
    `).join("");

    document.querySelectorAll("[data-edit-project]").forEach((button) => {
      button.addEventListener("click", () => {
        const item = items.find((x) => x.id === button.dataset.editProject);
        if (item) openProjectForm(item, item.id);
      });
    });

    document.querySelectorAll("[data-delete-project]").forEach((button) => {
      button.addEventListener("click", () => deleteProject(button.dataset.deleteProject));
    });
  } catch (error) {
    console.error("PROJECT LOAD ERROR:", error);
    projectsList.innerHTML = `<div class="empty">${escapeHTML(friendlyFirestoreError(error))}</div>`;
  }
}

// ------------------------------
// BLOG POSTS
// ------------------------------
async function loadPosts() {
  postsList.innerHTML = '<div class="empty">Loading blog posts…</div>';

  try {
    const snapshot = await getDocs(collection(db, "posts"));
    const items = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));

    items.sort((a, b) => timestampMs(b.createdAt) - timestampMs(a.createdAt));

    if (!items.length) {
      postsList.innerHTML = '<div class="empty">No blog posts yet.</div>';
      return;
    }

    postsList.innerHTML = items.map((item) => `
      <article class="item">
        <div>
          <strong>${escapeHTML(item.title || "Untitled")}</strong>
          <small>${escapeHTML(item.excerpt || "")}</small>
          <span class="${item.published ? "live" : "draft"}">
            ${item.published ? "Published" : "Draft"}
          </span>
        </div>
        <div class="row-actions">
          <button type="button" data-edit-post="${item.id}">Edit</button>
          <button type="button" class="danger" data-delete-post="${item.id}">Delete</button>
        </div>
      </article>
    `).join("");

    document.querySelectorAll("[data-edit-post]").forEach((button) => {
      button.addEventListener("click", () => {
        const item = items.find((x) => x.id === button.dataset.editPost);
        if (item) openPostForm(item, item.id);
      });
    });

    document.querySelectorAll("[data-delete-post]").forEach((button) => {
      button.addEventListener("click", () => deletePost(button.dataset.deletePost));
    });
  } catch (error) {
    console.error("POST LOAD ERROR:", error);
    postsList.innerHTML = `<div class="empty">${escapeHTML(friendlyFirestoreError(error))}</div>`;
  }
}

// ------------------------------
// DELETE
// ------------------------------
async function deleteProject(id) {
  if (!confirm("Delete this project?")) return;

  try {
    await deleteDoc(doc(db, "projects", id));
    await loadProjects();
  } catch (error) {
    console.error("DELETE PROJECT ERROR:", error);
    alert(friendlyFirestoreError(error));
  }
}

async function deletePost(id) {
  if (!confirm("Delete this blog post?")) return;

  try {
    await deleteDoc(doc(db, "posts", id));
    await loadPosts();
  } catch (error) {
    console.error("DELETE POST ERROR:", error);
    alert(friendlyFirestoreError(error));
  }
}

// ------------------------------
// HELPERS
// ------------------------------
function timestampMs(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (value.seconds) return value.seconds * 1000;
  return 0;
}

function friendlyFirestoreError(error) {
  if (error?.code === "permission-denied") {
    return "Firestore permission denied. Make sure this account has the admin custom claim (admin: true) and your Firestore rules allow admins.";
  }
  if (error?.code === "failed-precondition") {
    return "Firestore is not ready or the database/rules configuration needs attention.";
  }
  return error?.message || "Something went wrong.";
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
