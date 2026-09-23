/* ============================================================
   KAFI PORTFOLIO — ADMIN PANEL
   ============================================================

   Firebase is loaded directly from Google's CDN.

   IMPORTANT:
   - Do NOT use:
       import ... from "firebase/app"

   - We use the CDN URLs below because this project runs
     directly in the browser and does not use npm/Vite.

   ============================================================ */


import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";


import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";


import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


import {
  firebaseConfig
} from "./firebase-config.js";



/* ============================================================
   FIREBASE INITIALIZATION
   ============================================================ */

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);



/* ============================================================
   DOM ELEMENTS
   ============================================================ */

const loginView =
  document.getElementById("loginView");

const dashboardView =
  document.getElementById("dashboardView");

const loginForm =
  document.getElementById("loginForm");

const loginBtn =
  document.getElementById("loginBtn");

const loginMessage =
  document.getElementById("loginMessage");

const logoutBtn =
  document.getElementById("logoutBtn");

const currentUser =
  document.getElementById("currentUser");

const dashboardMessage =
  document.getElementById("dashboardMessage");



/* PROJECTS */

const projectForm =
  document.getElementById("projectForm");

const newProjectBtn =
  document.getElementById("newProjectBtn");

const cancelProjectBtn =
  document.getElementById("cancelProjectBtn");

const projectsList =
  document.getElementById("projectsList");



/* POSTS */

const postForm =
  document.getElementById("postForm");

const newPostBtn =
  document.getElementById("newPostBtn");

const cancelPostBtn =
  document.getElementById("cancelPostBtn");

const postsList =
  document.getElementById("postsList");



/* ============================================================
   HELPER FUNCTIONS
   ============================================================ */

function showLoginMessage(message, type = "error") {

  loginMessage.textContent = message;

  loginMessage.className =
    `message ${type}`;

}


function showDashboardMessage(
  message,
  type = "success"
) {

  dashboardMessage.textContent = message;

  dashboardMessage.className =
    `message ${type}`;

}


function clearLoginMessage() {

  loginMessage.textContent = "";

  loginMessage.className = "message";

}


function clearDashboardMessage() {

  dashboardMessage.textContent = "";

  dashboardMessage.className = "message";

}


function escapeHTML(value) {

  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}



/* ============================================================
   LOGIN
   ============================================================ */

/*
   VERY IMPORTANT:

   preventDefault() stops the normal HTML form submission.

   Without this, clicking "Sign in" causes the whole page
   to refresh instead of running Firebase Authentication.
*/

loginForm.addEventListener("submit", async (event) => {

  event.preventDefault();

  clearLoginMessage();


  const email =
    document.getElementById("adminEmail")
      .value
      .trim();


  const password =
    document.getElementById("adminPassword")
      .value;


  if (!email || !password) {

    showLoginMessage(
      "Please enter your email and password.",
      "error"
    );

    return;
  }


  loginBtn.disabled = true;

  loginBtn.textContent = "Signing in...";


  try {

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );


    showLoginMessage(
      "Login successful.",
      "success"
    );


  } catch (error) {

    console.error(
      "Firebase login error:",
      error
    );


    let message =
      "Login failed. Please check your email and password.";


    if (error.code === "auth/invalid-credential") {

      message =
        "Invalid email or password.";

    }

    else if (error.code === "auth/user-not-found") {

      message =
        "No Firebase user exists with this email.";

    }

    else if (error.code === "auth/wrong-password") {

      message =
        "The password is incorrect.";

    }

    else if (error.code === "auth/invalid-email") {

      message =
        "The email address is invalid.";

    }

    else if (error.code === "auth/too-many-requests") {

      message =
        "Too many login attempts. Please wait and try again.";

    }

    else if (error.code === "auth/network-request-failed") {

      message =
        "Network error. Check your internet connection.";

    }

    else if (error.code === "auth/operation-not-allowed") {

      message =
        "Email/Password login is not enabled in Firebase Authentication.";

    }


    showLoginMessage(
      message,
      "error"
    );

  }


  finally {

    loginBtn.disabled = false;

    loginBtn.textContent = "Sign in";

  }

});



/* ============================================================
   AUTH STATE
   ============================================================ */

onAuthStateChanged(
  auth,
  async (user) => {

    if (user) {

      /*
        User is logged in.
      */

      loginView.classList.add("hidden");

      dashboardView.classList.remove("hidden");


      currentUser.textContent =
        `Signed in as ${user.email}`;


      clearLoginMessage();


      await loadProjects();

      await loadPosts();

    }

    else {

      /*
        User is logged out.
      */

      loginView.classList.remove("hidden");

      dashboardView.classList.add("hidden");

    }

  }
);



