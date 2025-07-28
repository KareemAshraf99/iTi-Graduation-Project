class StoryMap {
  constructor() {
    this.currentSection = 0;
    this.sections = [];
    this.isScrolling = false;
    this.touchStartY = 0;
    this.touchEndY = 0;

    this.init();
  }

  init() {
    this.sections = document.querySelectorAll(".story-section");
    this.setupNavigation();
    this.setupScrollHandling();
    this.setupProgressBar();
    this.setupAnimations();
    this.showSection(0);

    setTimeout(() => {
      const loadingOverlay = document.querySelector(".loading-overlay");
      if (loadingOverlay) {
        loadingOverlay.style.opacity = "0";
        setTimeout(() => {
          loadingOverlay.style.display = "none";
        }, 500);
      }
    }, 2000);
  }

  setupNavigation() {
    const navDots = document.querySelectorAll(".nav-dot");
    navDots.forEach((dot, index) => {
      dot.addEventListener("click", () => {
        this.goToSection(index);
      });
    });
  }

  setupScrollHandling() {
    let scrollTimeout;

    document.addEventListener(
      "wheel",
      (e) => {
        const activeSection = this.sections[this.currentSection];
        if (this.isScrolling) return;

        if (activeSection.classList.contains("scroll-free")) {
          const scrollable =
            activeSection.scrollHeight > activeSection.clientHeight;
          if (!scrollable) {
            if (e.deltaY > 0) {
              this.nextSection();
            } else {
              this.prevSection();
            }
            return;
          }
        }

        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          if (e.deltaY > 0) {
            this.nextSection();
          } else {
            this.prevSection();
          }
        }, 50);
      },
      { passive: true }
    );

    document.addEventListener(
      "touchstart",
      (e) => {
        this.touchStartY = e.touches[0].clientY;
      },
      { passive: true }
    );

    document.addEventListener(
      "touchend",
      (e) => {
        if (this.isScrolling) return;

        this.touchEndY = e.changedTouches[0].clientY;
        const deltaY = this.touchStartY - this.touchEndY;

        const activeSection = this.sections[this.currentSection];
        if (
          !activeSection.classList.contains("scroll-section") &&
          Math.abs(deltaY) > 50
        ) {
          if (deltaY > 0) {
            this.nextSection();
          } else {
            this.prevSection();
          }
        }
      },
      { passive: true }
    );

    document.addEventListener("keydown", (e) => {
      if (this.isScrolling) return;

      switch (e.key) {
        case "ArrowDown":
        case " ":
          e.preventDefault();
          this.nextSection();
          break;
        case "ArrowUp":
          e.preventDefault();
          this.prevSection();
          break;
        case "Home":
          e.preventDefault();
          this.goToSection(0);
          break;
        case "End":
          e.preventDefault();
          this.goToSection(this.sections.length - 1);
          break;
      }
    });
  }

  setupProgressBar() {
    this.progressFill = document.querySelector(".progress-fill");
    this.progressText = document.querySelector(".progress-text");
  }

  setupAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    }, observerOptions);

    document
      .querySelectorAll(".fade-in, .slide-in-left, .slide-in-right")
      .forEach((el) => {
        observer.observe(el);
      });
  }

  showSection(index) {
    if (index < 0 || index >= this.sections.length) return;

    this.isScrolling = true;

    this.sections.forEach((section) => {
      section.classList.remove("active");
    });

    this.sections[index].classList.add("active");

    this.updateNavigation(index);

    this.updateProgress(index);

    this.currentSection = index;

    setTimeout(() => {
      const activeSection = this.sections[index];
      const animatedElements = activeSection.querySelectorAll(
        ".fade-in, .slide-in-left, .slide-in-right"
      );
      animatedElements.forEach((el, i) => {
        setTimeout(() => {
          el.classList.add("visible");
        }, i * 200);
      });
    }, 300);

    setTimeout(() => {
      this.isScrolling = false;
    }, 800);
  }

  updateNavigation(index) {
    const navDots = document.querySelectorAll(".nav-dot");
    navDots.forEach((dot, i) => {
      if (i === index) {
        dot.classList.add("active");
      } else {
        dot.classList.remove("active");
      }
    });
  }

  updateProgress(index) {
    const progress = ((index + 1) / this.sections.length) * 100;
    if (this.progressFill) {
      this.progressFill.style.width = `${progress}%`;
    }
    if (this.progressText) {
      this.progressText.textContent = `${index + 1} من ${this.sections.length}`;
    }
  }

  nextSection() {
    if (this.currentSection < this.sections.length - 1) {
      this.goToSection(this.currentSection + 1);
    }
  }

  prevSection() {
    if (this.currentSection > 0) {
      this.goToSection(this.currentSection - 1);
    }
  }

  goToSection(index) {
    if (index !== this.currentSection && !this.isScrolling) {
      this.showSection(index);
    }
  }
}

