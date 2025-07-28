function loadNavbar(currentPagePath = "") {
  const navbarHtml = `
    <!-- Navigation Header -->
    <header class="modern-navbar">
      <div class="container">
        <div class="navbar-content">
          <div class="logo-section">
            <img
              src="${currentPagePath}assets/logo.png"
              alt="شعار محافظة القليوبية"
              class="navbar-logo"
            />
            <span class="logo-text" data-lang-key="page_title">محافظة القليوبية</span>

          </div>

          <nav class="nav-links">
            <a href="${currentPagePath}index.html" class="readable-text nav-link" data-lang-key="home_button" >الرئيسية</a>
            <a href="${currentPagePath}#projects-section" class="readable-text nav-link" data-lang-key="qalyubia_events">أحداث المحافظة</a>
            <a href="${currentPagePath}#services-section" class="readable-text nav-link" data-lang-key="main_services">الخدمات الرئيسية</a>
            <a href="${currentPagePath}pages/gov-entities.html" class="readable-text nav-link" data-lang-key="gov_entities">كيانات المحافظة</a>
            <a href="${currentPagePath}pages/governor.html" class="readable-text nav-link" data-lang-key="gov_office">مكتب المحافظ</a>
          </nav>

          <div class="nav-actions">
            <button class="accessibility-btn" title="أدوات سهولة الوصول">
              <i class="fas fa-universal-access"></i>
            </button>

            <button class="theme-toggle" title="تبديل الثيم">
              <i class="fas fa-moon"></i>
            </button>
            
            <button class="lang-toggle" title="English">
              <i class="fas fa-globe"></i>
            </button>

            <button class="mobile-menu-toggle">
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </div>
    </header>
  `;

  document.body.insertAdjacentHTML("afterbegin", navbarHtml);

  // Apply current language translations to navbar elements
  applyLanguageToElements();

  // Initialize navbar specific functionalities AFTER the navbar is in the DOM
  initializeNavbar();

  // Call theme and accessibility initializers AFTER navbar is loaded
  // These functions are now responsible for setting up their respective buttons
  if (typeof initializeThemeToggle !== "undefined") {
    initializeThemeToggle();
  }
  if (typeof initializeAccessibility !== "undefined") {
    // Use setTimeout to ensure the DOM is fully updated after navbar insertion
    setTimeout(() => {
      initializeAccessibility();
    }, 0);
  }

  // Reattach speech listeners after navbar loads
  if (typeof reattachSpeechListeners !== "undefined") {
    setTimeout(() => {
      reattachSpeechListeners();
    }, 100);
  }
}

