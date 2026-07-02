(function () {
  const APP_VERSION = "20260702-twenty-five-stories";
  const app = document.querySelector("#app");
  const stories = window.STORIES || [];

  const state = {
    view: "library",
    storyId: null,
    page: 0,
  };

  function parseHash() {
    const hash = window.location.hash.replace(/^#\/?/, "");
    const parts = hash.split("/").filter(Boolean);

    if (parts[0] === "story" && parts[1]) {
      state.view = "reader";
      state.storyId = parts[1];
      state.page = Number.isFinite(Number(parts[2])) ? Math.max(0, Number(parts[2]) - 1) : 0;
      return;
    }

    state.view = "library";
    state.storyId = null;
    state.page = 0;
  }

  function storyById(id) {
    return stories.find((story) => story.id === id) || stories[0];
  }

  function goLibrary() {
    window.location.hash = "/";
  }

  function goStory(storyId, pageIndex) {
    window.location.hash = `/story/${storyId}/${pageIndex + 1}`;
  }

  function assetUrl(src) {
    const separator = src.includes("?") ? "&" : "?";
    return `${src}${separator}v=${APP_VERSION}`;
  }

  function renderLibrary() {
    app.className = "app-shell library-shell";
    app.innerHTML = `
      <header class="library-header">
        <div>
          <p class="eyebrow">Tu truyen cua Anh Thu</p>
          <h1>Tủ truyện của Anh Thư</h1>
        </div>
      </header>

      <main class="library-main" aria-label="Danh sach truyen">
        ${stories
          .map(
            (story) => `
              <button class="book-card" type="button" data-story="${story.id}" style="--book-main: ${story.palette.main}; --book-soft: ${story.palette.soft};">
                <span class="cover-wrap">
                  <img src="${assetUrl(story.cover)}" alt="Bia truyen ${story.displayTitle}" />
                </span>
                <span class="book-info">
                  <strong>${story.displayTitle}</strong>
                  <span>${story.topic}</span>
                  <small>${story.age}</small>
                </span>
              </button>
            `,
          )
          .join("")}
      </main>
    `;

    app.querySelectorAll("[data-story]").forEach((button) => {
      button.addEventListener("click", () => goStory(button.dataset.story, 0));
    });
  }

  function renderReader() {
    const story = storyById(state.storyId);
    const total = story.pages.length;
    state.page = Math.min(Math.max(state.page, 0), total - 1);
    const page = story.pages[state.page];
    const canPrev = state.page > 0;
    const canNext = state.page < total - 1;

    app.className = "app-shell reader-shell";
    app.style.setProperty("--story-main", story.palette.main);
    app.style.setProperty("--story-soft", story.palette.soft);
    app.style.setProperty("--story-leaf", story.palette.leaf);

    app.innerHTML = `
      <header class="reader-bar">
        <button class="icon-button" type="button" data-action="library" aria-label="Ve tu truyen">
          <span aria-hidden="true">⌂</span>
        </button>
        <div class="reader-title">
          <strong>${story.displayTitle}</strong>
          <span>${state.page + 1} / ${total}</span>
        </div>
      </header>

      <main class="reader-main">
        <article class="book-page ${page.kind ? `page-${page.kind}` : ""}" data-scene="${page.scene || ""}">
          ${renderArt(page, story)}
          <section class="page-copy">
            ${page.title ? `<h2>${escapeHtml(page.title)}</h2>` : ""}
            <p>${formatStoryText(page.text)}</p>
          </section>
        </article>
      </main>

      <nav class="reader-controls" aria-label="Dieu huong trang">
        <button class="nav-button" type="button" data-action="prev" ${canPrev ? "" : "disabled"}>Trước</button>
        <div class="page-dots" aria-hidden="true">
          ${story.pages.map((_, index) => `<span class="${index === state.page ? "active" : ""}"></span>`).join("")}
        </div>
        <button class="nav-button" type="button" data-action="next" ${canNext ? "" : "disabled"}>Sau</button>
      </nav>

      <button class="thumb-next" type="button" data-action="thumb-next" ${canNext ? "" : "disabled"} aria-label="Sang trang tiếp theo">
        Tiếp
      </button>
    `;

    app.querySelector('[data-action="library"]').addEventListener("click", goLibrary);
    app.querySelector('[data-action="prev"]').addEventListener("click", () => canPrev && goStory(story.id, state.page - 1));
    app.querySelector('[data-action="next"]').addEventListener("click", () => canNext && goStory(story.id, state.page + 1));
    app.querySelector('[data-action="thumb-next"]').addEventListener("click", () => canNext && goStory(story.id, state.page + 1));
    wireSwipe(story, canPrev, canNext);
  }

  function renderArt(page, story) {
    if (page.image) {
      return `
        <div class="page-art image-art">
          <img src="${assetUrl(page.image)}" alt="" />
        </div>
      `;
    }

    return `
      <div class="page-art drawn-art" aria-hidden="true">
        <div class="sun"></div>
        <div class="tree tree-left"></div>
        <div class="tree tree-right"></div>
        <div class="slide"></div>
        <div class="fence"></div>
        <div class="flowers"></div>
        <div class="child">
          <span class="hair left"></span>
          <span class="hair right"></span>
          <span class="face"></span>
          <span class="body"></span>
          <span class="legs"></span>
        </div>
        <div class="scene-mark">${sceneIcon(page.scene)}</div>
      </div>
    `;
  }

  function escapeHtml(text) {
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatStoryText(text) {
    return escapeHtml(text).replace(/(“[^”]+”|"[^"]+")/g, '<span class="dialogue">$1</span>');
  }

  function sceneIcon(scene) {
    const icons = {
      playground: "♪",
      mom: "!",
      friends: "•",
      stranger: "?",
      thinking: "…",
      helper: "+",
      home: "♥",
    };
    return icons[scene] || "✓";
  }

  function wireSwipe(story, canPrev, canNext) {
    let startX = 0;
    let startY = 0;
    const reader = app.querySelector(".reader-main");

    reader.addEventListener("pointerdown", (event) => {
      startX = event.clientX;
      startY = event.clientY;
    });

    reader.addEventListener("pointerup", (event) => {
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy)) return;
      if (dx < 0 && canNext) goStory(story.id, state.page + 1);
      if (dx > 0 && canPrev) goStory(story.id, state.page - 1);
    });
  }

  function render() {
    parseHash();
    if (state.view === "reader") {
      renderReader();
      return;
    }
    renderLibrary();
  }

  function checkForFreshVersion() {
    fetch(`./version.json?ts=${Date.now()}`, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((info) => {
        if (!info || !info.version) return;
        const storedVersion = window.localStorage.getItem("tu-truyen-version");
        window.localStorage.setItem("tu-truyen-version", info.version);
        if (storedVersion && storedVersion !== info.version && !window.location.search.includes(`v=${info.version}`)) {
          window.location.replace(`${window.location.pathname}?v=${encodeURIComponent(info.version)}${window.location.hash}`);
        }
      })
      .catch(() => {});
  }

  window.addEventListener("hashchange", render);
  render();
  checkForFreshVersion();
})();
