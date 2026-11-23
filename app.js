
const db = supabaseClient;

const DEFAULT_CONTENT = {
  brandName: "Mini Tentación",
  heroEyebrow: "UN MIMO PARA TU DÍA",
  heroTitle: "Pequeños placeres, grandes momentos.",
  heroDescription: "Postres preparados con amor para endulzar tus momentos especiales.",
  heroButton: "Descubrir productos",
  productsEyebrow: "HECHOS CON AMOR",
  productsTitle: "Nuestras tentaciones",
  productsIntro: "Elegí tu favorito y disfrutá algo rico.",
  aboutEyebrow: "UN POQUITO DE NOSOTROS",
  aboutTitle: "Una historia dulce ♡",
  aboutText: "En Mini Tentación creemos que los momentos más lindos también se disfrutan con algo rico. Preparamos dulces para compartir con las personas que más querés y crear recuerdos especiales. Oreo, nuestro perrito, es la carita de la marca.",
  contactEyebrow: "ESTAMOS PARA ENDULZAR TU DÍA",
  contactTitle: "¿Tenés un antojo?",
  contactDescription: "Nos encantaría preparar algo rico para vos.",
  whatsapp: "5492233491455",
  instagram: "https://instagram.com/minitentacion.mdp",
  footerText: "Hecho con amor ♡"
};

let siteContent = { ...DEFAULT_CONTENT };
let products = [];
let currentUser = null;

const $ = (selector) => document.querySelector(selector);

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#039;"
  })[char]);
}

function applyContent() {
  const setText = (selector, value) => {
    const element = $(selector);
    if (element) element.textContent = value || "";
  };

  setText("#brandName", siteContent.brandName);
  setText(".hero-copy .eyebrow", siteContent.heroEyebrow);
  setText(".hero-copy h1", siteContent.heroTitle);
  setText(".hero-copy p", siteContent.heroDescription);
  setText(".hero-copy .button", siteContent.heroButton);
  setText(".products .eyebrow", siteContent.productsEyebrow);
  setText(".products h2", siteContent.productsTitle);
  setText(".section-intro", siteContent.productsIntro);
  setText(".about-copy .eyebrow", siteContent.aboutEyebrow);
  setText(".about-copy h2", siteContent.aboutTitle);
  setText("#aboutText", siteContent.aboutText);
  setText(".contact .eyebrow", siteContent.contactEyebrow);
  setText(".contact h2", siteContent.contactTitle);
  setText(".contact p", siteContent.contactDescription);
  setText("footer span:last-child", siteContent.footerText);

  const whatsapp = $("#whatsappLink");
  if (whatsapp) whatsapp.href = `https://wa.me/${siteContent.whatsapp}`;

  const instagram = $("#instagramLink");
  if (instagram) {
    instagram.href = siteContent.instagram;
    instagram.textContent = "Instagram";
  }
}

async function loadContent() {
  const { data, error } = await db
    .from("site_settings")
    .select("content")
    .eq("id", 1)
    .maybeSingle();

  if (!error && data?.content) {
    siteContent = { ...DEFAULT_CONTENT, ...data.content };
  }

  applyContent();
}

async function loadProducts() {
  const { data, error } = await db
    .from("products")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("No se pudieron cargar los productos:", error.message);
    return;
  }

  products = data || [];
  renderProducts();
}

function renderProducts() {
  const container = $("#productList");
  if (!container) return;

  container.innerHTML = "";

  if (!products.length) {
    container.innerHTML =
      '<p class="empty-products">Pronto vas a encontrar nuestras tentaciones.</p>';
    return;
  }

  products.forEach(product => {
    const card = document.createElement("article");
    card.className = "product-card";

    const image = document.createElement("img");
    image.src = product.image_url || "";
    image.alt = product.name;
    image.onerror = () => image.style.display = "none";

    const info = document.createElement("div");
    info.className = "product-info";

    const name = document.createElement("h3");
    name.textContent = product.name;

    const description = document.createElement("p");
    description.textContent = product.description || "";

    const price = document.createElement("strong");
    price.className = "product-price";
    price.textContent = product.price || "";

    const button = document.createElement("button");
    button.className = "button";
    button.type = "button";
    button.textContent = "Ver detalles";
    button.addEventListener("click", () => verProducto(product.id));

    info.append(name, description, price, button);
    card.append(image, info);
    container.appendChild(card);
  });
}

