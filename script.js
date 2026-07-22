const portfolioData = window.PORTFOLIO_DATA || { items: [], filters: { types: [], topics: [], years: [] } };
const allItems = portfolioData.items || [];
const site = portfolioData.site || {};
const profile = site.profile || {};

const state = {
  type: "all",
  topic: "all",
  year: "all",
};

const labels = {
  article: "Articles",
  database: "Databases",
  media: "Media",
  training: "Trainings",
  video: "Videos",
  data: "Data",
  economics: "Economics",
  education: "Education",
  environment: "Environment",
  gender: "Gender",
  governance: "Governance",
  health: "Health",
  migration: "Migration",
};

const typeFilterOrder = ["article", "video", "database"];
const sectionPaths = {
  home: ["Profile", "Home"],
  about: ["Profile", "About"],
  experience: ["Profile", "Experience"],
  portfolio: ["Work", "Portfolio"],
  videos: ["Work", "Videos"],
  events: ["Work", "Events and Trainings"],
  partnerships: ["Work", "Partnerships"],
  news: ["Work", "In the News"],
  skills: ["Connect", "Skills"],
  education: ["Connect", "Education"],
  contact: ["Connect", "Contact"],
};

const sectionGroups = {
  Profile: "home",
  Work: "portfolio",
  Connect: "skills",
};

