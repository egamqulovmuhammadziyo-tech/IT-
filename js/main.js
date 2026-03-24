const root = document.documentElement;
const themeToggle = document.getElementById("themeToggle");
const themeStorageKey = "preferred-theme";
const leadDraftStorageKey = "lead-form-draft";
const selectedCourseStorageKey = "selected-course-interest";
const selectedCourseLockedStorageKey = "selected-course-locked";
const isStaticDevHost =
  window.location.hostname === "127.0.0.1" ||
  window.location.hostname === "localhost";
const isStaticDevPort = ["5500", "5501", "8080", "4000", "8000"].includes(window.location.port);
const isLiveServerPreview = isStaticDevHost && isStaticDevPort;
const isNetlifyHost =
  window.location.hostname.endsWith(".netlify.app") ||
  window.location.hostname.endsWith(".netlify.live");
const leadApiUrl =
  window.location.protocol === "file:" || isLiveServerPreview
    ? "http://localhost:3000/api/leads"
    : isNetlifyHost
      ? "/.netlify/functions/leads"
      : "/api/leads";
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;
const draftStorage = window.sessionStorage;

function getNavigationType() {
  const navigationEntry = performance.getEntriesByType("navigation")[0];
  return navigationEntry?.type || "navigate";
}

function clearLeadDraftSession() {
  draftStorage.removeItem(leadDraftStorageKey);
  draftStorage.removeItem(selectedCourseStorageKey);
  draftStorage.removeItem(selectedCourseLockedStorageKey);
}

if (getNavigationType() === "reload") {
  clearLeadDraftSession();
}

function applyTheme(theme) {
  root.dataset.theme = theme;

  if (themeToggle) {
    const isLight = theme === "light";
    const toggleIcon = themeToggle.querySelector(".theme-toggle-icon");
    themeToggle.classList.toggle("is-light", isLight);
    themeToggle.classList.toggle("is-dark", !isLight);
    themeToggle.setAttribute("aria-pressed", String(isLight));
    themeToggle.setAttribute(
      "aria-label",
      isLight ? "Dark mode yoqish" : "Light mode yoqish",
    );
    themeToggle.setAttribute(
      "title",
      isLight ? "Dark mode yoqish" : "Light mode yoqish",
    );
    toggleIcon.classList.toggle("fa-sun", isLight);
    toggleIcon.classList.toggle("fa-moon", !isLight);
  }
}

function getInitialTheme() {
  const savedTheme = localStorage.getItem(themeStorageKey);
  if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

applyTheme(getInitialTheme());

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const nextTheme = root.dataset.theme === "light" ? "dark" : "light";
    applyTheme(nextTheme);
    localStorage.setItem(themeStorageKey, nextTheme);
  });
}

// Nav scroll
const navbar = document.getElementById("navbar");
let navTicking = false;

function updateNavbarState() {
  if (navbar) {
    navbar.classList.toggle("scrolled", window.scrollY > 50);
  }
  navTicking = false;
}

window.addEventListener(
  "scroll",
  () => {
    if (!navTicking) {
      window.requestAnimationFrame(updateNavbarState);
      navTicking = true;
    }
  },
  { passive: true },
);

updateNavbarState();

// Mobile menu
function toggleMenu() {
  const mobileMenu = document.getElementById("mobileMenu");
  if (mobileMenu) mobileMenu.classList.toggle("open");
}

// Reveal on scroll
if (prefersReducedMotion) {
  document
    .querySelectorAll(".reveal")
    .forEach((el) => el.classList.add("visible"));
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -5% 0px" },
  );

  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
}

const roadmapTabs = Array.from(
  document.querySelectorAll(".rtab[data-roadmap-tab]"),
);
const roadmapContents = Array.from(
  document.querySelectorAll(".roadmap-content"),
);
const roadmapModules = Array.from(document.querySelectorAll(".rm-module"));
const roadmapTabsWrap = document.getElementById("rmTabs");

