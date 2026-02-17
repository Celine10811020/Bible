async function sha256(str) {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(str)
  );
  return [...new Uint8Array(buf)]
    .map(x => x.toString(16).padStart(2, "0"))
    .join("");
}

document.addEventListener("DOMContentLoaded", () => {

  const BASE_ROOT = "https://celine10811020.github.io/Bible/";
  const PASSWORD_HASH = "055811d58f30272e88805d8025ee125602afd9b710922dea2e121614330b649c";
  let thoughtUnlocked = false;

  const searchBox = document.getElementById("searchBox");
  const clearBtn = document.getElementById("clearBtn");
  const resultInfo = document.getElementById("resultInfo");

  function getBasePath(note) {
    const topSummary = note.details
      .closest(".firstLayer > details")
      ?.querySelector(":scope > summary")
      ?.textContent.trim();

    if (topSummary === "心得") {
      return BASE_ROOT + "Thought/";
    }
    return BASE_ROOT + "Notes/";
  }

  async function ensureThoughtUnlocked() {
    if (thoughtUnlocked) return true;

    const pwd = prompt("心得內容，請輸入密碼");
    if (pwd === null) return false;

    const hashed = await sha256(pwd);

    if (hashed === PASSWORD_HASH) {
      thoughtUnlocked = true;
      return true;
    } else {
      alert("密碼錯誤");
      return false;
    }
  }

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

    const base = getBasePath(note);
    const url = base + encodeURIComponent(note.title) + ".txt";

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
    note.details.addEventListener("toggle", async () => {
      if (!note.details.open) return;

      const isThought = getBasePath(note).includes("/Thought/");

      if (isThought && !thoughtUnlocked) {
        const ok = await ensureThoughtUnlocked();
        if (!ok) {
          note.details.open = false;
          return;
        }
      }


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
    const rootDetailsList = Array.from(document.querySelectorAll(".firstLayer > details"));

    const leafSet = new Set(notes.map(n => n.details));

    // 先顯示所有非 leaf
    allDetails.forEach(d => {
      if (rootDetailsList.includes(d)) return;
      if (leafSet.has(d)) return;
      d.classList.remove("is-hidden");
    });

    allDetails.forEach(d => {
      if (rootDetailsList.includes(d)) return;
      if (leafSet.has(d)) return;

      const anyVisibleLeaf = notes.some(n =>
        d.contains(n.details) && !n.details.classList.contains("is-hidden")
      );

      if (!anyVisibleLeaf) d.classList.add("is-hidden");
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

    const safeToLoad = pendingContent.filter(note => {
      const isThought = getBasePath(note).includes("/Thought/");
      if (!isThought) return true;
      return thoughtUnlocked;
    });

    await Promise.all(safeToLoad.map(loadNoteContent));

    for (const note of safeToLoad) {
      const hitContent = (note.contentLower ?? "").includes(qLower);
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
