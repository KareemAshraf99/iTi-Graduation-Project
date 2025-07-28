(function () {
  document.addEventListener("contextmenu", (e) => e.preventDefault()); // Disables right-click context menu

  document.onkeydown = function (e) {
    if (e.key === "F12") {
      return false;
    }
    if (e.ctrlKey && e.shiftKey && e.key === "I") {
      return false;
    }
    if (e.ctrlKey && e.key === "U") {
      return false;
    }
  };
})();

// ------------------------------------
document.addEventListener("DOMContentLoaded", function () {
  initializeComponents();
});

function initializeComponents() {
  initializeStatistics();
  initializeScrollProgress();
  initializeScrollEffects();
  initializeLazyLoading();
  initializeProjectsSlider();

  const htmlLang = document.documentElement.getAttribute("lang");
  const storedLang = localStorage.getItem("lang");

  let detectedLang = "ar"; // default
  if (storedLang && (storedLang === "ar" || storedLang === "en")) {
    detectedLang = storedLang;
  } else if (htmlLang && (htmlLang === "ar" || htmlLang === "en")) {
    detectedLang = htmlLang;
  }

  // Store original text content before any translations
  document.querySelectorAll("[data-lang-key]").forEach((element) => {
    if (!element.getAttribute("data-original-text")) {
      element.setAttribute("data-original-text", element.textContent);
    }
  });

  setLanguage(detectedLang);

  // Initialize speech listeners after page load if speech is enabled
  initializeSpeechOnLoad();
}

// --------------------------------------------

// Statistics counter animation
function initializeStatistics() {
  const statNumbers = document.querySelectorAll(".count-value");

  const observerOptions = {
    threshold: 0.5,
    rootMargin: "0px 0px -100px 0px",
  };

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  statNumbers.forEach((number) => {
    observer.observe(number);
  });
}

function animateCounter(element) {
  const target = parseInt(element.getAttribute("data-count"));
  const duration = 2000;
  const step = target / (duration / 16);
  let current = 0;

  const timer = setInterval(function () {
    current += step;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }

    // Use English numerals when language is English, Arabic numerals when Arabic
    const currentLang = localStorage.getItem("lang") || "ar";
    if (currentLang === "en") {
      element.textContent = Math.floor(current).toLocaleString("en-US");
    } else {
      element.textContent = Math.floor(current).toLocaleString("ar-EG");
    }
  }, 16);
}

// Projects slider initialization
let mainSplideSlider = null;

function initializeProjectsSlider() {
  const projectsSlider = document.getElementById("projects-slider");

  if (projectsSlider && typeof Splide !== "undefined") {
    new Splide("#projects-slider", {
      type: "loop",
      perPage: 3,
      perMove: 1,
      gap: "2rem",
      autoplay: false,
      interval: 5000,
      pauseOnHover: true,
      arrows: true,
      pagination: false,
      direction: "rtl",
      breakpoints: {
        1024: {
          perPage: 2,
          gap: "1.5rem",
        },
        768: {
          perPage: 1,
          gap: "1rem",
        },
      },
    }).mount();
  }
}

// Scroll effects and animations
function initializeScrollEffects() {
  // Parallax effect for hero section
  const heroSection = document.querySelector(".hero-section");
  const heroPattern = document.querySelector(".hero-pattern");

  window.addEventListener("scroll", function () {
    const scrolled = window.pageYOffset;
    const rate = scrolled * -0.5;

    if (heroPattern) {
      heroPattern.style.transform = `translateY(${rate}px)`;
    }
  });

  // Fade in animation for sections
  const sections = document.querySelectorAll(
    ".services-section, .projects-section, .stats-section"
  );

  const fadeObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    }
  );

  sections.forEach((section) => {
    section.style.opacity = "0";
    section.style.transform = "translateY(50px)";
    section.style.transition = "opacity 0.8s ease, transform 0.8s ease";
    fadeObserver.observe(section);
  });
}