function loadFooter(currentPagePath = "") {
  const footerHtml = `
<footer class="footer">
  <div class="footer-content">
    
    <div class="footer-right-part">

      <div class="footer-contact">
        <h4 class="readable-text" data-lang-key="contact_us">تواصل معنا</h4>
        <p class="contact-description readable-text" data-lang-key="contact_us_desc">يمكنك التواصل معنا من خلال:</p>
        <div class="contact-item">
          <i class="fas fa-phone-alt contact-icon"></i>
          <span class="readable-text hotline-number">114</span>
        </div>
        <div class="contact-item">
          <i class="fas fa-exclamation-triangle"></i>
          <a href="https://survey123.arcgis.com/share/bb0355fa876844d9b82f4e6808440086" target="_blank" class="readable-text" data-lang-key="complaints_heading">تقديم شكوى</a>
        </div>
          <!--<div class="contact-item">
          <i class="fas fa-lightbulb"></i>
          <a href="https://survey123.arcgis.com/share/2388755b993c48088c9d83f7376ba629?portalUrl=https://el7koma.maps.arcgis.com" class="readable-text" data-lang-key="suggestion_heading">تقديم مقترح</a>
        </div>-->
        <div class="contact-item">
            <i class="fas fa-envelope"></i>
            <a href="mailto:Info@qaliobia.gov.eg" class="readable-text">Info@qaliobia.gov.eg</a>
        </div>
      </div>

      <div class="footer-links">
        <h4 class="readable-text" ><span><i class="fas fa-file-invoice footer-icon"></i></span><span data-lang-key="Know_your_bill">أعرف فاتورتك</span></h4>
        <ul>
          <li><a href="http://sdedc.gov.eg/ar/Fatora" target="_blank" class="readable-text" data-lang-key="electricity_bill">كهرباء</a></li>
          <li><a href="https://qlbww.com.eg/" target="_blank" class="readable-text" data-lang-key="water_bill">المياة</a></li>
          <li><a href="https://www.petrotrade.com.eg/web/bill.html" target="_blank" class="readable-text" data-lang-key="gas_bill">الغاز</a></li>
        </ul>
      </div>

    </div>


    <div class="footer-links-group">
      <div class="footer-links">
        <h4 class="readable-text" ><span><i class="fas fa-link footer-icon"></i></span><span data-lang-key="important_links">روابط هامة</span></h4>
        <div class="footer-important-links">
          <ul>
            <li><a href="https://lgs.gov.eg/#/home" target="_blank" class="readable-text" data-lang-key="govlgs" >بوابة خدمات المحليات</a></li>
            <li><a href="https://www.investinegypt.gov.eg/Arabic/Pages/default.aspx" target="_blank" class="readable-text" data-lang-key="investinegypt">الهيئة العامة للأستثمار</a></li>
            <li><a href="https://www.sis.gov.eg/?lang=ar" target="_blank" class="readable-text" data-lang-key="sis_gov">الهيئة العامة للأستعلامات</a></li>
          </ul>
        <ul>
            <li><a href="https://digital.gov.eg/" target="_blank" class="readable-text" data-lang-key="digital_egypt" >مصر الرقمية</a></li>
            <li><a href="https://www.presidency.eg/ar/" target="_blank" class="readable-text" data-lang-key="presidency" >رئاسة الجمهورية</a></li>
            <li><a href="https://cabinet.gov.eg/" target="_blank" class="readable-text" data-lang-key="cabinet">رئاسة مجلس الوزراء</a></li>
            </ul>
      </div>  
      </div>
    </div>
  </div>


  <div class="footer-divider-wrapper">
    <div class="social-media-divider">
      <a href="https://www.facebook.com/qalyubiya.gov.org/" target="_blank" class="social-icon facebook-icon" aria-label="Facebook">
        <i class="fab fa-facebook-f"></i>
      </a>
      <a href="https://wa.me/201515169917" target="_blank" class="social-icon whatsapp-icon" aria-label="WhatsApp">
        <i class="fab fa-whatsapp"></i>
      </a>
    </div>
  </div>

  <div class="footer-bottom">
    <div class="footer-weather footer-bottom-item" id="weather-section">
      <a href="https://www.google.com/search?q=weather+qalyubia&authuser=2" target="_blank" id="weather-display" class="readable-text">جاري التحميل...</a>
    </div>
    <p class="readable-text footer-copyright-text" data-lang-key="copyright_text">© 2025 محافظة القليوبية</p>
    <p class="footer-team-link readable-text"><a href="${currentPagePath}pages/team.html" data-lang-key="team_button" >فريق العمل</a></p>
    </div>

  <button class="to-top-button" id="to-top-btn" title="Go To Top"></button>
</footer>
  `;
  document.body.insertAdjacentHTML("beforeend", footerHtml);

  // Apply current language translations to footer elements
  applyLanguageToElements();

  const toTopButton = document.getElementById("to-top-btn");
  if (toTopButton) {
    window.addEventListener("scroll", () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollProgress = (scrollTop + windowHeight) / documentHeight;
      toTopButton.style.display = scrollProgress >= 0.5 ? "flex" : "none";
    });

    toTopButton.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  const footer = document.querySelector(".footer");
  if (footer) {
    const updateFooterWave = () => {
      // Check for the 'dark' data-theme attribute to determine the current theme
      const isDark = document.body.getAttribute("data-theme") === "dark";
      const rootStyles = getComputedStyle(document.documentElement);

      // Get the appropriate wave color based on the theme
      const svgFill = isDark
        ? encodeURIComponent(
            rootStyles.getPropertyValue("--footer-wave-color-dark").trim()
          )
        : encodeURIComponent(
            rootStyles.getPropertyValue("--footer-wave-color").trim()
          );
      const svgOpacity = isDark ? "0.20" : "0.20"; // Opacity can be adjusted per theme if needed

      const waveSvg = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'><path fill='${svgFill}' fill-opacity='${svgOpacity}' d='M0,192L48,170.7C96,149,192,107,288,122.7C384,139,480,213,576,213.3C672,213,768,139,864,101.3C960,64,1056,64,1152,69.3C1248,75,1344,85,1392,90.7L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'/></svg>")`;

      // Apply the background image with the appropriate wave SVG and gradients
      footer.style.backgroundImage = `linear-gradient(to bottom, var(--footer-gradient-1) 0%, var(--footer-gradient-2) 5%, var(--footer-gradient-3) 70%, var(--footer-bg) 90%), ${waveSvg}`;
    };

    fetchWeather();
    updateFooterWave();

    // Listen for a custom event 'themeChange' dispatched from theme.js
    // This ensures the footer wave updates when the theme is toggled
    document.body.addEventListener("themeChange", updateFooterWave);
  }

  // Reattach speech listeners after footer loads
  if (typeof reattachSpeechListeners !== "undefined") {
    setTimeout(() => {
      reattachSpeechListeners();
    }, 100);
  }
}