function setModuleState(moduleEl, isOpen) {
  if (!moduleEl) return;

  const weeks = moduleEl.querySelector(".rm-weeks");
  moduleEl.classList.toggle("open", isOpen);
  moduleEl.setAttribute("aria-expanded", String(isOpen));

  if (weeks) {
    weeks.style.maxHeight = isOpen ? `${weeks.scrollHeight}px` : "0px";
  }
}

function closeContentModules(contentEl) {
  contentEl
    .querySelectorAll(".rm-module")
    .forEach((moduleEl) => setModuleState(moduleEl, false));
}

function switchTab(name) {
  const nextContent = document.getElementById(`rm-${name}`);
  if (!nextContent) return;

  roadmapTabs.forEach((tab) => {
    const isActive = tab.dataset.roadmapTab === name;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  });

  roadmapContents.forEach((content) => {
    const isActive = content.id === `rm-${name}`;
    content.classList.toggle("active", isActive);
    content.hidden = !isActive;
    content.style.display = isActive ? "block" : "none";

    closeContentModules(content);
  });
}

function toggleModule(el) {
  const moduleEl = el.classList.contains("rm-module")
    ? el
    : el.closest(".rm-module");
  if (!moduleEl) return;

  const parentContent = moduleEl.closest(".roadmap-content");
  const willOpen = !moduleEl.classList.contains("open");

  if (parentContent) {
    parentContent.querySelectorAll(".rm-module").forEach((item) => {
      if (item !== moduleEl) setModuleState(item, false);
    });
  }

  setModuleState(moduleEl, willOpen);
}

roadmapTabs.forEach((tab) => {
  tab.addEventListener("click", () => switchTab(tab.dataset.roadmapTab));
});

roadmapModules.forEach((moduleEl) => {
  const header = moduleEl.querySelector(".rm-module-hdr");
  if (!header) return;

  moduleEl.removeAttribute("onclick");
  header.setAttribute("role", "button");
  header.setAttribute("tabindex", "0");

  header.addEventListener("click", () => toggleModule(moduleEl));
  header.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleModule(moduleEl);
    }
  });
});

roadmapContents.forEach((content) => {
  content.hidden = !content.classList.contains("active");
  content.style.display = content.classList.contains("active")
    ? "block"
    : "none";
  closeContentModules(content);
});

function updateRoadmapScrollHint() {
  if (!roadmapTabsWrap) return;

  const hasHorizontalOverflow =
    roadmapTabsWrap.scrollWidth > roadmapTabsWrap.clientWidth + 4;
  const isMoved = roadmapTabsWrap.scrollLeft > 12;
  roadmapTabsWrap.classList.toggle(
    "is-scrolled",
    !hasHorizontalOverflow || isMoved,
  );
}

if (roadmapTabsWrap) {
  updateRoadmapScrollHint();
  roadmapTabsWrap.addEventListener("scroll", updateRoadmapScrollHint, {
    passive: true,
  });
  window.addEventListener("resize", updateRoadmapScrollHint);
}

const leadForm = document.getElementById("leadForm");
const leadStatus = document.getElementById("leadStatus");
const selectedCourseText = document.getElementById("selectedCourseText");
const courseFieldGroup = document.getElementById("courseFieldGroup");
const contactScrollCue = document.querySelector(".contact-scroll-cue");

const courseNameAliases = {
  AI: "Sun'iy Intellekt",
  Biznes: "Biznes Kursi",
};

function normalizeCourseName(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return courseNameAliases[trimmed] || trimmed;
}

function getLeadErrorMessage(error) {
  if (
    error instanceof Error &&
    error.message &&
    error.message !== "submit-failed"
  ) {
    return error.message;
  }

  return "So'rov yuborilmadi. Iltimos, qayta urinib ko'ring.";
}

function saveSelectedCourse(courseName) {
  const normalized = normalizeCourseName(courseName);
  if (!normalized) return;
  draftStorage.setItem(selectedCourseStorageKey, normalized);
}

function getSelectedCourse() {
  return normalizeCourseName(
    draftStorage.getItem(selectedCourseStorageKey) || "",
  );
}

