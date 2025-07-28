let currentFontSize = 1; //
let readingGuideActive = false;
let readingGuideElement = null;

function initializeAccessibility() {
  const accessibilityBtn = document.querySelector(".accessibility-btn");

  if (!accessibilityBtn) {
    console.warn(
      "Accessibility button not found. Navbar may not be loaded yet."
    );
    return;
  }

  let accessibilityPanel = document.getElementById("accessibility-panel");
  if (!accessibilityPanel) {
    accessibilityPanel = document.createElement("div");
    accessibilityPanel.id = "accessibility-panel";
    accessibilityPanel.className = "accessibility-panel";
    document.body.appendChild(accessibilityPanel);
  }

  renderAccessibilityPanel();

  accessibilityBtn.addEventListener("click", () => {
    accessibilityPanel.classList.toggle("active");
  });

  document.addEventListener("click", (event) => {
    if (
      !accessibilityPanel.contains(event.target) &&
      accessibilityBtn &&
      !accessibilityBtn.contains(event.target) &&
      accessibilityPanel.classList.contains("active")
    ) {
      accessibilityPanel.classList.remove("active");
    }
  });

  applySavedAccessibilitySettings();
}

function renderAccessibilityPanel() {
  const accessibilityPanel = document.getElementById("accessibility-panel");
  if (!accessibilityPanel) return;

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

  accessibilityPanel.innerHTML = `
        <div class="accessibility-panel-header">
            <h3>${getTranslation(
              "acc_panel_title",
              "أدوات سهولة الوصول",
              "Accessibility Tools"
            )}</h3>
            <button class="accessibility-close-btn" aria-label="إغلاق">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="accessibility-panel-content">
            <div class="accessibility-options">

                <div class="accessibility-group">
                    <h4 class="readable-text" >${getTranslation(
                      "acc_layout_spacing",
                      "التخطيط والتباعد",
                      "Layout & Spacing"
                    )}</h4>   

                    <div class="accessibility-group-items">
                        <button id="text-spacing-btn-acc" class="accessibility-option-btn readable-text">
                            <i class="fas fa-text-width"></i>
                            <span>${getTranslation(
                              "acc_text_spacing",
                              "تباعد النص",
                              "Text Spacing"
                            )}</span>
                        </button>
                        <button id="line-height-btn-acc" class="accessibility-option-btn readable-text">
                            <i class="fas fa-text-height"></i>
                            <span>${getTranslation(
                              "acc_line_height",
                              "ارتفاع السطر",
                              "Line Height"
                            )}</span>
                        </button>
                        <button id="content-scaling-btn-acc" class="accessibility-option-btn readable-text">
                            <i class="fas fa-expand-arrows-alt"></i>
                            <span>${getTranslation(
                              "acc_content_scaling",
                              "تكبير المحتوى",
                              "Content Scaling"
                            )}</span>
                        </button>
                    </div>
                </div>
                

            <!--
                <div class="accessibility-group">

                    <h4 class="readable-text">${getTranslation(
                      "acc_font_control",
                      "التحكم في النص",
                      "Font Control"
                    )}</h4>

                    <div class="accessibility-group-items">
                        <button id="increase-font-btn-acc" class="accessibility-option-btn readable-text">
                            <i class="fas fa-plus"></i>
                            <span>${getTranslation(
                              "acc_increase_font",
                              "تكبير النص",
                              "Increase Font"
                            )}</span>
                        </button>
                        <button id="decrease-font-btn-acc" class="accessibility-option-btn readable-text">
                            <i class="fas fa-minus"></i>
                            <span>${getTranslation(
                              "acc_decrease_font",
                              "تصغير النص",
                              "Decrease Font"
                            )}</span>
                        </button>
                        <button id="reset-font-btn-acc" class="accessibility-option-btn readable-text">
                            <i class="fas fa-font"></i>
                            <span>${getTranslation(
                              "acc_reset_font",
                              "إعادة ضبط النص",
                              "Reset Font"
                            )}</span>
                        </button>
                    </div>
                </div>
                -->

                <div class="accessibility-group">

                  <h4 class="readable-text">${getTranslation(
                    "acc_reading_aids",
                    "مساعدات القراءة",
                    "Reading Aids"
                  )}</h4>   
                    <div class="accessibility-group-items">
                        <button id="speech-toggle-btn-acc" class="accessibility-option-btn readable-text">
                            <i class="fas fa-volume-mute"></i>
                            <span>${getTranslation(
                              "acc_speech_off",
                              "قراءة صوتية: معطل",
                              "Speech Read: Off"
                            )}</span>
                        </button>
                        <!--<button id="reading-mask-btn-acc" class="accessibility-option-btn readable-text">
                            <i class="fas fa-eye"></i>
                            <span>${getTranslation(
                              "acc_reading_mask",
                              "قناع القراءة",
                              "Reading Mask"
                            )}</span>
                        </button> -->
                        <button id="highlight-links-btn-acc" class="accessibility-option-btn readable-text">
                            <i class="fas fa-link"></i>
                            <span>${getTranslation(
                              "acc_highlight_links",
                              "إبراز الروابط",
                              "Highlight Links"
                            )}</span>
                        </button>

                        <button id="reading-guide-btn-acc" class="accessibility-option-btn readable-text">
                            <i class="fas fa-ruler-horizontal"></i>
                            <span>${getTranslation(
                              "acc_reading_guide",
                              "دليل القراءة",
                              "Reading Guide"
                            )}</span>
                        </button>
                    </div>
                </div>

                <div class="accessibility-group">

                  <h4 class="readable-text">${getTranslation(
                    "acc_visual_control",
                    "التحكم في الرؤية",
                    "Visual Controls"
                  )}</h4>       

                    <div class="accessibility-group-items">
                        <button id="high-contrast-btn-acc" class="accessibility-option-btn readable-text">
                            <i class="fas fa-adjust"></i>
                            <span>${getTranslation(
                              "acc_high_contrast",
                              "تباين عالي",
                              "High Contrast"
                            )}</span>
                        </button>
                        <button id="invert-colors-btn-acc" class="accessibility-option-btn readable-text">
                            <i class="fas fa-adjust"></i>
                            <span>${getTranslation(
                              "acc_invert_colors",
                              "عكس الألوان",
                              "Invert Colors"
                            )}</span>
                        </button>
                        <button id="grayscale-btn-acc" class="accessibility-option-btn readable-text">
                            <i class="fas fa-tint-slash"></i>
                            <span>${getTranslation(
                              "acc_grayscale",
                              "تدرج رمادي",
                              "Grayscale"
                            )}</span>
                        </button>
                    </div>
                </div>
                

                
                <div class="accessibility-group">

                    <h4 class="readable-text">${getTranslation(
                      "acc_motion_focus",
                      "الحركة والتركيز",
                      "Motion & Focus"
                    )}</h4>  

                    <div class="accessibility-group-items">
                        <button id="reduce-motion-btn-acc" class="accessibility-option-btn readable-text">
                            <i class="fas fa-pause-circle"></i>
                            <span>${getTranslation(
                              "acc_reduce_motion",
                              "تقليل الحركة",
                              "Reduce Motion"
                            )}</span>
                        </button>
                        <button id="focus-highlight-btn-acc" class="accessibility-option-btn readable-text">
                            <i class="fas fa-crosshairs"></i>
                            <span>${getTranslation(
                              "acc_focus_highlight",
                              "إبراز التركيز",
                              "Focus Highlight"
                            )}</span>
                        </button>
                        <button id="cursor-size-btn-acc" class="accessibility-option-btn readable-text">
                            <i class="fas fa-mouse-pointer"></i>
                            <span>${getTranslation(
                              "acc_cursor_size",
                              "حجم المؤشر",
                              "Cursor Size"
                            )}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <div class="accessibility-panel-footer">
            <div class="accessibility-group">
                <div class="accessibility-group-items">
                    <button id="reset-defaults-btn-acc" class="accessibility-option-btn readable-text reset-btn">
                        <i class="fas fa-undo"></i>
                        <span>${getTranslation(
                          "acc_reset_defaults",
                          "إعادة تعيين الافتراضي",
                          "Reset Defaults"
                        )}</span>
                    </button>
                </div>
            </div>
        </div>
    `;
  attachAccessibilityListeners();
  updateAccessibilityButtonStates();
}