/* ============================================================
   LOGOUT
   ============================================================ */

logoutBtn.addEventListener(
  "click",
  async () => {

    try {

      await signOut(auth);

      showLoginMessage(
        "You have been signed out.",
        "success"
      );

    }

    catch (error) {

      console.error(
        "Logout error:",
        error
      );

    }

  }
);



/* ============================================================
   TABS
   ============================================================ */

document
  .querySelectorAll(".tab")
  .forEach((button) => {

    button.addEventListener(
      "click",
      () => {

        document
          .querySelectorAll(".tab")
          .forEach((tab) => {

            tab.classList.remove("active");

          });


        button.classList.add("active");


        const tabName =
          button.dataset.tab;


        if (tabName === "projects") {

          document
            .getElementById("projectsTab")
            .classList.remove("hidden");


          document
            .getElementById("postsTab")
            .classList.add("hidden");

        }

        else {

          document
            .getElementById("projectsTab")
            .classList.add("hidden");


          document
            .getElementById("postsTab")
            .classList.remove("hidden");

        }

      }

    );

  });



/* ============================================================
   PROJECT FORM
   ============================================================ */

newProjectBtn.addEventListener(
  "click",
  () => {

    projectForm.reset();

    document.getElementById(
      "projectId"
    ).value = "";


    document.getElementById(
      "projectPublished"
    ).checked = true;


    projectForm.classList.remove("hidden");

    projectForm.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  }
);


cancelProjectBtn.addEventListener(
  "click",
  () => {

    projectForm.classList.add("hidden");

  }
);



/* ============================================================
   SAVE PROJECT
   ============================================================ */

projectForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();


    clearDashboardMessage();


    const projectId =
      document.getElementById(
        "projectId"
      ).value;


    const title =
      document.getElementById(
        "projectTitle"
      ).value.trim();


    const description =
      document.getElementById(
        "projectDescription"
      ).value.trim();


    const url =
      document.getElementById(
        "projectUrl"
      ).value.trim();


    const label =
      document.getElementById(
        "projectLabel"
      ).value.trim();


    const tags =
      document.getElementById(
        "projectTags"
      ).value
        .split(",")
        .map(tag => tag.trim())
        .filter(Boolean);


    const published =
      document.getElementById(
        "projectPublished"
      ).checked;


    const projectData = {

      title,

      description,

      url,

      label,

      tags,

      published

    };


    try {

      if (projectId) {

        await updateDoc(
          doc(
            db,
            "projects",
            projectId
          ),
          projectData
        );


        showDashboardMessage(
          "Project updated successfully."
        );

      }

      else {

        await addDoc(
          collection(
            db,
            "projects"
          ),
          {
            ...projectData,
            createdAt: serverTimestamp()
          }
        );


        showDashboardMessage(
          "Project added successfully."
        );

      }


      projectForm.reset();

      projectForm.classList.add(
        "hidden"
      );


      await loadProjects();

    }

    catch (error) {

      console.error(
        "Project save error:",
        error
      );


      showDashboardMessage(
        `Could not save project: ${error.message}`,
        "error"
      );

    }

  }
);



/* ============================================================
   LOAD PROJECTS
   ============================================================ */

async function loadProjects() {

  projectsList.innerHTML =
    "<p class='muted'>Loading projects...</p>";


  try {

    const q =
      query(
        collection(
          db,
          "projects"
        ),
        orderBy(
          "createdAt",
          "desc"
        )
      );


    const snapshot =
      await getDocs(q);


    if (snapshot.empty) {

      projectsList.innerHTML =
        "<p class='muted'>No projects yet.</p>";

      return;

    }


    projectsList.innerHTML = "";


    snapshot.forEach(
      (documentSnapshot) => {

        const project =
          documentSnapshot.data();


        const id =
          documentSnapshot.id;


        const card =
          document.createElement("article");


        card.className =
          "admin-item";


        card.innerHTML = `

          <div class="admin-item-content">

            <div class="item-status ${
              project.published
                ? "published"
                : "draft"
            }">

              ${
                project.published
                  ? "Published"
                  : "Draft"
              }

            </div>

            <h4>
              ${escapeHTML(project.title)}
            </h4>

            <p>
              ${escapeHTML(project.description)}
            </p>

            ${
              project.url
                ? `
                  <a
                    href="${escapeHTML(project.url)}"
                    target="_blank"
                    rel="noopener"
                  >
                    Open project ↗
                  </a>
                `
                : ""
            }

          </div>


          <div class="admin-item-actions">

            <button
              type="button"
              class="secondary-btn edit-project"
              data-id="${id}"
            >
              Edit
            </button>

            <button
              type="button"
              class="danger-btn delete-project"
              data-id="${id}"
            >
              Delete
            </button>

          </div>

        `;


        projectsList.appendChild(card);

      }
    );


    document
      .querySelectorAll(".edit-project")
      .forEach((button) => {

        button.addEventListener(
          "click",
          () => {

            editProject(
              button.dataset.id
            );

          }
        );

      });


    document
      .querySelectorAll(".delete-project")
      .forEach((button) => {

        button.addEventListener(
          "click",
          () => {

            deleteProject(
              button.dataset.id
            );

          }
        );

      });

  }

  catch (error) {

    console.error(
      "Load projects error:",
      error
    );


    projectsList.innerHTML = `

      <div class="error-box">

        Unable to load projects.

        <br><br>

        ${escapeHTML(error.message)}

      </div>

    `;

  }

}