function setSelectedCourseLocked(isLocked) {
  draftStorage.setItem(
    selectedCourseLockedStorageKey,
    isLocked ? "true" : "false",
  );
}

function isSelectedCourseLocked() {
  return draftStorage.getItem(selectedCourseLockedStorageKey) === "true";
}

function updateSelectedCourseText(courseName) {
  const banner = document.getElementById("selectedCourseBanner");
  if (!selectedCourseText || !banner) return;
  selectedCourseText.textContent = courseName || "";
  banner.hidden = !courseName;
}

function toggleCourseField(isVisible) {
  if (!courseFieldGroup) return;
  courseFieldGroup.hidden = !isVisible;
}

function applySelectedCourse(courseName) {
  if (!leadForm) return;

  const normalized = normalizeCourseName(courseName);

  const courseField = leadForm.elements.namedItem("course");
  if (courseField && "value" in courseField) {
    courseField.value = normalized;
  }

  updateSelectedCourseText(normalized);
  saveLeadDraft();
}

function resetCourseState() {
  updateSelectedCourseText("");
  toggleCourseField(true);
}

function saveLeadDraft() {
  if (!leadForm) return;

  const payload = Object.fromEntries(new FormData(leadForm).entries());
  draftStorage.setItem(leadDraftStorageKey, JSON.stringify(payload));
}

function restoreLeadDraft() {
  if (!leadForm) return;

  const savedDraft = draftStorage.getItem(leadDraftStorageKey);
  if (!savedDraft) return;

  try {
    const payload = JSON.parse(savedDraft);

    Object.entries(payload).forEach(([key, value]) => {
      const field = leadForm.elements.namedItem(key);
      if (field && typeof value === "string") {
        field.value = value;
      }
    });
  } catch (_error) {
    draftStorage.removeItem(leadDraftStorageKey);
  }
}

function restoreSelectedCourse() {
  const selectedCourse = getSelectedCourse();
  const locked = isSelectedCourseLocked();

  applySelectedCourse(selectedCourse);
  toggleCourseField(!(locked && !!selectedCourse));

  if (locked) {
    setSelectedCourseLocked(false);
  }
}