class ImageModal {
  constructor() {
    this.modal = null;
    this.modalImg = null;
    this.modalCaption = null;
    this.createModal();
    this.setupEventListeners();
  }

  createModal() {
    this.modal = document.createElement("div");
    this.modal.className = "image-modal";
    this.modal.style.cssText = `
      display: none;
      position: fixed;
      z-index: 10000;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.9);
      backdrop-filter: blur(5px);
    `;

    const modalContent = document.createElement("div");
    modalContent.style.cssText = `
      position: relative;
      margin: auto;
      padding: 20px;
      width: 90%;
      max-width: 800px;
      top: 50%;
      transform: translateY(-50%);
      text-align: center;
    `;

    this.modalImg = document.createElement("img");
    this.modalImg.style.cssText = `
      max-width: 100%;
      max-height: 70vh;
      border-radius: 10px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
    `;

    this.modalCaption = document.createElement("div");
    this.modalCaption.style.cssText = `
      color: white;
      font-size: 1.2rem;
      margin-top: 20px;
      padding: 10px;
      background: rgba(0, 0, 0, 0.7);
      border-radius: 5px;
      font-family: 'Amiri', serif;
    `;

    const closeBtn = document.createElement("span");
    closeBtn.innerHTML = "&times;";
    closeBtn.style.cssText = `
      position: absolute;
      top: 15px;
      right: 35px;
      color: #f1f1f1;
      font-size: 40px;
      font-weight: bold;
      cursor: pointer;
      transition: color 0.3s ease;
    `;

    closeBtn.addEventListener("click", () => this.closeModal());
    closeBtn.addEventListener(
      "mouseenter",
      () => (closeBtn.style.color = "#DAA520")
    );
    closeBtn.addEventListener(
      "mouseleave",
      () => (closeBtn.style.color = "#f1f1f1")
    );

    modalContent.appendChild(closeBtn);
    modalContent.appendChild(this.modalImg);
    modalContent.appendChild(this.modalCaption);
    this.modal.appendChild(modalContent);
    document.body.appendChild(this.modal);
  }

  setupEventListeners() {
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) {
        this.closeModal();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.modal.style.display === "block") {
        this.closeModal();
      }
    });

    document.addEventListener("click", (e) => {
      if (e.target.matches(".gallery-item img, .story-image")) {
        this.openModal(e.target);
      }
    });
  }

  openModal(img) {
    this.modal.style.display = "block";
    this.modalImg.src = img.src;
    this.modalImg.alt = img.alt;

    let caption = img.alt;
    const galleryCaption = img.parentElement.querySelector(
      ".gallery-caption, .image-overlay"
    );
    if (galleryCaption) {
      caption = galleryCaption.textContent.trim();
    }

    this.modalCaption.textContent = caption;

    this.modal.style.opacity = "0";
    setTimeout(() => {
      this.modal.style.transition = "opacity 0.3s ease";
      this.modal.style.opacity = "1";
    }, 10);
  }

  closeModal() {
    this.modal.style.opacity = "0";
    setTimeout(() => {
      this.modal.style.display = "none";
    }, 300);
  }
}

class ParallaxController {
  constructor() {
    this.parallaxElements = document.querySelectorAll(".parallax-bg");
    this.setupParallax();
  }

  setupParallax() {
    window.addEventListener("scroll", () => {
      const scrolled = window.pageYOffset;
      const rate = scrolled * -0.5;

      this.parallaxElements.forEach((element) => {
        element.style.transform = `translateY(${rate}px)`;
      });
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const storyMap = new StoryMap();

  const imageModal = new ImageModal();

  const scrollIndicator = document.querySelector(".scroll-indicator");
  if (scrollIndicator) {
    scrollIndicator.addEventListener("click", () => {
      storyMap.nextSection();
    });
  }

  document.body.style.transition = "all 0.3s ease";

  const images = document.querySelectorAll("img");
  images.forEach((img) => {
    const imageLoader = new Image();
    imageLoader.src = img.src;
  });
});