function titleCase(value) {
  return labels[value] || String(value || "").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderSiteContent() {
  document.querySelectorAll("[data-field]").forEach((node) => {
    const value = profile[node.dataset.field];
    if (!value) return;
    node.textContent = value;
    if (node.tagName === "A" && node.dataset.field === "email") {
      node.href = `mailto:${value}`;
    }
  });

  const about = document.getElementById("about-copy");
  if (about) {
    about.innerHTML = ["about_paragraph_1", "about_paragraph_2", "about_paragraph_3"]
      .map((key) => profile[key])
      .filter(Boolean)
      .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
      .join("");
  }

  const experience = document.getElementById("experience-list");
  if (experience) {
    experience.innerHTML = (site.experience || [])
      .map((item) => {
        const bullets = String(item.bullets || "")
          .split("|")
          .map((bullet) => bullet.trim())
          .filter(Boolean)
          .map((bullet) => `<li>${escapeHtml(bullet)}</li>`)
          .join("");
        return `<article>
          <span>${escapeHtml(item.period)}</span>
          <h3>${escapeHtml(item.title)}${item.organization ? `, ${escapeHtml(item.organization)}` : ""}</h3>
          <p>${escapeHtml(item.summary)}</p>
          ${bullets ? `<ul>${bullets}</ul>` : ""}
        </article>`;
      })
      .join("");
  }

  const education = document.getElementById("education-list");
  if (education) {
    education.innerHTML = (site.education || [])
      .map(
        (item) => `<article class="panel">
          <span>${escapeHtml(item.period)}</span>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.institution)}</p>
          ${item.details ? `<p>${escapeHtml(item.details)}</p>` : ""}
        </article>`
      )
      .join("");
  }

  const skills = document.getElementById("skills-list");
  if (skills) {
    skills.innerHTML = (site.skills || [])
      .map(
        (item) => `<details class="skill-item">
          <summary>${escapeHtml(item.skill)}</summary>
          <p>${escapeHtml(item.details || "")}</p>
        </details>`
      )
      .join("");
  }

  const partners = document.getElementById("partner-work");
  if (partners) {
    partners.innerHTML = (site.partners || [])
      .map(
        (item) => `<a class="partner-card" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">
          <img src="${escapeHtml(item.logo_path)}" alt="${escapeHtml(item.name)} logo" loading="lazy">
          <span>${escapeHtml(item.category)}</span>
          <strong>${escapeHtml(item.name)}</strong>
        </a>`
      )
      .join("");
  }

  const socials = document.getElementById("social-links");
  if (socials) {
    socials.innerHTML = (site.socials || [])
      .map((item) => `<a href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">${escapeHtml(item.platform)}</a>`)
      .join("");
  }
}

function itemMatches(item) {
  const typeMatch = state.type === "all" || item.type === state.type;
  const topicMatch = state.topic === "all" || (item.topics || []).includes(state.topic);
  const yearMatch = state.year === "all" || item.year === state.year;
  return typeMatch && topicMatch && yearMatch;
}

function activeFilterText() {
  const parts = [
    `Type: ${state.type === "all" ? "All" : titleCase(state.type)}`,
    `Topic: ${state.topic === "all" ? "All" : titleCase(state.topic)}`,
    `Date: ${state.year === "all" ? "All" : state.year}`,
  ];
  return parts.join(" / ");
}

function renderFilterGroup(targetId, key, values) {
  const target = document.getElementById(targetId);
  if (!target) return;

  const options = ["all", ...values.filter(Boolean)];
  target.innerHTML = options
    .map((value) => {
      const count =
        value === "all"
          ? allItems.length
          : allItems.filter((item) => {
              if (key === "type") return item.type === value;
              if (key === "topic") return (item.topics || []).includes(value);
              return item.year === value;
            }).length;

      return `<button class="filter ${state[key] === value ? "active" : ""}" data-key="${key}" data-value="${escapeHtml(value)}">
        <span>${value === "all" ? "All" : titleCase(value)}</span>
        <b>${count}</b>
      </button>`;
    })
    .join("");
}

function cardTemplate(item, featured = false) {
  const topics = (item.topics || []).slice(0, 3).map((topic) => `<span>${titleCase(topic)}</span>`).join("");
  const story = item.story
    ? `<details class="story"><summary>Story behind</summary><p>${escapeHtml(item.story)}</p></details>`
    : "";
  const meta = [
    item.publisher || item.platform,
    item.date || item.year,
    item.platform && item.type === "video" ? item.platform : "",
  ]
    .filter(Boolean)
    .join(" / ");

  return `
    <a class="card-link" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer" aria-label="${escapeHtml(item.title)}"></a>
    <div class="thumb-wrap">
      <img src="${escapeHtml(item.thumbnail)}" alt="" loading="lazy">
      ${featured ? '<span class="priority-pill">Featured</span>' : ""}
    </div>
    <div class="portfolio-card-body">
      <div class="card-meta">${escapeHtml(meta)}</div>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.summary)}</p>
      <dl>
        <div><dt>Publisher</dt><dd>${escapeHtml(item.publisher || item.platform || "Independent")}</dd></div>
        <div><dt>Role</dt><dd>${escapeHtml(item.role || "Contributor")}</dd></div>
        <div><dt>Date</dt><dd>${escapeHtml(item.date || item.year)}</dd></div>
      </dl>
      <div class="topic-tags">${topics}</div>
      ${story}
      <a class="read-link" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">View story</a>
    </div>
  `;
}

function renderPortfolio() {
  const matched = allItems.filter(itemMatches);
  const featured = matched.filter((item) => item.priority === "top priority");
  const standard = matched.filter((item) => item.priority !== "top priority" && item.type !== "media").slice(0, 24);
  const archive = matched.filter((item) => item.priority !== "top priority" && item.type !== "media").slice(24);

  document.getElementById("portfolio-count").textContent = `${matched.length} matching items / ${activeFilterText()}`;
  document.getElementById("featured-work").innerHTML = featured
    .map((item) => `<article class="portfolio-card featured">${cardTemplate(item, true)}</article>`)
    .join("");
  document.getElementById("standard-work").innerHTML = standard
    .map((item) => `<article class="portfolio-card">${cardTemplate(item)}</article>`)
    .join("");
  document.getElementById("archive-work").innerHTML = archive
    .map((item) => `<article class="portfolio-card compact-card">${cardTemplate(item)}</article>`)
    .join("");
}

function renderVideos() {
  const videos = allItems
    .filter((item) => item.type === "video")
    .filter((item) => item.url && !item.url.includes("yB8c9eB2N8g"))
    .slice(0, 12);
  document.getElementById("video-work").innerHTML = videos
    .map(
      (item) => `
        <a class="video-mini" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">
          <img src="${escapeHtml(item.thumbnail)}" alt="" loading="lazy">
          <span>${escapeHtml(item.platform)} / ${escapeHtml(item.date || item.year)}</span>
          <h3>${escapeHtml(item.title)}</h3>
        </a>
      `
    )
    .join("");
}

function renderNews() {
  const news = allItems.filter((item) => item.type === "media").slice(0, 6);
  document.getElementById("news-work").innerHTML = news
    .map(
      (item) => `
        <a class="news-card" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">
          <img src="${escapeHtml(item.thumbnail)}" alt="" loading="lazy">
          <span>${escapeHtml(item.publisher || item.platform)}</span>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.summary)}</p>
        </a>
      `
    )
    .join("");
}

function renderEvents() {
  const events = allItems.filter((item) => item.type === "training");
  document.getElementById("event-work").innerHTML = events
    .map(
      (item) => `
        <a class="event-card" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">
          <img src="${escapeHtml(item.thumbnail)}" alt="" loading="lazy">
          <div>
            <span>${escapeHtml(item.publisher || item.platform)} / ${escapeHtml(item.date || item.year)}</span>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.summary)}</p>
            <strong>Role: ${escapeHtml(item.role || "Trainer / speaker")}</strong>
          </div>
        </a>
      `
    )
    .join("");
}

function bindFilters() {
  document.querySelectorAll(".filter").forEach((button) => {
    button.addEventListener("click", () => {
      state[button.dataset.key] = button.dataset.value;
      renderFilterGroup("type-filters", "type", typeFilterOrder);
      renderFilterGroup("topic-filters", "topic", portfolioData.filters.topics || []);
      renderFilterGroup("year-filters", "year", portfolioData.filters.years || []);
      bindFilters();
      renderPortfolio();
      if (window.matchMedia("(max-width: 980px)").matches) {
        button.closest("details")?.removeAttribute("open");
      }
    });
  });
}

function initFilters() {
  renderFilterGroup("type-filters", "type", typeFilterOrder);
  renderFilterGroup("topic-filters", "topic", portfolioData.filters.topics || []);
  renderFilterGroup("year-filters", "year", portfolioData.filters.years || []);
  bindFilters();
}

renderSiteContent();
initFilters();
renderPortfolio();
renderVideos();
renderNews();
renderEvents();

const outlineLinks = [...document.querySelectorAll(".outline nav a")];
const activeLabel = document.querySelector(".active-section-label");
const menuToggle = document.querySelector(".menu-toggle");
const outline = document.querySelector(".outline");

menuToggle?.addEventListener("click", () => {
  const open = outline.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
});

outlineLinks.forEach((link) => {
  link.addEventListener("click", () => {
    outline.classList.remove("open");
    menuToggle?.setAttribute("aria-expanded", "false");
  });
});

const observer = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) return;

    updateActiveSectionFromScroll();
  },
  { threshold: [0.22, 0.45, 0.7] }
);

