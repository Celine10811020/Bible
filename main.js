document.addEventListener("DOMContentLoaded", () => {
  const BASE = "https://celine10811020.github.io/Bible/Notes/";
  const searchBox = document.getElementById("searchBox");
  const clearBtn = document.getElementById("clearBtn");
  const resultInfo = document.getElementById("resultInfo");

  const leafDetails = Array.from(document.querySelectorAll("details"))
    .filter(d => d.querySelector(":scope > .forthLayer") && d.querySelector(":scope > summary"));

  const notes = leafDetails.map(d => {
    const summaryEl = d.querySelector(":scope > summary");
    const forthEl = d.querySelector(":scope > .forthLayer");
    const title = summaryEl.textContent.trim();
    return {
      details: d,
      summaryEl,
      forthEl,
      title,
      titleLower: title.toLowerCase(),
      content: null,
      contentLower: null,
      loaded: false
    };
  });

  async function loadNoteContent(note) {
    if (note.loaded) return note.content ?? "";
    const url = BASE + encodeURIComponent(note.title) + ".txt";

    try {
      const res = await fetch(url, { cache: "no-cache" });
      if (!res.ok) throw new Error(String(res.status));
      const text = await res.text();

      note.forthEl.textContent = text;

      note.content = text;
      note.contentLower = text.toLowerCase();
      note.loaded = true;
      note.forthEl.dataset.loaded = "1";
      return text;
    } catch (e) {
      const msg = `（找不到筆記檔案：${note.title}.txt）`;
      note.forthEl.textContent = msg;

      note.content = msg;
      note.contentLower = msg.toLowerCase();
      note.loaded = true;
      note.forthEl.dataset.loaded = "1";
      return msg;
    }
  }

  notes.forEach(note => {
    note.details.addEventListener("toggle", () => {
      if (!note.details.open) return;
      if (note.forthEl.dataset.loaded === "1") return;
      loadNoteContent(note);
    });
  });

  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function highlightTitle(note, q) {
    note.summaryEl.innerHTML = note.title;

    if (!q) return;
    const re = new RegExp(escapeRegExp(q), "ig");
    note.summaryEl.innerHTML = note.title.replace(re, m => `<mark>${m}</mark>`);
  }

  function setHidden(el, hidden) {
    el.classList.toggle("is-hidden", hidden);
  }

  function updateParentVisibility() {
    const allDetails = Array.from(document.querySelectorAll("details"));
    const rootDetails = document.querySelector(".firstLayer > details");

    const leafSet = new Set(notes.map(n => n.details));

    allDetails.forEach(d => {
      if (d === rootDetails) return;
      if (leafSet.has(d)) return;
      d.classList.remove("is-hidden");
    });

    allDetails.forEach(d => {
      if (d === rootDetails) return;
      if (leafSet.has(d)) return;

      const descendantsLeaf = notes.filter(n => d.contains(n.details));
      if (descendantsLeaf.length === 0) return;

      const anyVisible = descendantsLeaf.some(n => !n.details.classList.contains("is-hidden"));
      if (!anyVisible) d.classList.add("is-hidden");
    });
  }

  async function search(qRaw) {
    const q = qRaw.trim();
    const qLower = q.toLowerCase();

    if (!q) {
      notes.forEach(note => {
        setHidden(note.details, false);
        highlightTitle(note, "");
      });
      updateParentVisibility();
      resultInfo.textContent = "";
      return;
    }

    let matched = [];
    let pendingContent = [];

    for (const note of notes) {
      highlightTitle(note, q);
      const hitTitle = note.titleLower.includes(qLower);

      if (hitTitle) {
        matched.push(note);
      } else {
        pendingContent.push(note);
      }
    }

    for (const note of pendingContent) {
      const text = await loadNoteContent(note);
      const hitContent = (note.contentLower ?? text.toLowerCase()).includes(qLower);
      if (hitContent) matched.push(note);
    }

    const matchedSet = new Set(matched);
    notes.forEach(note => {
      setHidden(note.details, !matchedSet.has(note));
    });

    updateParentVisibility();
    resultInfo.textContent = `找到 ${matched.length} 篇`;
  }

  let t = null;
  function debounceSearch() {
    clearTimeout(t);
    t = setTimeout(() => search(searchBox.value), 200);
  }

  if (searchBox) {
    searchBox.addEventListener("input", debounceSearch);
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      searchBox.value = "";
      search("");
      searchBox.focus();
    });
  }

  resultInfo.textContent = "";
});