function verProducto(id) {
  const product = products.find(item => item.id === id);
  if (!product) return;

  $("#modalName").textContent = product.name;
  $("#modalDescription").textContent = product.description || "";
  $("#modalPrice").textContent = product.price || "";

  const image = $("#modalImage");
  image.src = product.image_url || "";
  image.alt = product.name;

  const message = encodeURIComponent(
    `¡Hola! Quiero consultar por ${product.name}.`
  );

  $("#modalOrder").href =
    `https://wa.me/${siteContent.whatsapp}?text=${message}`;

  $("#productModal").classList.add("open");
  $("#productModal").setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function cerrarModal() {
  $("#productModal").classList.remove("open");
  $("#productModal").setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

document.querySelectorAll("[data-close-modal]").forEach(element => {
  element.addEventListener("click", cerrarModal);
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") cerrarModal();
});

// Estilos del panel de administración
const adminStyles = document.createElement("style");
adminStyles.textContent = `
.admin-overlay {
  position:fixed; inset:0; z-index:3000; background:#34231f99;
  display:flex; align-items:center; justify-content:center;
  padding:16px; overflow:auto;
}
.admin-panel {
  background:#fffaf5; color:#594139; width:min(850px,100%);
  max-height:92vh; overflow:auto; padding:28px; border-radius:18px;
  box-shadow:0 20px 70px #0003; font-family:"DM Sans",sans-serif;
}
.admin-panel h2 {font-family:"Playfair Display",serif; margin:8px 0 20px;}
.admin-panel h3 {font-family:"Playfair Display",serif; margin:24px 0 12px;}
.admin-panel label {display:block; font-size:13px; margin:12px 0 5px;}
.admin-panel input,.admin-panel textarea {
  width:100%; padding:11px; border:1px solid #e5d5cd;
  border-radius:8px; background:white; color:#594139; font:inherit;
}
.admin-panel textarea {min-height:75px; resize:vertical;}
.admin-panel button {
  padding:11px 17px; border:0; border-radius:25px;
  background:#594139; color:white; cursor:pointer; margin:8px 6px 8px 0;
}
.admin-panel button.secondary {background:#b77f70;}
.admin-panel button.danger {background:#a34f49;}
.admin-panel .admin-close {float:right; background:#eadbd5; color:#594139;}
.admin-panel .admin-product {
  padding:14px; border:1px solid #eadbd5; border-radius:12px;
  margin:10px 0; background:white;
}
.admin-panel .admin-product strong {display:block;}
.admin-panel .admin-message {margin:12px 0; font-size:13px; color:#80675d;}
.admin-panel .admin-grid {display:grid; grid-template-columns:1fr 1fr; gap:12px;}
@media(max-width:600px) {
  .admin-panel {padding:19px;}
  .admin-panel .admin-grid {grid-template-columns:1fr;}
}
`;
document.head.appendChild(adminStyles);

function openAdminShell(content) {
  document.querySelector(".admin-overlay")?.remove();

  const overlay = document.createElement("div");
  overlay.className = "admin-overlay";
  overlay.innerHTML = `
    <section class="admin-panel">
      <button class="admin-close" type="button">Cerrar ×</button>
      ${content}
    </section>
  `;

  overlay.querySelector(".admin-close").addEventListener("click", () => {
    overlay.remove();
  });

  overlay.addEventListener("click", event => {
    if (event.target === overlay) overlay.remove();
  });

  document.body.appendChild(overlay);
  return overlay;
}

function showLogin(message = "") {
  const panel = openAdminShell(`
    <span class="eyebrow">MINI TENTACIÓN</span>
    <h2>Administrar página</h2>
    <p>Ingresá con tu cuenta administradora.</p>
    <form id="adminLogin">
      <label>Correo electrónico</label>
      <input name="email" type="email" autocomplete="username" required>
      <label>Contraseña</label>
      <input name="password" type="password" autocomplete="current-password" required>
      <p class="admin-message" id="loginMessage">${escapeHTML(message)}</p>
      <button type="submit">Iniciar sesión</button>
    </form>
  `);

  panel.querySelector("#adminLogin").addEventListener("submit", async event => {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const email = form.get("email");
    const password = form.get("password");
    const status = panel.querySelector("#loginMessage");

    status.textContent = "Comprobando acceso...";

    const { data, error } = await db.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      status.textContent = "No se pudo iniciar sesión. Revisá el correo y la contraseña.";
      return;
    }

    const { data: admin, error: adminError } = await db
      .from("admin_users")
      .select("user_id")
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (adminError || !admin) {
      await db.auth.signOut();
      status.textContent = "Esta cuenta no tiene permisos de administración.";
      return;
    }

    currentUser = data.user;
    showDashboard();
  });
}

function showDashboard() {
  const panel = openAdminShell(`
    <span class="eyebrow">PANEL PRIVADO</span>
    <h2>Administrar Mini Tentación</h2>
    <p>Desde acá podés actualizar el contenido de tu página.</p>
    <p class="admin-message" id="dashboardMessage"></p>

    <h3>Textos de la página</h3>
    <form id="contentForm">
      <div class="admin-grid">
        ${[
          ["brandName", "Nombre de la marca"],
          ["heroEyebrow", "Texto pequeño de inicio"],
          ["heroTitle", "Título principal"],
          ["heroDescription", "Descripción de inicio"],
          ["heroButton", "Texto del botón de inicio"],
          ["productsEyebrow", "Texto pequeño de productos"],
          ["productsTitle", "Título de productos"],
          ["productsIntro", "Descripción de productos"],
          ["aboutEyebrow", "Texto pequeño de nosotros"],
          ["aboutTitle", "Título de nosotros"],
          ["contactEyebrow", "Texto pequeño de contacto"],
          ["contactTitle", "Título de contacto"],
          ["contactDescription", "Descripción de contacto"],
          ["whatsapp", "WhatsApp (con código de país)"],
          ["instagram", "Enlace de Instagram"],
          ["footerText", "Texto del pie de página"]
        ].map(([key, label]) => `
          <div>
            <label>${label}</label>
            <input name="${key}" value="${escapeHTML(siteContent[key] || "")}">
          </div>
        `).join("")}
      </div>
      <label>Texto de Sobre nosotros</label>
      <textarea name="aboutText">${escapeHTML(siteContent.aboutText || "")}</textarea>
      <button type="submit">Guardar textos</button>
    </form>

    <h3>Productos</h3>
    <div id="adminProducts"></div>

    <h3>Agregar un producto</h3>
    <form id="newProductForm">
      <label>Nombre</label>
      <input name="name" required>
      <label>Precio</label>
      <input name="price" placeholder="Ej. $3.500">
      <label>Descripción</label>
      <textarea name="description"></textarea>
      <label>Foto del producto</label>
      <input name="image" type="file" accept="image/*">
      <button type="submit">Agregar producto</button>
    </form>

    <button class="secondary" id="logoutButton">Cerrar sesión</button>
  `);

  const message = panel.querySelector("#dashboardMessage");

  panel.querySelector("#contentForm").addEventListener("submit", async event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const updated = { ...siteContent };

    for (const [key, value] of form.entries()) {
      updated[key] = String(value).trim();
    }

    message.textContent = "Guardando cambios...";

    const { error } = await db
      .from("site_settings")
      .upsert({ id: 1, content: updated }, { onConflict: "id" });

    if (error) {
      message.textContent = "No se pudieron guardar los textos: " + error.message;
      return;
    }

    siteContent = updated;
    applyContent();
    message.textContent = "¡Los textos se guardaron correctamente!";
  });

  panel.querySelector("#newProductForm").addEventListener("submit", async event => {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const name = String(form.get("name")).trim();
    const price = String(form.get("price")).trim();
    const description = String(form.get("description")).trim();
    const file = form.get("image");

    message.textContent = "Guardando producto...";

    let imageUrl = "";

    if (file && file.size > 0) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `${Date.now()}-${safeName}`;

      const { error: uploadError } = await db.storage
        .from("product-images")
        .upload(path, file, { upsert: false });

      if (uploadError) {
        message.textContent = "No se pudo subir la foto: " + uploadError.message;
        return;
      }

      const { data: publicData } = db.storage
        .from("product-images")
        .getPublicUrl(path);

      imageUrl = publicData.publicUrl;
    }

    const { error } = await db.from("products").insert({
      name,
      price,
      description,
      image_url: imageUrl,
      active: true
    });

    if (error) {
      message.textContent = "No se pudo guardar el producto: " + error.message;
      return;
    }

    event.currentTarget.reset();
    message.textContent = "¡Producto agregado!";
    await loadProducts();
    renderAdminProducts(panel);
  });

  renderAdminProducts(panel);

  panel.querySelector("#logoutButton").addEventListener("click", async () => {
    await db.auth.signOut();
    currentUser = null;
    panel.remove();
    showLogin("Cerraste sesión correctamente.");
  });
}