if (leadForm && leadStatus) {
  restoreLeadDraft();
  restoreSelectedCourse();
  const courseField = leadForm.elements.namedItem("course");
  const submitButton = leadForm.querySelector('button[type="submit"]');

  if (courseField && "addEventListener" in courseField) {
    courseField.addEventListener("change", () => {
      if (!isSelectedCourseLocked()) {
        updateSelectedCourseText(normalizeCourseName(courseField.value));
      }
    });
  }

  function setLeadUiState({
    statusClass = "",
    statusText = "",
    buttonHtml,
    disabled = false,
    busy = false,
  }) {
    leadStatus.className = `lead-status${statusClass ? ` ${statusClass}` : ""}`;
    leadStatus.textContent = statusText;
    submitButton.disabled = disabled;
    submitButton.setAttribute("aria-busy", String(busy));
    submitButton.innerHTML = buttonHtml;
  }

  function showOfflineLeadState(buttonHtml) {
    setLeadUiState({
      statusClass: "is-error",
      statusText: "Internet tarmog'iga ulaning.",
      buttonHtml,
      disabled: false,
      busy: false,
    });
  }

  leadForm.querySelectorAll("input, select, textarea").forEach((field) => {
    if (field.type !== "hidden") {
      field.addEventListener("input", saveLeadDraft);
      field.addEventListener("change", saveLeadDraft);
    }
  });

  leadForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const defaultButtonText = submitButton.textContent.trim();
    const defaultButtonHtml = `<span>${defaultButtonText}</span>`;
    const loadingButtonHtml =
      '<i class="fas fa-paper-plane lead-submit-spinner" aria-hidden="true"></i><span>Yuborilmoqda...</span>';
    const successButtonHtml =
      '<i class="fas fa-check" aria-hidden="true"></i><span>Yuborildi</span>';
    const formData = new FormData(leadForm);
    const payload = Object.fromEntries(formData.entries());
    payload.course = normalizeCourseName(payload.course);

    if (!normalizeCourseName(payload.course)) {
      setLeadUiState({
        statusClass: "is-error",
        statusText: "Avval kursni tanlang.",
        buttonHtml: defaultButtonHtml,
        disabled: false,
        busy: false,
      });
      if (courseField && "focus" in courseField) {
        courseField.focus();
      }
      return;
    }

    if (!window.navigator.onLine) {
      showOfflineLeadState(defaultButtonHtml);
      return;
    }

    setLeadUiState({
      statusClass: "is-pending",
      statusText: "So'rov botga yuborilmoqda. Biroz kuting...",
      buttonHtml: loadingButtonHtml,
      disabled: true,
      busy: true,
    });

    try {
      const response = await fetch(leadApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      });

      const rawText = await response.text();
      let result = null;

      if (rawText) {
        try {
          result = JSON.parse(rawText);
        } catch (_error) {
          result = null;
        }
      }

      if (!response.ok) {
        throw new Error(result?.message || "submit-failed");
      }

      if (!result?.ok) {
        throw new Error(result?.message || "submit-failed");
      }

      setLeadUiState({
        statusClass: "is-success",
        statusText: result.message,
        buttonHtml: successButtonHtml,
        disabled: false,
        busy: false,
      });
      leadForm.reset();
      clearLeadDraftSession();
      resetCourseState();

      window.setTimeout(() => {
        setLeadUiState({
          statusText: "",
          buttonHtml: defaultButtonHtml,
          disabled: false,
          busy: false,
        });
      }, 1800);
    } catch (_error) {
      const errorMessage = window.navigator.onLine
        ? getLeadErrorMessage(_error)
        : "Internet tarmog'iga ulaning.";
      setLeadUiState({
        statusClass: "is-error",
        statusText: errorMessage,
        buttonHtml: defaultButtonHtml,
        disabled: false,
        busy: false,
      });
    }
  });

  window.addEventListener("offline", () => {
    if (submitButton.getAttribute("aria-busy") !== "true") {
      showOfflineLeadState(`<span>${submitButton.textContent.trim()}</span>`);
    }
  });

  window.addEventListener("online", () => {
    if (submitButton.getAttribute("aria-busy") !== "true") {
      setLeadUiState({
        statusText: "",
        buttonHtml: `<span>${submitButton.textContent.trim()}</span>`,
        disabled: false,
        busy: false,
      });
    }
  });
}

document.querySelectorAll("[data-course-name]").forEach((element) => {
  element.addEventListener("click", () => {
    saveSelectedCourse(element.dataset.courseName);
    setSelectedCourseLocked(element.dataset.courseLock === "true");
  });
});

function updateContactScrollCueVisibility() {
  if (!contactScrollCue || !leadForm) return;

  const formTop = leadForm.getBoundingClientRect().top;
  const shouldHide = formTop <= 180;
  contactScrollCue.classList.toggle("is-hidden", shouldHide);
}

if (contactScrollCue && leadForm) {
  updateContactScrollCueVisibility();

  contactScrollCue.addEventListener("click", () => {
    contactScrollCue.classList.add("is-hidden");
  });

  window.addEventListener("scroll", updateContactScrollCueVisibility, {
    passive: true,
  });
  window.addEventListener("resize", updateContactScrollCueVisibility);
}

// FAQ accordion
function toggleFaq(el) {
  const wasOpen = el.classList.contains("open");
  document
    .querySelectorAll(".faq-item")
    .forEach((f) => f.classList.remove("open"));
  if (!wasOpen) el.classList.add("open");
}

const faqSearchInput = document.getElementById("faqSearch");
const faqItems = Array.from(document.querySelectorAll(".faq-item"));
const faqEmpty = document.getElementById("faqEmpty");
const copyTriggers = Array.from(document.querySelectorAll("[data-copy-text]"));