// Performance optimization: Lazy loading for images
function initializeLazyLoading() {
  const images = document.querySelectorAll("img[data-src]");

  const imageObserver = new IntersectionObserver(function (entries) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.remove("lazy");
        imageObserver.unobserve(img);
      }
    });
  });

  images.forEach((img) => {
    imageObserver.observe(img);
  });
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  });
});

// Error handling for external resources
window.addEventListener("error", function (e) {
  if (e.target.tagName === "IMG") {
    e.target.src =
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCI+eG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4=";
  }
});

// Theme toggle functionality
function initializeThemeToggle() {
  const themeToggle = document.querySelector(".theme-toggle");
  const currentTheme = localStorage.getItem("theme") || "light";

  // Apply saved theme
  document.body.setAttribute("data-theme", currentTheme);
  updateThemeIcon(currentTheme);

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      const newTheme =
        document.body.getAttribute("data-theme") === "dark" ? "light" : "dark";
      document.body.setAttribute("data-theme", newTheme);
      localStorage.setItem("theme", newTheme);
      updateThemeIcon(newTheme);
      document.body.dispatchEvent(new Event("themeChange"));
    });
  }
}

function updateThemeIcon(theme) {
  const themeToggle = document.querySelector(".theme-toggle i");
  if (themeToggle) {
    themeToggle.className = theme === "dark" ? "fas fa-sun" : "fas fa-moon";
  }
}

const synth = "speechSynthesis" in window ? window.speechSynthesis : null;
let currentUtterance = null;

// Function to initialize speech listeners on page load if speech is enabled
function initializeSpeechOnLoad() {
  const speechEnabled = localStorage.getItem("speechEnabled") === "true";
  if (speechEnabled && synth) {
    // Wait a bit for dynamic content to load, then attach listeners
    setTimeout(() => {
      attachSpeechListeners();
    }, 500);
  }
}

// Function to reattach speech listeners after dynamic content loads
function reattachSpeechListeners() {
  const speechEnabled = localStorage.getItem("speechEnabled") === "true";
  if (speechEnabled && synth) {
    attachSpeechListeners();
  }
}

const attachSpeechListeners = () => {
  if (!synth) return;
  const readableElements = document.querySelectorAll(".readable-text");
  readableElements.forEach((element) => {
    element.removeEventListener("mouseover", handleMouseOver);
    element.removeEventListener("mouseout", handleMouseOut);

    element.addEventListener("mouseover", handleMouseOver);
    element.addEventListener("mouseout", handleMouseOut);
  });
};

const removeSpeechListeners = () => {
  if (!synth) return;
  const readableElements = document.querySelectorAll(".readable-text");
  readableElements.forEach((element) => {
    element.removeEventListener("mouseover", handleMouseOver);
    element.removeEventListener("mouseout", handleMouseOut);
  });
  if (currentUtterance && synth.speaking) {
    synth.cancel();
    currentUtterance = null;
  }
};

const handleMouseOver = (event) => {
  if (!synth) return;
  const speechEnabled = localStorage.getItem("speechEnabled") === "true";
  if (!speechEnabled) return;
  const textToSpeak = event.target.textContent;

  if (currentUtterance && synth.speaking) {
    synth.cancel();
  }

  currentUtterance = new SpeechSynthesisUtterance(textToSpeak);
  const currentLanguage = localStorage.getItem("lang") || "ar";
  currentUtterance.lang = currentLanguage === "ar" ? "ar-EG" : "en-US";
  currentUtterance.pitch = 0;
  currentUtterance.rate = 1.1;
  synth.speak(currentUtterance);
};

const handleMouseOut = () => {
  if (!synth) return;
  if (currentUtterance && synth.speaking) {
    synth.cancel();
    currentUtterance = null;
  }
};

