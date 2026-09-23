import { loadProjects, loadPosts } from "./firebase.js";

const $ = (s) => document.querySelector(s);
const escapeHTML = (value="") => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

function projectCard(p){
  const tags=(p.tags||[]).map(t=>`<span class="tag">${escapeHTML(t)}</span>`).join("");
  return `<article class="project-card"><a href="${escapeHTML(p.url||'#')}" target="_blank" rel="noreferrer"><div class="project-image"><span>${escapeHTML(p.label||'PROJECT')}</span></div><div class="project-info"><h3>${escapeHTML(p.title)}</h3><p>${escapeHTML(p.description||'')}</p><div class="tags">${tags}</div></div></a></article>`;
}
function postCard(p){
  const date=p.date ? new Date(p.date).toLocaleDateString(undefined,{year:"numeric",month:"short",day:"numeric"}) : "";
  return `<article class="post-card"><div class="date">${escapeHTML(date)}</div><div><h3>${escapeHTML(p.title)}</h3><p>${escapeHTML(p.excerpt||p.content||'')}</p></div></article>`;
}
async function render(){
  document.querySelectorAll("#year").forEach(x=>x.textContent=new Date().getFullYear());
  const projects=await loadProjects();
  const posts=await loadPosts();
  const fp=$("#featured-projects"), ap=$("#all-projects"), lp=$("#latest-posts"), all=$("#all-posts");
  if(fp) fp.innerHTML=projects.slice(0,4).map(projectCard).join("") || '<div class="empty">Projects will appear here after you publish them from the admin panel.</div>';
  if(ap) ap.innerHTML=projects.map(projectCard).join("") || '<div class="empty">No projects published yet.</div>';
  if(lp) lp.innerHTML=posts.slice(0,3).map(postCard).join("") || '<div class="empty">Posts will appear here after you publish them from the admin panel.</div>';
  if(all) all.innerHTML=posts.map(postCard).join("") || '<div class="empty">No posts published yet.</div>';
}
const menu=$(".menu-toggle"), nav=$(".nav");
menu?.addEventListener("click",()=>nav?.classList.toggle("open"));
$("#contact-form")?.addEventListener("submit",e=>{
  e.preventDefault();
  const f=e.currentTarget, data=new FormData(f);
  const subject=encodeURIComponent("Portfolio enquiry from "+data.get("name"));
  const body=encodeURIComponent(`Name: ${data.get("name")}\nEmail: ${data.get("email")}\n\n${data.get("message")}`);
  window.location.href=`mailto:contact.kafiabdullah@gmail.com?subject=${subject}&body=${body}`;
  $("#form-status").textContent="Opening your email app…";
});
render();