function applyFaqFilter(query) {
  if (!faqItems.length) return;

  const normalizedQuery = query.trim().toLowerCase();
  let visibleCount = 0;

  faqItems.forEach((item) => {
    const text =
      `${item.textContent} ${item.dataset.faqKeywords || ""}`.toLowerCase();
    const matches = !normalizedQuery || text.includes(normalizedQuery);
    item.hidden = !matches;

    if (!matches) {
      item.classList.remove("open");
      return;
    }

    visibleCount += 1;
  });

  if (faqEmpty) {
    faqEmpty.hidden = visibleCount > 0;
  }
}

if (faqSearchInput) {
  faqSearchInput.addEventListener("input", () => {
    applyFaqFilter(faqSearchInput.value);
  });
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  const tempInput = document.createElement("textarea");
  tempInput.value = text;
  tempInput.setAttribute("readonly", "");
  tempInput.style.position = "fixed";
  tempInput.style.opacity = "0";
  document.body.append(tempInput);
  tempInput.select();
  tempInput.setSelectionRange(0, tempInput.value.length);

  const isCopied = document.execCommand("copy");
  tempInput.remove();
  return isCopied;
}

copyTriggers.forEach((trigger) => {
  const value = trigger.dataset.copyText?.trim();
  const successLabel = trigger.dataset.copyLabel || "Nusxalandi";
  const valueElement = trigger.querySelector("strong");
  const defaultValueLabel = valueElement?.textContent || "";
  const defaultTriggerHtml = valueElement ? "" : trigger.innerHTML;

  if (!value) return;

  trigger.addEventListener("click", async (event) => {
    event.preventDefault();

    try {
      const copied = await copyTextToClipboard(value);
      if (!copied) return;

      if (valueElement) {
        valueElement.textContent = successLabel;
        window.setTimeout(() => {
          valueElement.textContent = defaultValueLabel;
        }, 1600);
      } else {
        trigger.dataset.copyActive = "true";
        trigger.innerHTML = successLabel;
        window.setTimeout(() => {
          trigger.innerHTML = defaultTriggerHtml;
          delete trigger.dataset.copyActive;
        }, 1600);
      }
    } catch (_error) {
      if (valueElement) {
        valueElement.textContent = "Copy bo'lmadi";
        window.setTimeout(() => {
          valueElement.textContent = defaultValueLabel;
        }, 1600);
      } else {
        trigger.innerHTML = "Copy bo'lmadi";
        window.setTimeout(() => {
          trigger.innerHTML = defaultTriggerHtml;
        }, 1600);
      }
    }
  });
});

// Counter animation for stats
function animateCount(el, target, suffix = "") {
  const duration = 1800;
  const start = performance.now();
  const update = (time) => {
    const progress = Math.min((time - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const isFloat = String(target).includes(".");
    el.textContent = isFloat
      ? (eased * target).toFixed(1) + suffix
      : Math.floor(eased * target) + suffix;
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

const statsObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.querySelectorAll(".stat-num").forEach((el) => {
          const txt = el.textContent.trim();
          const match = txt.match(/^(\d+(?:\.\d+)?)(\+?)$/);
          if (match) {
            const num = parseFloat(match[1]);
            const suffix = match[2] || "";
            animateCount(el, num, suffix);
          }
        });
        statsObserver.unobserve(e.target);
      }
    });
  },
  { threshold: 0.5 },
);
document.querySelectorAll("#stats").forEach((el) => statsObserver.observe(el));

// Smooth scroll offset for fixed nav
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const href = a.getAttribute("href");
    if (href === "#") return;
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      const offset = target.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({
        top: offset,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    }
  });
});

document.querySelectorAll(".nav-mobile a").forEach((link) => {
  link.addEventListener("click", () => {
    const mobileMenu = document.getElementById("mobileMenu");
    if (mobileMenu) mobileMenu.classList.remove("open");
  });
});

// Mobile menu - tashqariga bosqanda yopilsin
document.addEventListener("click", (event) => {
  const mobileMenu = document.getElementById("mobileMenu");
  const burger = document.getElementById("burger");
  if (
    mobileMenu &&
    mobileMenu.classList.contains("open") &&
    !mobileMenu.contains(event.target) &&
    !burger.contains(event.target)
  ) {
    mobileMenu.classList.remove("open");
  }
});