function attachAccessibilityListeners() {
  // document
  //   .getElementById("increase-font-btn-acc")
  //   .addEventListener("click", () => toggleFontSize("increase"));
  // document
  //   .getElementById("decrease-font-btn-acc")
  //   .addEventListener("click", () => toggleFontSize("decrease"));
  // document
  //   .getElementById("reset-font-btn-acc")
  //   .addEventListener("click", () => toggleFontSize("reset"));
  document
    .getElementById("high-contrast-btn-acc")
    .addEventListener("click", () => toggleAccessibilityClass("high-contrast"));
  document
    .getElementById("invert-colors-btn-acc")
    .addEventListener("click", () => toggleAccessibilityClass("invert-colors"));
  document
    .getElementById("grayscale-btn-acc")
    .addEventListener("click", () => toggleAccessibilityClass("grayscale"));
  // document
  //   .getElementById("reading-mask-btn-acc")
  //   .addEventListener("click", () => toggleAccessibilityClass("reading-mask"));
  document
    .getElementById("highlight-links-btn-acc")
    .addEventListener("click", () =>
      toggleAccessibilityClass("highlight-links")
    );
  document
    .getElementById("speech-toggle-btn-acc")
    .addEventListener("click", () => toggleSpeechRecognition());
  document
    .getElementById("reading-guide-btn-acc")
    .addEventListener("click", () => toggleReadingGuide());
  document
    .getElementById("text-spacing-btn-acc")
    .addEventListener("click", () => toggleAccessibilityClass("text-spacing"));
  document
    .getElementById("line-height-btn-acc")
    .addEventListener("click", () => toggleAccessibilityClass("line-height"));
  document
    .getElementById("content-scaling-btn-acc")
    .addEventListener("click", () =>
      toggleAccessibilityClass("content-scaling")
    );
  document
    .getElementById("reduce-motion-btn-acc")
    .addEventListener("click", () => toggleAccessibilityClass("reduce-motion"));
  document
    .getElementById("focus-highlight-btn-acc")
    .addEventListener("click", () =>
      toggleAccessibilityClass("focus-highlight")
    );
  document
    .getElementById("cursor-size-btn-acc")
    .addEventListener("click", () => toggleAccessibilityClass("cursor-size"));
  document
    .getElementById("reset-defaults-btn-acc")
    .addEventListener("click", () => resetAllAccessibilitySettings());

  // Add close button event listener
  const closeBtn = document.querySelector(".accessibility-close-btn");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      const accessibilityPanel = document.getElementById("accessibility-panel");
      if (accessibilityPanel) {
        accessibilityPanel.classList.remove("active");
      }
    });
  }
}