/* ============================================================
   EDIT PROJECT
   ============================================================ */

async function editProject(id) {

  try {

    const q =
      query(
        collection(
          db,
          "projects"
        ),
        orderBy(
          "createdAt",
          "desc"
        )
      );


    const snapshot =
      await getDocs(q);


    let selected = null;


    snapshot.forEach(
      (documentSnapshot) => {

        if (
          documentSnapshot.id === id
        ) {

          selected = {
            id: documentSnapshot.id,
            ...documentSnapshot.data()
          };

        }

      }
    );


    if (!selected) {

      alert("Project not found.");

      return;

    }


    document.getElementById(
      "projectId"
    ).value = selected.id;


    document.getElementById(
      "projectTitle"
    ).value =
      selected.title || "";


    document.getElementById(
      "projectDescription"
    ).value =
      selected.description || "";


    document.getElementById(
      "projectUrl"
    ).value =
      selected.url || "";


    document.getElementById(
      "projectLabel"
    ).value =
      selected.label || "";


    document.getElementById(
      "projectTags"
    ).value =
      Array.isArray(selected.tags)
        ? selected.tags.join(", ")
        : "";


    document.getElementById(
      "projectPublished"
    ).checked =
      selected.published === true;


    projectForm.classList.remove(
      "hidden"
    );


    projectForm.scrollIntoView({
      behavior: "smooth"
    });

  }

  catch (error) {

    console.error(
      "Edit project error:",
      error
    );

  }

}



/* ============================================================
   DELETE PROJECT
   ============================================================ */

async function deleteProject(id) {

  const confirmed =
    confirm(
      "Are you sure you want to delete this project?"
    );


  if (!confirmed) {
    return;
  }


  try {

    await deleteDoc(
      doc(
        db,
        "projects",
        id
      )
    );


    showDashboardMessage(
      "Project deleted."
    );


    await loadProjects();

  }

  catch (error) {

    console.error(
      "Delete project error:",
      error
    );


    showDashboardMessage(
      `Could not delete project: ${error.message}`,
      "error"
    );

  }

}



/* ============================================================
   BLOG FORM
   ============================================================ */

newPostBtn.addEventListener(
  "click",
  () => {

    postForm.reset();

    document.getElementById(
      "postId"
    ).value = "";


    document.getElementById(
      "postPublished"
    ).checked = true;


    postForm.classList.remove(
      "hidden"
    );


    postForm.scrollIntoView({
      behavior: "smooth"
    });

  }
);


cancelPostBtn.addEventListener(
  "click",
  () => {

    postForm.classList.add(
      "hidden"
    );

  }
);



/* ============================================================
   SAVE BLOG POST
   ============================================================ */

postForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();


    clearDashboardMessage();


    const postId =
      document.getElementById(
        "postId"
      ).value;


    const title =
      document.getElementById(
        "postTitle"
      ).value.trim();


    const excerpt =
      document.getElementById(
        "postExcerpt"
      ).value.trim();


    const content =
      document.getElementById(
        "postContent"
      ).value.trim();


    const published =
      document.getElementById(
        "postPublished"
      ).checked;


    const postData = {

      title,

      excerpt,

      content,

      published

    };


    try {

      if (postId) {

        await updateDoc(
          doc(
            db,
            "posts",
            postId
          ),
          postData
        );


        showDashboardMessage(
          "Blog post updated successfully."
        );

      }

      else {

        await addDoc(
          collection(
            db,
            "posts"
          ),
          {
            ...postData,
            createdAt: serverTimestamp()
          }
        );


        showDashboardMessage(
          "Blog post added successfully."
        );

      }


      postForm.reset();

      postForm.classList.add(
        "hidden"
      );


      await loadPosts();

    }

    catch (error) {

      console.error(
        "Post save error:",
        error
      );


      showDashboardMessage(
        `Could not save post: ${error.message}`,
        "error"
      );

    }

  }
);



