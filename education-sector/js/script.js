
  const btn = document.getElementById("toTopBtn");

  window.onscroll = function () {
    if (window.scrollY > 300) {
      btn.style.display = "block";
    } else {
      btn.style.display = "none";
    }
  };

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }


