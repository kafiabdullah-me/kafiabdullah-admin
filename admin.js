/*
  ADMIN PANEL
  ===========
  This panel uses Firebase Authentication + Firestore.
  Add your Firebase config in firebase-config.js.

  SECURITY:
  - Do not use a service-account key in browser code.
  - Protect Firestore with Security Rules.
  - For stronger control, restrict writes to authenticated admins
    using a custom claim such as admin: true.
*/
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, getDocs, serverTimestamp, query, orderBy } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app=initializeApp(firebaseConfig), auth=getAuth(app), db=getFirestore(app);
const $=s=>document.querySelector(s);
const loginCard=$("#login-card"), dashboard=$("#dashboard"), status=$("#login-status");

$("#login-form").addEventListener("submit",async e=>{
  e.preventDefault(); status.textContent="Signing in…";
  try{await signInWithEmailAndPassword(auth,$("#email").value,$("#password").value);status.textContent=""}
  catch(err){status.textContent=err.message}
});
$("#logout").addEventListener("click",()=>signOut(auth));

onAuthStateChanged(auth,async user=>{
  if(user){loginCard.classList.add("hidden");dashboard.classList.remove("hidden");$("#user-email").textContent=user.email||"Signed in";await refresh();}
  else{dashboard.classList.add("hidden");loginCard.classList.remove("hidden")}
});

document.querySelectorAll(".tab").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));btn.classList.add("active");
  $("#projects-panel").classList.toggle("hidden",btn.dataset.tab!=="projects");
  $("#posts-panel").classList.toggle("hidden",btn.dataset.tab!=="posts");
}));

$("#new-project").onclick=()=>openProjectForm();
$("#new-post").onclick=()=>openPostForm();

async function getItems(name){
  const q=query(collection(db,name),orderBy("createdAt","desc"));
  const s=await getDocs(q); return s.docs.map(d=>({id:d.id,...d.data()}));
}
async function refresh(){
  try{
    const [projects,posts]=await Promise.all([getItems("projects"),getItems("posts")]);
    $("#count").textContent=`${projects.length} projects · ${posts.length} posts`;
    $("#project-list").innerHTML=projects.map(item=>row(item,"project")).join("")||'<div class="empty">No projects yet.</div>';
    $("#post-list").innerHTML=posts.map(item=>row(item,"post")).join("")||'<div class="empty">No posts yet.</div>';
    document.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>b.dataset.editType==="project"?openProjectForm(projects.find(x=>x.id===b.dataset.edit)):openPostForm(posts.find(x=>x.id===b.dataset.edit)));
    document.querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>removeItem(b.dataset.deleteType,b.dataset.delete));
  }catch(err){console.error(err);alert("Could not load Firestore. Check Firebase config and Security Rules.");}
}
function row(x,type){
  return `<div class="item"><div><b>${esc(x.title||"Untitled")}</b><small>${type==="project"?(x.description||""):(x.excerpt||"")}</small><span class="${x.published?'live':'draft'}">${x.published?'Published':'Draft'}</span></div><div class="row-actions"><button data-edit="${x.id}" data-edit-type="${type}">Edit</button><button data-delete="${x.id}" data-delete-type="${type}" class="danger">Delete</button></div></div>`;
}
function esc(v=""){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function modal(title,html,onSave){
  const wrap=document.createElement("div");wrap.className="modal";wrap.innerHTML=`<div class="modal-box"><div class="panel-head"><h2>${title}</h2><button class="close">×</button></div><form>${html}<button class="save">Save changes</button></form></div>`;
  document.body.appendChild(wrap);wrap.querySelector(".close").onclick=()=>wrap.remove();wrap.querySelector("form").onsubmit=async e=>{e.preventDefault();await onSave(new FormData(e.target));wrap.remove();await refresh()};
}
function fields(type,x={}){
 if(type==="project") return `<label>Title<input name="title" value="${esc(x.title||"")}" required></label><label>Description<textarea name="description" required>${esc(x.description||"")}</textarea></label><label>URL<input name="url" value="${esc(x.url||"#")}"></label><label>Label<input name="label" value="${esc(x.label||"PROJECT")}"></label><label>Tags <small>comma separated</small><input name="tags" value="${esc((x.tags||[]).join(", "))}"></label><label class="check"><input name="published" type="checkbox" ${x.published?"checked":""}> Published</label>`;
 return `<label>Title<input name="title" value="${esc(x.title||"")}" required></label><label>Excerpt<textarea name="excerpt" required>${esc(x.excerpt||"")}</textarea></label><label>Content<textarea name="content" rows="10">${esc(x.content||"")}</textarea></label><label class="check"><input name="published" type="checkbox" ${x.published?"checked":""}> Published</label>`;
}
function openProjectForm(x=null){modal(x?"Edit project":"New project",fields("project",x||{}),async f=>{const data={title:f.get("title"),description:f.get("description"),url:f.get("url"),label:f.get("label"),tags:f.get("tags").split(",").map(x=>x.trim()).filter(Boolean),published:f.get("published")==="on",updatedAt:serverTimestamp()};x?await updateDoc(doc(db,"projects",x.id),data):await addDoc(collection(db,"projects"),{...data,createdAt:serverTimestamp()})})}
function openPostForm(x=null){modal(x?"Edit post":"New post",fields("post",x||{}),async f=>{const data={title:f.get("title"),excerpt:f.get("excerpt"),content:f.get("content"),published:f.get("published")==="on",updatedAt:serverTimestamp()};x?await updateDoc(doc(db,"posts",x.id),data):await addDoc(collection(db,"posts"),{...data,createdAt:serverTimestamp(),date:new Date().toISOString()})})}
async function removeItem(type,id){if(!confirm("Delete this item?"))return;await deleteDoc(doc(db,type==="project"?"projects":"posts",id));await refresh()}