// Navbar functionality
function initializeNavbar() {
  const navbar = document.querySelector(".modern-navbar");
  const mobileToggle = document.querySelector(".mobile-menu-toggle");
  const langToggle = document.querySelector(".lang-toggle"); // Get the language toggle button

  // Mobile menu toggle
  if (mobileToggle) {
    const navLinks = document.querySelector(".nav-links");
    mobileToggle.addEventListener("click", function () {
      if (navLinks) {
        navLinks.classList.toggle("mobile-menu-open");
        mobileToggle.classList.toggle("active");

        const spans = mobileToggle.querySelectorAll("span");
        spans.forEach((span, index) => {
          if (mobileToggle.classList.contains("active")) {
            if (index === 0)
              span.style.transform = "rotate(45deg) translate(5px, 5px)";
            if (index === 1) span.style.opacity = "0";
            if (index === 2)
              span.style.transform = "rotate(-45deg) translate(7px, -6px)";
          } else {
            span.style.transform = "none";
            span.style.opacity = "1";
          }
        });

        // Ensure navLinks is visible when mobile-menu-open is applied
        if (navLinks.classList.contains("mobile-menu-open")) {
          navLinks.style.display = "flex";
        } else {
          navLinks.style.display = "";
        }
      } else {
        console.log("Nav links not found!");
      }
    });

    const navLinkItems = document.querySelectorAll(".nav-links a");
    navLinkItems.forEach((link) => {
      link.addEventListener("click", () => {
        const navLinks = document.querySelector(".nav-links");
        if (navLinks) {
          navLinks.classList.remove("mobile-menu-open");
          mobileToggle.classList.remove("active");
          const spans = mobileToggle.querySelectorAll("span");
          spans.forEach((span) => {
            span.style.transform = "none";
            span.style.opacity = "1";
          });
        }
      });
    });

    document.addEventListener("click", (e) => {
      const navLinks = document.querySelector(".nav-links");
      if (
        navLinks &&
        !mobileToggle.contains(e.target) &&
        !navLinks.contains(e.target)
      ) {
        navLinks.classList.remove("mobile-menu-open");
        mobileToggle.classList.remove("active");
        const spans = mobileToggle.querySelectorAll("span");
        spans.forEach((span) => {
          span.style.transform = "none";
          span.style.opacity = "1";
        });
      }
    });
  }

  if (langToggle) {
    langToggle.addEventListener("click", function () {
      const newLang = currentLanguage === "ar" ? "en" : "ar";
      setLanguage(newLang);
      this.title = newLang === "ar" ? "English" : "العربية";
      this.querySelector("i").className =
        newLang === "ar" ? "fas fa-globe" : "fas fa-globe";
    });

    langToggle.title = currentLanguage === "ar" ? "English" : "العربية";
  }
}