document.querySelectorAll("main section").forEach((section) => observer.observe(section));

function setActiveSection(id) {
  if (activeLabel) {
    const path = sectionPaths[id] || [document.getElementById(id)?.dataset.label || id];
    activeLabel.innerHTML = path
      .map((part, index) => {
        const targetId = index === 0 ? sectionGroups[part] || id : id;
        return `<button type="button" data-target="${targetId}">${escapeHtml(part)}</button>`;
      })
      .join("<span>/</span>");
  }
  outlineLinks.forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === `#${id}`);
  });
}

function updateActiveSectionFromScroll() {
  const sections = [...document.querySelectorAll("main section")];
  const offset = window.matchMedia("(max-width: 980px)").matches ? 96 : 120;
  const current =
    sections
      .map((section) => ({ section, top: section.getBoundingClientRect().top }))
      .filter((item) => item.top <= offset)
      .sort((a, b) => b.top - a.top)[0]?.section || sections[0];

  if (current) setActiveSection(current.id);
}

window.addEventListener("scroll", updateActiveSectionFromScroll, { passive: true });
window.addEventListener("resize", updateActiveSectionFromScroll);
updateActiveSectionFromScroll();

activeLabel?.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-target]");
  if (!button) return;
  const target = document.getElementById(button.dataset.target);
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
});

document.addEventListener("click", (event) => {
  if (!window.matchMedia("(max-width: 980px)").matches) return;
  if (event.target.closest(".portfolio-filters")) return;
  document.querySelectorAll(".portfolio-filters details[open]").forEach((details) => {
    details.removeAttribute("open");
  });
});