// Function to toggle font size
function toggleFontSize(action) {
  const body = document.body;

  body.classList.remove("font-increase", "font-decrease");

  if (action === "increase") {
    currentFontSize = 1.15;
    body.classList.add("font-increase");
  } else if (action === "decrease") {
    currentFontSize = 0.85;
    body.classList.add("font-decrease");
  } else if (action === "reset") {
    currentFontSize = 1;
  }

  // Save font size setting
  localStorage.setItem("accessibility-font-size", currentFontSize.toString());
  updateAccessibilityButtonStates();
}

// Function to toggle accessibility classes
function toggleAccessibilityClass(className) {
  const body = document.body;
  body.classList.toggle(className);

  // Save setting to localStorage
  const isActive = body.classList.contains(className);
  localStorage.setItem(`accessibility-${className}`, isActive.toString());

  updateAccessibilityButtonStates();
}

// Function to toggle reading guide
function toggleReadingGuide() {
  readingGuideActive = !readingGuideActive;

  if (readingGuideActive) {
    // Create reading guide element
    readingGuideElement = document.createElement("div");
    readingGuideElement.className = "reading-guide";
    document.body.appendChild(readingGuideElement);

    // Add mouse move listener
    document.addEventListener("mousemove", updateReadingGuidePosition);
  } else {
    // Remove reading guide
    if (readingGuideElement) {
      readingGuideElement.remove();
      readingGuideElement = null;
    }
    document.removeEventListener("mousemove", updateReadingGuidePosition);
  }

  // Save setting
  localStorage.setItem(
    "accessibility-reading-guide",
    readingGuideActive.toString()
  );
  updateAccessibilityButtonStates();
}