function fetchWeather() {
  const weatherDisplay = document.getElementById("weather-display");
  if (!weatherDisplay) return;

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

  weatherDisplay.innerHTML = `<p>${getTranslation(
    "loading_weather",
    "جاري التحميل...",
    "Loading weather..."
  )}</p>`;

  const lat = 30.46,
    lon = 31.18;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`;

  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      const temperature = data.current_weather.temperature;
      const code = data.current_weather.weathercode;
      const weatherInfo = getWeatherDescription(code);

      weatherDisplay.innerHTML = `
        <div class="weather-info">
          <span class="weather-icon">${weatherInfo.icon}</span>
          <span>${temperature}°C | ${weatherInfo.description}</span>
        </div>
      `;
    })
    .catch(() => {
      weatherDisplay.innerHTML = `<p>${getTranslation(
        "weather_error",
        "خطأ في تحميل الطقس",
        "Weather loading error"
      )}</p>`;
    });
}

function getWeatherDescription(code) {
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

  const descriptions = {
    0: {
      description: getTranslation("weather_clear", "صافي", "Clear"),
      icon: "☀️",
    },
    1: {
      description: getTranslation(
        "weather_partly_cloudy",
        "غائم جزئياً",
        "Partly Cloudy"
      ),
      icon: "🌤️",
    },
    2: {
      description: getTranslation(
        "weather_partly_cloudy",
        "غائم جزئياً",
        "Partly Cloudy"
      ),
      icon: "🌥️",
    },
    3: {
      description: getTranslation("weather_cloudy", "غائم", "Cloudy"),
      icon: "☁️",
    },
    45: {
      description: getTranslation("weather_fog", "ضباب", "Fog"),
      icon: "🌫️",
    },
    48: {
      description: getTranslation(
        "weather_freezing_fog",
        "ضباب متجمد",
        "Freezing Fog"
      ),
      icon: "🌫️",
    },
    51: {
      description: getTranslation(
        "weather_light_drizzle",
        "رذاذ خفيف",
        "Light Drizzle"
      ),
      icon: "💧",
    },
    53: {
      description: getTranslation("weather_drizzle", "رذاذ", "Drizzle"),
      icon: "💧",
    },
    55: {
      description: getTranslation(
        "weather_dense_drizzle",
        "رذاذ كثيف",
        "Dense Drizzle"
      ),
      icon: "💧",
    },
    61: {
      description: getTranslation(
        "weather_light_rain",
        "مطر خفيف",
        "Light Rain"
      ),
      icon: "🌦️",
    },
    63: {
      description: getTranslation("weather_rain", "مطر", "Rain"),
      icon: "🌧️",
    },
    65: {
      description: getTranslation(
        "weather_heavy_rain",
        "مطر غزير",
        "Heavy Rain"
      ),
      icon: "🌧️",
    },
    80: {
      description: getTranslation(
        "weather_light_showers",
        "زخات خفيفة",
        "Light Showers"
      ),
      icon: "🌦️",
    },
    81: {
      description: getTranslation("weather_showers", "زخات", "Showers"),
      icon: "🌧️",
    },
    82: {
      description: getTranslation(
        "weather_violent_showers",
        "زخات عنيفة",
        "Violent Showers"
      ),
      icon: "⛈️",
    },
    95: {
      description: getTranslation(
        "weather_thunderstorm",
        "عاصفة رعدية",
        "Thunderstorm"
      ),
      icon: "⛈️",
    },
  };
  return (
    descriptions[code] || {
      description: getTranslation(
        "weather_unknown",
        "طقس غير معروف",
        "Unknown Weather"
      ),
      icon: "❓",
    }
  );
}

// Function to apply current language translations to elements
function applyLanguageToElements() {
  // Get current language from localStorage or default to 'ar'
  const currentLang = localStorage.getItem("lang") || "ar";

  // Get translations with fallback handling
  const getTranslation = (key, fallbackAr = "", fallbackEn = "") => {
    if (
      typeof translations !== "undefined" &&
      currentLang === "en" &&
      translations.en &&
      translations.en[key]
    ) {
      return translations.en[key];
    }
    return currentLang === "ar" ? fallbackAr : fallbackEn;
  };

  // Apply translations to all elements with data-lang-key
  document.querySelectorAll("[data-lang-key]").forEach((element) => {
    const key = element.getAttribute("data-lang-key");

    // Store original text if not already stored
    if (!element.getAttribute("data-original-text")) {
      element.setAttribute("data-original-text", element.textContent);
    }

    if (currentLang === "en") {
      // Apply English translations
      if (translations.en && translations.en[key]) {
        if (key === "home_button" || key === "current_language_display") {
          element.innerHTML = translations.en[key];
        } else {
          element.textContent = translations.en[key];
        }
      }
    } else {
      // For Arabic, restore original text content
      const originalText = element.getAttribute("data-original-text");
      if (originalText) {
        element.textContent = originalText;
      }
      // For special elements that use innerHTML
      if (key === "home_button") {
        element.innerHTML = "<i class='fas fa-home'></i>";
      } else if (key === "current_language_display") {
        element.innerHTML = "🇪🇬 العربية";
      }
    }
  });
}