window.toggleSpeechRecognition = (forceState = null) => {
  if (!("speechSynthesis" in window)) {
    console.log("Your Browser doesn't Support Web Speech API.");
    return;
  }

  let speechEnabled = localStorage.getItem("speechEnabled") === "true";
  if (forceState !== null) {
    speechEnabled = forceState;
  } else {
    speechEnabled = !speechEnabled;
  }
  localStorage.setItem("speechEnabled", speechEnabled);

  const speechToggleAccBtn = document.getElementById("speech-toggle-btn-acc");
  if (speechToggleAccBtn) {
    // Get translations with fallback handling
    const getTranslation = (key, fallbackAr = "", fallbackEn = "") => {
      if (
        typeof translations !== "undefined" &&
        currentLanguage === "en" &&
        translations.en &&
        translations.en[key]
      ) {
        return translations.en[key];
      }
      return currentLanguage === "ar" ? fallbackAr : fallbackEn;
    };

    speechToggleAccBtn.innerHTML = speechEnabled
      ? `<i class="fas fa-volume-up"></i> ${getTranslation(
          "acc_speech_on",
          "قراءة صوتية: مفعل",
          "Speech Read: On"
        )}`
      : `<i class="fas fa-volume-mute"></i> ${getTranslation(
          "acc_speech_off",
          "قراءة صوتية: معطل",
          "Speech Read: Off"
        )}`;
  }

  if (speechEnabled) {
    attachSpeechListeners();
  } else {
    removeSpeechListeners();
  }
};

let currentLanguage = localStorage.getItem("lang") || "ar";

const setLanguage = (lang) => {
  if (typeof translations === "undefined") {
    console.error("Translations object not found. Cannot set language.");
    return;
  }

  currentLanguage = lang;
  localStorage.setItem("lang", lang);

  // Update HTML lang and dir attributes
  if (lang === "ar") {
    document.documentElement.setAttribute("dir", "rtl");
    document.documentElement.setAttribute("lang", "ar");
  } else {
    document.documentElement.setAttribute("dir", "ltr");
    document.documentElement.setAttribute("lang", "en");
  }

  const govTitleElement = document.querySelector(".gov_title");
  if (govTitleElement) {
    if (lang === "ar") {
      govTitleElement.style.fontFamily = "'Lalezar', sans-serif";
      govTitleElement.style.fontSize = "52px";
    } else {
      govTitleElement.style.fontFamily = "'UoqMunThenKhung', sans-serif";
      govTitleElement.style.fontSize = "35px";
    }
  }

  // Only apply translations when switching to English
  if (lang === "en") {
    document.querySelectorAll("[data-lang-key]").forEach((element) => {
      const key = element.getAttribute("data-lang-key");
      if (translations.en && translations.en[key]) {
        if (key === "home_button" || key === "current_language_display") {
          element.innerHTML = translations.en[key];
        } else {
          element.textContent = translations.en[key];
        }
      }
    });
  } else {
    // For Arabic, restore original text content from data-original-text or keep current
    document.querySelectorAll("[data-lang-key]").forEach((element) => {
      const originalText = element.getAttribute("data-original-text");
      if (originalText) {
        element.textContent = originalText;
      }
      // For special elements that use innerHTML
      const key = element.getAttribute("data-lang-key");
      if (key === "home_button") {
        element.innerHTML = "<i class='fas fa-home'></i>";
      } else if (key === "current_language_display") {
        element.innerHTML = "🇪🇬 العربية";
      }
    });
  }

  // Update accessibility panel if it exists
  if (typeof renderAccessibilityPanel === "function") {
    renderAccessibilityPanel();
  }

  if ("speechSynthesis" in window) {
    const speechEnabled = localStorage.getItem("speechEnabled") === "true";
    if (speechEnabled) {
      attachSpeechListeners();
    }
  }

  if (mainSplideSlider) {
    mainSplideSlider.destroy(true);
  }

  // Only initialize Splide if it's available and the element exists
  if (typeof Splide !== "undefined" && document.querySelector(".splide")) {
    mainSplideSlider = new Splide(".splide", {
      type: "loop",
      perPage: 3,
      focus: "center",
      gap: "1.5rem",
      autoplay: true,
      interval: 3000,
      pauseOnHover: true,
      arrows: true,
      pagination: true,
      easing: "cubic-bezier(0.25, 1, 0.5, 1)",
      speed: 800,
      // direction: "rtl",
      direction: lang === "ar" ? "rtl" : "ltr",
      breakpoints: {
        1024: {
          perPage: 3,
          gap: "1.5rem",
        },
        768: {
          perPage: 2,
          gap: "1rem",
        },
        480: {
          perPage: 1,
          gap: "0.5rem",
        },
      },
    });

    mainSplideSlider.on("mounted move", () => {});

    mainSplideSlider.mount();
  }

  // Update weather display when language changes
  if (typeof fetchWeather === "function") {
    fetchWeather();
  }

  // Update existing counter displays when language changes
  updateCounterDisplays();

  // Update map display when language changes
  if (typeof updateMapLanguage === "function") {
    updateMapLanguage();
  }

  // Reattach speech listeners after language change
  reattachSpeechListeners();
};