function renderAdminProducts(panel) {
  const container = panel.querySelector("#adminProducts");
  if (!container) return;

  container.innerHTML = "";

  if (!products.length) {
    container.textContent = "Todavía no agregaste productos.";
    return;
  }

  products.forEach(product => {
    const item = document.createElement("div");
    item.className = "admin-product";

    const title = document.createElement("strong");
    title.textContent = product.name;

    const price = document.createElement("p");
    price.textContent = product.price || "Sin precio";

    const edit = document.createElement("button");
    edit.textContent = "Editar";
    edit.className = "secondary";
    edit.addEventListener("click", () => editProduct(product, panel));

    const remove = document.createElement("button");
    remove.textContent = "Eliminar";
    remove.className = "danger";
    remove.addEventListener("click", async () => {
      if (!confirm(`¿Querés eliminar "${product.name}"?`)) return;

      const { error } = await db
        .from("products")
        .delete()
        .eq("id", product.id);

      if (error) {
        alert("No se pudo eliminar: " + error.message);
        return;
      }

      await loadProducts();
      renderAdminProducts(panel);
    });

    item.append(title, price, edit, remove);
    container.appendChild(item);
  });
}

function editProduct(product, panel) {
  const name = prompt("Nombre del producto:", product.name);
  if (name === null) return;

  const price = prompt("Precio:", product.price || "");
  if (price === null) return;

  const description = prompt("Descripción:", product.description || "");
  if (description === null) return;

  db.from("products")
    .update({ name, price, description })
    .eq("id", product.id)
    .then(async ({ error }) => {
      if (error) {
        alert("No se pudo actualizar: " + error.message);
        return;
      }

      await loadProducts();
      renderAdminProducts(panel);
    });
}

async function initialize() {
  await loadContent();
  await loadProducts();

  const { data } = await db.auth.getSession();
  if (data.session) {
    currentUser = data.session.user;
  }
}

$("#adminAccess").addEventListener("click", () => showLogin());

initialize();