// Function to update reading guide position
function updateReadingGuidePosition(event) {
  if (readingGuideElement) {
    const mouseY = event.clientY;
    readingGuideElement.style.top = `${mouseY - 25}px`; // Center the guide on mouse Y position
  }
}

// Function to reset all accessibility settings
function resetAllAccessibilitySettings() {
  const body = document.body;

  const accessibilityClasses = [
    "font-increase",
    "font-decrease",
    "high-contrast",
    "invert-colors",
    "grayscale",
    "reading-mask",
    "highlight-links",
    "text-spacing",
    "line-height",
    "content-scaling",
    "reduce-motion",
    "focus-highlight",
    "cursor-size",
  ];

  accessibilityClasses.forEach((className) => {
    body.classList.remove(className);
    localStorage.removeItem(`accessibility-${className}`);
  });

  // Reset font size
  currentFontSize = 1;
  localStorage.removeItem("accessibility-font-size");

  // Reset reading guide
  if (readingGuideActive) {
    toggleReadingGuide(); // This will turn it off
  }

  // Reset speech recognition if active
  if (
    typeof window.speechRecognitionActive !== "undefined" &&
    window.speechRecognitionActive
  ) {
    toggleSpeechRecognition();
  }

  updateAccessibilityButtonStates();
}

// Function to update button states based on current settings
function updateAccessibilityButtonStates() {
  const accessibilityClasses = [
    "high-contrast",
    "invert-colors",
    "grayscale",
    "reading-mask",
    "highlight-links",
    "text-spacing",
    "line-height",
    "content-scaling",
    "reduce-motion",
    "focus-highlight",
    "cursor-size",
  ];

  accessibilityClasses.forEach((className) => {
    const button = document.getElementById(`${className}-btn-acc`);
    if (button) {
      const isActive = document.body.classList.contains(className);
      button.classList.toggle("active", isActive);
    }
  });

  // Update reading guide button
  const readingGuideBtn = document.getElementById("reading-guide-btn-acc");
  if (readingGuideBtn) {
    readingGuideBtn.classList.toggle("active", readingGuideActive);
  }

  // Update speech recognition button
  const speechBtn = document.getElementById("speech-toggle-btn-acc");
  if (speechBtn) {
    const isActive =
      typeof window.speechRecognitionActive !== "undefined" &&
      window.speechRecognitionActive;
    speechBtn.classList.toggle("active", isActive);
  }
}

// Function to apply saved accessibility settings on page load
function applySavedAccessibilitySettings() {
  // Apply class-based settings
  const accessibilityClasses = [
    "high-contrast",
    "invert-colors",
    "grayscale",
    "reading-mask",
    "highlight-links",
    "text-spacing",
    "line-height",
    "content-scaling",
    "reduce-motion",
    "focus-highlight",
    "cursor-size",
  ];

  accessibilityClasses.forEach((className) => {
    const saved = localStorage.getItem(`accessibility-${className}`);
    if (saved === "true") {
      document.body.classList.add(className);
    }
  });

  // Apply font size setting
  const savedFontSize = localStorage.getItem("accessibility-font-size");
  if (savedFontSize) {
    currentFontSize = parseFloat(savedFontSize);
    if (currentFontSize > 1) {
      document.body.classList.add("font-increase");
    } else if (currentFontSize < 1) {
      document.body.classList.add("font-decrease");
    }
  }

  // Apply reading guide setting
  const savedReadingGuide = localStorage.getItem("accessibility-reading-guide");
  if (savedReadingGuide === "true") {
    toggleReadingGuide();
  }

  // Apply speech recognition setting
  const savedSpeechRecognition = localStorage.getItem(
    "accessibility-speech-recognition"
  );
  if (savedSpeechRecognition === "true") {
    // Call the speech recognition function from main.js if it exists
    if (typeof window.toggleSpeechRecognition === "function") {
      window.toggleSpeechRecognition();
    }
  }

  updateAccessibilityButtonStates();
}