// Function to update existing counter displays based on current language
function updateCounterDisplays() {
  const statNumbers = document.querySelectorAll(".count-value");
  const currentLang = localStorage.getItem("lang") || "ar";

  statNumbers.forEach((element) => {
    const target = parseInt(element.getAttribute("data-count"));
    if (!isNaN(target)) {
      if (currentLang === "en") {
        element.textContent = target.toLocaleString("en-US");
      } else {
        element.textContent = target.toLocaleString("ar-EG");
      }
    }
  });
}

function togglePanel(btn) {
  const panel = btn.nextElementSibling;
  const isOpen = panel.style.display === "block";

  document
    .querySelectorAll(".panel")
    .forEach((p) => (p.style.display = "none"));
  document
    .querySelectorAll(".accordion")
    .forEach((b) => b.classList.remove("open"));

  if (!isOpen) {
    panel.style.display = "block";
    btn.classList.add("open");
  }
}

// Gov-entities //

let originalCardPosition = null;
let originalCardParent = null;
let currentDetailCard = null;

function showAdminDetail(card) {
  // Store original position and parent
  originalCardPosition = {
    parent: card.parentNode,
    nextSibling: card.nextElementSibling,
  };
  originalCardParent = card.parentNode;
  currentDetailCard = card;

  // Get current language
  const currentLang = localStorage.getItem("lang") || "ar";
  const langSuffix = currentLang === "en" ? "-en" : "-ar";

  // Get admin data from card attributes based on current language
  const adminName = card.getAttribute(`data-admin-name${langSuffix}`);
  const adminDirector = card.getAttribute(`data-admin-director${langSuffix}`);
  const adminTelephone = card.getAttribute("data-admin-telephone");
  const adminFax = card.getAttribute("data-admin-fax");
  const adminEmail = card.getAttribute("data-admin-email");
  const adminDescription = card.getAttribute(
    `data-admin-description${langSuffix}`
  );
  const adminServices = card.getAttribute(`data-admin-services${langSuffix}`);
  const adminAddress = card.getAttribute(`data-admin-address${langSuffix}`);
  const adminImage = card.querySelector("img").src;
  const adminImageAlt = card.querySelector("img").alt;

  // Update centered card content
  document.getElementById("adminCenteredTitle").textContent = adminName;
  document.getElementById("adminCenteredImage").src = adminImage;
  document.getElementById("adminCenteredImage").alt = adminImageAlt;

  // Update details panel content
  document.getElementById("adminDetailsTitle").textContent = adminName;
  document.getElementById("adminDescription").textContent = adminDescription;
  document.getElementById("adminDirector").textContent = adminDirector;
  document.getElementById("adminTelephone").textContent = adminTelephone;
  document.getElementById("adminFax").textContent = adminFax;
  document.getElementById("adminEmail").textContent = adminEmail;

  // Ensure adminEmailLink exists before setting its properties
  const adminEmailLinkElement = document.getElementById("adminEmailLink");
  if (adminEmailLinkElement) {
    adminEmailLinkElement.textContent = adminEmail;
    adminEmailLinkElement.href = "mailto:" + adminEmail;
  }

  document.getElementById("adminAddress").textContent = adminAddress;
  document.getElementById("adminServices").textContent = adminServices;

  // Update labels based on current language
  updateDetailLabels(currentLang);

  // Show overlay
  const overlay = document.getElementById("adminDetailOverlay");
  overlay.classList.add("active");

  // Animate elements
  setTimeout(() => {
    document.getElementById("adminCardCentered").classList.add("animate-in");
    setTimeout(() => {
      document.getElementById("adminDetailsPanel").classList.add("animate-in");
    }, 200);
  }, 100);

  // Prevent body scroll
  document.body.style.overflow = "hidden";

  // Reattach speech listeners after content update
  if (typeof reattachSpeechListeners !== "undefined") {
    setTimeout(() => {
      reattachSpeechListeners();
    }, 300);
  }
}

