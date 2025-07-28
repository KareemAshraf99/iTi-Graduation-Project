// Enhanced Governor Page JavaScript - Fixed Version

// Global variables
let currentModalImage = "";
let searchTimeout;

// Ensure all functions are available globally from the start
window.togglePanel = togglePanel;
window.openImageModal = openImageModal;
window.closeImageModal = closeImageModal;
window.downloadPDF = downloadPDF;
window.downloadImage = downloadImage;
window.downloadModalImage = downloadModalImage;
// window.printPDF = printPDF;
window.copyToClipboard = copyToClipboard;
// window.scrollToTop = scrollToTop;
window.scrollToSection = scrollToSection;
window.hidePDFLoading = hidePDFLoading;
window.showPDFError = showPDFError;
// window.hideImageLoading = hideImageLoading;
window.showImageError = showImageError;
window.initializeEnhancements = initializeEnhancements;

// Enhanced toggle panel function
function togglePanel(button) {
  const panel = button.nextElementSibling;
  const isExpanded = button.getAttribute("aria-expanded") === "true";

  // Close all other panels
  document.querySelectorAll(".enhanced-accordion").forEach((acc) => {
    if (acc !== button) {
      acc.setAttribute("aria-expanded", "false");
      const otherPanel = acc.nextElementSibling;
      if (otherPanel) {
        otherPanel.classList.remove("show");
      }
    }
  });

  // Toggle current panel
  if (isExpanded) {
    button.setAttribute("aria-expanded", "false");
    if (panel) {
      panel.classList.remove("show");
    }
  } else {
    button.setAttribute("aria-expanded", "true");
    if (panel) {
      panel.classList.add("show");

      // Smooth scroll to panel
      setTimeout(() => {
        button.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 300);
    }
  }

  updateScrollProgress();
}

// PDF loading handlers
function hidePDFLoading(loadingId) {
  const loading = document.getElementById(loadingId);
  if (loading) {
    loading.style.display = "none";
  }
}

function showPDFError(loadingId) {
  const loading = document.getElementById(loadingId);
  if (loading) {
    loading.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-triangle" style="color: #f59e0b; font-size: 2rem; margin-bottom: 10px;"></i>
        <p>حدث خطأ في تحميل الملف</p>
        <button onclick="location.reload()" class="action-btn">إعادة المحاولة</button>
      </div>
    `;
  }
}

// Image loading handlers
function hideImageLoading(loadingId) {
  const loading = document.getElementById(loadingId);
  if (loading) {
    loading.style.display = "none";
  }
}

function showImageError(loadingId) {
  const loading = document.getElementById(loadingId);
  if (loading) {
    loading.innerHTML = `
      <div class="error-message">
        <i class="fas fa-image" style="color: #6b7280; font-size: 2rem; margin-bottom: 10px;"></i>
        <p>فشل في تحميل الصورة</p>
        <button onclick="location.reload()" class="action-btn">إعادة المحاولة</button>
      </div>
    `;
  }
}

// Image modal functions
function openImageModal(imageSrc) {
  const modal = document.getElementById("image-modal");
  const modalImage = document.getElementById("modal-image");

  if (modal && modalImage) {
    currentModalImage = imageSrc;
    modalImage.src = imageSrc;
    modalImage.alt = "صورة مكبرة";
    modal.classList.add("show");
    document.body.style.overflow = "hidden";

    // Focus trap
    modal.focus();
  }
}

function closeImageModal() {
  const modal = document.getElementById("image-modal");
  if (modal) {
    modal.classList.remove("show");
    document.body.style.overflow = "";
    currentModalImage = "";
  }
}

function downloadModalImage() {
  if (currentModalImage) {
    downloadImage(currentModalImage);
  }
}

// Download functions
function downloadPDF(pdfUrl) {
  const link = document.createElement("a");
  link.href = pdfUrl;
  link.download = "السيرة_الذاتية_للمحافظ.pdf";
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast("تم بدء التحميل", "success");
}

function downloadImage(imageUrl) {
  const link = document.createElement("a");
  link.href = imageUrl;
  link.download = "صورة_مكتب_المحافظ.jpg";
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast("تم بدء التحميل", "success");
}

function printPDF() {
  window.print();
  showToast("تم فتح نافذة الطباعة", "info");
}

// Copy to clipboard function
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast("تم نسخ الرابط", "success");
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand("copy");
      showToast("تم نسخ الرابط", "success");
    } catch (err) {
      showToast("فشل في نسخ الرابط", "error");
    }

    document.body.removeChild(textArea);
  }
}

// Toast notification system
function showToast(message, type = "info") {
  const toast = document.getElementById("toast");
  if (!toast) return;

  const toastIcon = toast.querySelector(".toast-icon");
  const toastMessage = toast.querySelector(".toast-message");

  // Set icon based on type
  const icons = {
    success: "fas fa-check-circle",
    error: "fas fa-exclamation-circle",
    warning: "fas fa-exclamation-triangle",
    info: "fas fa-info-circle",
  };

  const colors = {
    success: "#10b981",
    error: "#ef4444",
    warning: "#f59e0b",
    info: "#3b82f6",
  };

  if (toastIcon) {
    toastIcon.className = icons[type] || icons.info;
    toastIcon.style.color = colors[type] || colors.info;
  }

  if (toastMessage) {
    toastMessage.textContent = message;
  }

  // Show toast
  toast.classList.add("show");

  // Hide after 3 seconds
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// Smooth scroll to section
function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
}

// Back to top function
function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

// Search functionality
function initializeSearch() {
  const searchInput = document.getElementById("search-input");
  const clearButton = document.getElementById("clear-search");

  if (!searchInput) return;

  searchInput.addEventListener("input", function () {
    clearTimeout(searchTimeout);
    const query = this.value.toLowerCase().trim();

    if (query.length > 0) {
      if (clearButton) clearButton.style.display = "block";
      searchTimeout = setTimeout(() => performSearch(query), 300);
    } else {
      if (clearButton) clearButton.style.display = "none";
      clearSearch();
    }
  });

  if (clearButton) {
    clearButton.addEventListener("click", function () {
      searchInput.value = "";
      this.style.display = "none";
      clearSearch();
      searchInput.focus();
    });
  }

  // Search on Enter key
  searchInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      const query = this.value.toLowerCase().trim();
      if (query.length > 0) {
        performSearch(query);
      }
    }
  });
}

function performSearch(query) {
  const accordionItems = document.querySelectorAll(".accordion-item");
  let hasResults = false;

  accordionItems.forEach((item) => {
    const searchContent = item.getAttribute("data-search-content") || "";
    const textContent = item.textContent.toLowerCase();

    if (searchContent.includes(query) || textContent.includes(query)) {
      item.classList.remove("hidden");
      item.classList.add("fade-in");
      hasResults = true;

      // Highlight matching text
      highlightSearchTerm(item, query);
    } else {
      item.classList.add("hidden");
    }
  });

  if (!hasResults) {
    showToast("لم يتم العثور على نتائج", "warning");
  } else {
    showToast(
      `تم العثور على ${
        document.querySelectorAll(".accordion-item:not(.hidden)").length
      } نتيجة`,
      "success"
    );
  }
}

function clearSearch() {
  const accordionItems = document.querySelectorAll(".accordion-item");
  accordionItems.forEach((item) => {
    item.classList.remove("hidden", "fade-in");
    removeHighlight(item);
  });
}

function highlightSearchTerm(element, term) {
  // Simple highlighting - can be enhanced further
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  const textNodes = [];
  let node;

  while ((node = walker.nextNode())) {
    if (node.textContent.toLowerCase().includes(term)) {
      textNodes.push(node);
    }
  }

  textNodes.forEach((textNode) => {
    const parent = textNode.parentNode;
    if (parent.tagName !== "SCRIPT" && parent.tagName !== "STYLE") {
      const text = textNode.textContent;
      const regex = new RegExp(`(${term})`, "gi");
      const highlightedText = text.replace(
        regex,
        '<mark style="background: #ffeb3b; padding: 2px 4px; border-radius: 3px;">$1</mark>'
      );

      if (highlightedText !== text) {
        const span = document.createElement("span");
        span.innerHTML = highlightedText;
        parent.replaceChild(span, textNode);
      }
    }
  });
}

function removeHighlight(element) {
  const marks = element.querySelectorAll("mark");
  marks.forEach((mark) => {
    const parent = mark.parentNode;
    parent.replaceChild(document.createTextNode(mark.textContent), mark);
    parent.normalize();
  });
}

// Animation on scroll
function initializeAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("slide-up");
      }
    });
  }, observerOptions);

  // Observe accordion items
  document.querySelectorAll(".accordion-item").forEach((item) => {
    observer.observe(item);
  });
}

// Keyboard navigation
function initializeKeyboardNavigation() {
  document.addEventListener("keydown", function (e) {
    // ESC key to close modals
    if (e.key === "Escape") {
      closeImageModal();
    }

    // Arrow keys for accordion navigation
    if (e.target.classList.contains("enhanced-accordion")) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const accordions = Array.from(
          document.querySelectorAll(".enhanced-accordion")
        );
        const currentIndex = accordions.indexOf(e.target);

        let nextIndex;
        if (e.key === "ArrowDown") {
          nextIndex = (currentIndex + 1) % accordions.length;
        } else {
          nextIndex =
            currentIndex === 0 ? accordions.length - 1 : currentIndex - 1;
        }

        accordions[nextIndex].focus();
      }

      // Enter or Space to toggle
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        togglePanel(e.target);
      }
    }
  });
}

// Initialize all enhancements when DOM is loaded
function initializeEnhancements() {
  initializeSearch();
  initializeScrollProgress();
  initializeAnimations();
  initializeKeyboardNavigation();

  // Add smooth scrolling to all internal links
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
}

// Enhanced accordion accessibility
document.addEventListener("DOMContentLoaded", function () {
  // Add ARIA labels and roles
  document
    .querySelectorAll(".enhanced-accordion")
    .forEach((accordion, index) => {
      accordion.setAttribute("id", `accordion-${index}`);
      accordion.setAttribute("role", "button");
      accordion.setAttribute("tabindex", "0");

      const panel = accordion.nextElementSibling;
      if (panel) {
        panel.setAttribute("id", `panel-${index}`);
        panel.setAttribute("role", "region");
        panel.setAttribute("aria-labelledby", `accordion-${index}`);
        accordion.setAttribute("aria-controls", `panel-${index}`);
      }
    });

  // Add focus indicators
  document
    .querySelectorAll(".enhanced-accordion, .action-btn, .copy-link-btn")
    .forEach((element) => {
      // element.addEventListener("focus", function () {
      //   this.style.outline = "3px solid var(--accordion-outline-color)";
      //   this.style.outlineOffset = "1px";
      // });

      element.addEventListener("blur", function () {
        this.style.outline = "";
        this.style.outlineOffset = "";
      });
    });
});

// Error handling for network requests
window.addEventListener("error", function (e) {
  if (e.target.tagName === "IMG") {
    console.error("Image failed to load:", e.target.src);
    showToast("فشل في تحميل بعض الصور", "warning");
  }
});

// Service Worker registration for offline support (optional)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker
      .register("/sw.js")
      .then(function (registration) {
        console.log("ServiceWorker registration successful");
      })
      .catch(function (err) {
        console.log("ServiceWorker registration failed");
      });
  });
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeEnhancements);
} else {
  initializeEnhancements();
}
