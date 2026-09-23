import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  query,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

import { firebaseConfig } from "./firebase-config.js";


// ============================================================
// FIREBASE INITIALIZATION
// ============================================================

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// ============================================================
// ELEMENTS
// ============================================================

const loginSection = document.getElementById("loginSection");
const dashboardSection = document.getElementById("dashboardSection");

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginMessage = document.getElementById("loginMessage");

const logoutBtn = document.getElementById("logoutBtn");

const projectsList = document.getElementById("projectsList");
const postsList = document.getElementById("postsList");

const projectForm = document.getElementById("projectForm");
const postForm = document.getElementById("postForm");

const projectMessage = document.getElementById("projectMessage");
const postMessage = document.getElementById("postMessage");


// ============================================================
// AUTH STATE
// ============================================================

onAuthStateChanged(auth, async (user) => {

  if (user) {

    console.log("Logged in:", user.email);

    loginSection.style.display = "none";
    dashboardSection.style.display = "block";

    await loadProjects();
    await loadPosts();

  } else {

    console.log("Not logged in");

    loginSection.style.display = "block";
    dashboardSection.style.display = "none";
  }

});


// ============================================================
// LOGIN
// ============================================================

loginForm.addEventListener("submit", async (event) => {

  event.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  loginMessage.textContent = "Signing in...";

  try {

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    loginMessage.textContent = "Login successful.";

    // Clean URL
    window.history.replaceState(
      {},
      document.title,
      window.location.pathname
    );

  } catch (error) {

    console.error("LOGIN ERROR:", error);

    let message = "Login failed.";

    if (error.code === "auth/invalid-credential") {
      message = "Email or password is incorrect.";
    }

    if (error.code === "auth/invalid-email") {
      message = "Please enter a valid email address.";
    }

    if (error.code === "auth/user-not-found") {
      message = "No Firebase user found with this email.";
    }

    if (error.code === "auth/wrong-password") {
      message = "Incorrect password.";
    }

    if (error.code === "auth/too-many-requests") {
      message = "Too many attempts. Please try again later.";
    }

    loginMessage.textContent = message;
  }

});


// ============================================================
// LOGOUT
// ============================================================

logoutBtn.addEventListener("click", async () => {

  await signOut(auth);

});


// ============================================================
// LOAD PROJECTS
// ============================================================

async function loadProjects() {

  projectsList.innerHTML = "Loading projects...";

  try {

    const q = query(
      collection(db, "projects"),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {

      projectsList.innerHTML = "<p>No projects yet.</p>";
      return;
    }

    projectsList.innerHTML = "";

    snapshot.forEach((item) => {

      const data = item.data();

      const div = document.createElement("div");

      div.className = "admin-item";

      div.innerHTML = `
        <div>
          <strong>${escapeHTML(data.title || "Untitled")}</strong>

          <p>${escapeHTML(data.description || "")}</p>

          <small>
            ${data.published ? "Published" : "Draft"}
          </small>
        </div>

        <div class="admin-actions">

          <button
            type="button"
            data-edit-project="${item.id}">
            Edit
          </button>

          <button
            type="button"
            data-delete-project="${item.id}">
            Delete
          </button>

        </div>
      `;

      projectsList.appendChild(div);

    });

    document.querySelectorAll("[data-delete-project]")
      .forEach(button => {

        button.addEventListener("click", () => {
          deleteProject(button.dataset.deleteProject);
        });

      });

  } catch (error) {

    console.error("PROJECT LOAD ERROR:", error);

    projectsList.innerHTML = `
      <p>
        Cannot load projects.
        Check your Firestore Rules and admin permission.
      </p>
    `;
  }

}


// ============================================================
// LOAD POSTS
// ============================================================

async function loadPosts() {

  postsList.innerHTML = "Loading blog posts...";

  try {

    const q = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {

      postsList.innerHTML = "<p>No blog posts yet.</p>";
      return;
    }

    postsList.innerHTML = "";

    snapshot.forEach((item) => {

      const data = item.data();

      const div = document.createElement("div");

      div.className = "admin-item";

      div.innerHTML = `
        <div>

          <strong>
            ${escapeHTML(data.title || "Untitled")}
          </strong>

          <p>
            ${escapeHTML(data.excerpt || "")}
          </p>

          <small>
            ${data.published ? "Published" : "Draft"}
          </small>

        </div>

        <div class="admin-actions">

          <button
            type="button"
            data-delete-post="${item.id}">
            Delete
          </button>

        </div>
      `;

      postsList.appendChild(div);

    });

    document.querySelectorAll("[data-delete-post]")
      .forEach(button => {

        button.addEventListener("click", () => {
          deletePost(button.dataset.deletePost);
        });

      });

  } catch (error) {

    console.error("POST LOAD ERROR:", error);

    postsList.innerHTML = `
      <p>
        Cannot load posts.
        Check your Firestore Rules and admin permission.
      </p>
    `;
  }

}


// ============================================================
// ADD PROJECT
// ============================================================

projectForm.addEventListener("submit", async (event) => {

  event.preventDefault();

  projectMessage.textContent = "Saving...";

  try {

    const title =
      document.getElementById("projectTitle").value.trim();

    const description =
      document.getElementById("projectDescription").value.trim();

    const url =
      document.getElementById("projectUrl").value.trim();

    const label =
      document.getElementById("projectLabel").value.trim();

    const tags =
      document.getElementById("projectTags").value
        .split(",")
        .map(tag => tag.trim())
        .filter(Boolean);

    const published =
      document.getElementById("projectPublished").checked;


    await addDoc(
      collection(db, "projects"),
      {
        title,
        description,
        url,
        label,
        tags,
        published,
        createdAt: serverTimestamp()
      }
    );


    projectForm.reset();

    projectMessage.textContent =
      "Project saved successfully.";

    await loadProjects();

  } catch (error) {

    console.error("ADD PROJECT ERROR:", error);

    projectMessage.textContent =
      "Could not save project. Check Firestore permissions.";
  }

});


// ============================================================
// ADD BLOG POST
// ============================================================

postForm.addEventListener("submit", async (event) => {

  event.preventDefault();

  postMessage.textContent = "Saving...";

  try {

    const title =
      document.getElementById("postTitle").value.trim();

    const excerpt =
      document.getElementById("postExcerpt").value.trim();

    const content =
      document.getElementById("postContent").value.trim();

    const published =
      document.getElementById("postPublished").checked;


    await addDoc(
      collection(db, "posts"),
      {
        title,
        excerpt,
        content,
        published,
        createdAt: serverTimestamp()
      }
    );


    postForm.reset();

    postMessage.textContent =
      "Blog post saved successfully.";

    await loadPosts();

  } catch (error) {

    console.error("ADD POST ERROR:", error);

    postMessage.textContent =
      "Could not save blog post. Check Firestore permissions.";
  }

});


// ============================================================
// DELETE PROJECT
// ============================================================

async function deleteProject(id) {

  if (!confirm("Delete this project?")) {
    return;
  }

  try {

    await deleteDoc(
      doc(db, "projects", id)
    );

    await loadProjects();

  } catch (error) {

    console.error("DELETE PROJECT ERROR:", error);

    alert("Could not delete project.");

  }

}


// ============================================================
// DELETE POST
// ============================================================

async function deletePost(id) {

  if (!confirm("Delete this blog post?")) {
    return;
  }

  try {

    await deleteDoc(
      doc(db, "posts", id)
    );

    await loadPosts();

  } catch (error) {

    console.error("DELETE POST ERROR:", error);

    alert("Could not delete blog post.");

  }

}


// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHTML(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}