function updateDetailLabels(lang) {
  const labels = {
    ar: {
      director_label: "المدير:",
      telephone_label: "الهاتف:",
      fax_label: "الفاكس:",
      email_label: "البريد الإلكتروني:",
      address_label: "العنوان:",
      services_label: "الخدمات المقدمة:",
    },
    en: {
      director_label: "Director:",
      telephone_label: "Telephone:",
      fax_label: "Fax:",
      email_label: "Email:",
      address_label: "Address:",
      services_label: "Services Provided:",
    },
  };

  const currentLabels = labels[lang] || labels.ar;

  // Update label texts
  document.querySelector(
    '[data-lang-key="director_label"]'
  ).innerHTML = `<i class="fas fa-user"></i> ${currentLabels.director_label}`;
  document.querySelector(
    '[data-lang-key="telephone_label"]'
  ).innerHTML = `<i class="fas fa-phone"></i> ${currentLabels.telephone_label}`;
  document.querySelector(
    '[data-lang-key="fax_label"]'
  ).innerHTML = `<i class="fas fa-fax"></i> ${currentLabels.fax_label}`;
  document.querySelector(
    '[data-lang-key="email_label"]'
  ).innerHTML = `<i class="fas fa-envelope"></i> ${currentLabels.email_label}`;
  document.querySelector(
    '[data-lang-key="address_label"]'
  ).innerHTML = `<i class="fas fa-map-marker-alt"></i> ${currentLabels.address_label}`;
  document.querySelector(
    '[data-lang-key="services_label"]'
  ).innerHTML = `<i class="fas fa-cogs"></i> ${currentLabels.services_label}`;
}

function closeAdminDetail() {
  const overlay = document.getElementById("adminDetailOverlay");
  const centeredCard = document.getElementById("adminCardCentered");
  const detailsPanel = document.getElementById("adminDetailsPanel");

  // Remove animations
  centeredCard.classList.remove("animate-in");
  detailsPanel.classList.remove("animate-in");

  // Hide overlay after animation
  setTimeout(() => {
    overlay.classList.remove("active");

    // Restore body scroll
    document.body.style.overflow = "";

    // Reset for next use
    currentDetailCard = null;
    originalCardPosition = null;
    originalCardParent = null;
  }, 300);
}

// Close on overlay click (but not on content click)

const overlay = document.getElementById("adminDetailOverlay");
if (overlay) {
  overlay.addEventListener("click", (e) => {
    if (
      !e.target.closest(".admin-card-centered") &&
      !e.target.closest(".admin-details-panel")
    ) {
      closeAdminDetail();
    }
  });
}

// Close on Escape key
document.addEventListener("keydown", function (e) {
  if (
    e.key === "Escape" &&
    document.getElementById("adminDetailOverlay").classList.contains("active")
  ) {
    closeAdminDetail();
  }
});

// Scroll progress indicator
function initializeScrollProgress() {
  const progressBar = document.getElementById("progress-bar");
  if (!progressBar) return;

  window.addEventListener("scroll", updateScrollProgress);
  updateScrollProgress();
}

function updateScrollProgress() {
  const progressBar = document.getElementById("progress-bar");
  if (!progressBar) return;

  const scrollTop = window.pageYOffset;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const scrollPercent = (scrollTop / docHeight) * 100;

  progressBar.style.width = Math.min(scrollPercent, 100) + "%";
}