/* ============================================================
   LOAD BLOG POSTS
   ============================================================ */

async function loadPosts() {

  postsList.innerHTML =
    "<p class='muted'>Loading posts...</p>";


  try {

    const q =
      query(
        collection(
          db,
          "posts"
        ),
        orderBy(
          "createdAt",
          "desc"
        )
      );


    const snapshot =
      await getDocs(q);


    if (snapshot.empty) {

      postsList.innerHTML =
        "<p class='muted'>No blog posts yet.</p>";

      return;

    }


    postsList.innerHTML = "";


    snapshot.forEach(
      (documentSnapshot) => {

        const post =
          documentSnapshot.data();


        const id =
          documentSnapshot.id;


        const card =
          document.createElement("article");


        card.className =
          "admin-item";


        card.innerHTML = `

          <div class="admin-item-content">

            <div class="item-status ${
              post.published
                ? "published"
                : "draft"
            }">

              ${
                post.published
                  ? "Published"
                  : "Draft"
              }

            </div>

            <h4>
              ${escapeHTML(post.title)}
            </h4>

            <p>
              ${escapeHTML(post.excerpt)}
            </p>

          </div>


          <div class="admin-item-actions">

            <button
              type="button"
              class="secondary-btn edit-post"
              data-id="${id}"
            >
              Edit
            </button>

            <button
              type="button"
              class="danger-btn delete-post"
              data-id="${id}"
            >
              Delete
            </button>

          </div>

        `;


        postsList.appendChild(card);

      }
    );


    document
      .querySelectorAll(".edit-post")
      .forEach((button) => {

        button.addEventListener(
          "click",
          () => {

            editPost(
              button.dataset.id
            );

          }
        );

      });


    document
      .querySelectorAll(".delete-post")
      .forEach((button) => {

        button.addEventListener(
          "click",
          () => {

            deletePost(
              button.dataset.id
            );

          }
        );

      });

  }

  catch (error) {

    console.error(
      "Load posts error:",
      error
    );


    postsList.innerHTML = `

      <div class="error-box">

        Unable to load blog posts.

        <br><br>

        ${escapeHTML(error.message)}

      </div>

    `;

  }

}



/* ============================================================
   EDIT BLOG POST
   ============================================================ */

async function editPost(id) {

  try {

    const q =
      query(
        collection(
          db,
          "posts"
        ),
        orderBy(
          "createdAt",
          "desc"
        )
      );


    const snapshot =
      await getDocs(q);


    let selected = null;


    snapshot.forEach(
      (documentSnapshot) => {

        if (
          documentSnapshot.id === id
        ) {

          selected = {
            id: documentSnapshot.id,
            ...documentSnapshot.data()
          };

        }

      }
    );


    if (!selected) {

      alert("Blog post not found.");

      return;

    }


    document.getElementById(
      "postId"
    ).value = selected.id;


    document.getElementById(
      "postTitle"
    ).value =
      selected.title || "";


    document.getElementById(
      "postExcerpt"
    ).value =
      selected.excerpt || "";


    document.getElementById(
      "postContent"
    ).value =
      selected.content || "";


    document.getElementById(
      "postPublished"
    ).checked =
      selected.published === true;


    postForm.classList.remove(
      "hidden"
    );


    postForm.scrollIntoView({
      behavior: "smooth"
    });

  }

  catch (error) {

    console.error(
      "Edit post error:",
      error
    );

  }

}



/* ============================================================
   DELETE BLOG POST
   ============================================================ */

async function deletePost(id) {

  const confirmed =
    confirm(
      "Are you sure you want to delete this blog post?"
    );


  if (!confirmed) {
    return;
  }


  try {

    await deleteDoc(
      doc(
        db,
        "posts",
        id
      )
    );


    showDashboardMessage(
      "Blog post deleted."
    );


    await loadPosts();

  }

  catch (error) {

    console.error(
      "Delete post error:",
      error
    );


    showDashboardMessage(
      `Could not delete post: ${error.message}`,
      "error"
    );

  }

}