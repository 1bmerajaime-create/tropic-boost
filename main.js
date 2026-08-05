(() => {
  const toggle = document.querySelector(".nav-toggle");
  const mobileNav = document.getElementById("mobile-nav");

  const closeMobile = () => {
    mobileNav.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  };

  toggle?.addEventListener("click", () => {
    const open = mobileNav.hidden;
    mobileNav.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  });

  mobileNav?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMobile);
  });

  const reveal = (el) => el.classList.add("is-in");
  const reveals = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            reveal(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach(reveal);
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.querySelectorAll(".hero .reveal").forEach(reveal);
    });
  });

  // Bowl cards carousel
  document.querySelectorAll("[data-carousel]").forEach((root) => {
    const track = root.querySelector("[data-carousel-track]");
    const prev = root.querySelector("[data-carousel-prev]");
    const next = root.querySelector("[data-carousel-next]");
    if (!track) return;

    const cardStep = () => {
      const card = track.querySelector(".bowl-card");
      if (!card) return track.clientWidth * 0.8;
      const styles = getComputedStyle(track);
      const gap = parseFloat(styles.columnGap || styles.gap) || 16;
      return card.getBoundingClientRect().width + gap;
    };

    const syncButtons = () => {
      const max = track.scrollWidth - track.clientWidth - 2;
      if (prev) prev.disabled = track.scrollLeft <= 2;
      if (next) next.disabled = track.scrollLeft >= max;
    };

    prev?.addEventListener("click", () => {
      track.scrollBy({ left: -cardStep(), behavior: "smooth" });
    });
    next?.addEventListener("click", () => {
      track.scrollBy({ left: cardStep(), behavior: "smooth" });
    });

    track.addEventListener("scroll", syncButtons, { passive: true });
    window.addEventListener("resize", syncButtons);
    syncButtons();
  });
})();
