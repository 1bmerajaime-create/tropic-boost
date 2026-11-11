(() => {
  if (document.documentElement.classList.contains("is-loading")) {
    const percentage = document.getElementById("loader-percentage");
    const started = performance.now();
    let completed = false;
    let previous = -1;
    const countUp = (now) => {
      if (completed || !document.documentElement.classList.contains("is-loading")) return;
      const elapsed = now - started;
      // Follow the ingredient sequence, reserving completion for essential assets.
      const value = Math.floor(elapsed <= 6200 ? elapsed / 6200 * 95 :
        95 + 4 * (1 - Math.exp(-(elapsed - 6200) / 1200)));
      if (percentage && value !== previous) percentage.textContent = `${value}%`;
      previous = value;
      requestAnimationFrame(countUp);
    };
    requestAnimationFrame(countUp);
    // Let the full ingredient sequence play while essential page assets load.
    const sequence = new Promise((resolve) => setTimeout(resolve, 6200));
    const images = [...document.querySelectorAll(".hero-bg, .header-logo")]
      .map((image) => image.decode().catch(() => {}));
    const fonts = document.fonts?.ready || Promise.resolve();
    Promise.all([sequence, fonts, ...images]).then(() => {
      completed = true;
      if (percentage) percentage.textContent = "100%";
      // Give the final value a moment to register before the overlay fades.
      setTimeout(() => window.dispatchEvent(new Event("tropic:ready")), 220);
    });
  } else {
    document.getElementById("site-loader")?.remove();
  }

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

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const clamp = (value) => Math.max(0, Math.min(1, value));

  // Reveal individual content blocks without moving sticky-section ancestors.
  const revealItems = [...document.querySelectorAll(
    ".hero-bg, .hero-panel > *, .about-copy, .about-cards > li, " +
    ".section-head > *, .promo-copy > *, .promo-photo, " +
    ".cta-band-inner > *, .footer-nav, .footer-copy"
  )];
  revealItems.forEach((item, index) => {
    item.dataset.scrollReveal = String(index % 2 ? -1 : 1);
  });
  let revealFrame = 0;
  const updateReveals = () => {
    revealFrame = 0;
    const loading = document.documentElement.classList.contains("is-loading");
    const positions = revealItems.map((item) => item.getBoundingClientRect().top);
    revealItems.forEach((item, index) => {
      const progress = reducedMotion.matches ? 1 : loading ? 0 :
        clamp((innerHeight * 0.94 - positions[index]) / Math.min(230, innerHeight * 0.3));
      const eased = 1 - Math.pow(1 - progress, 3);
      item.style.setProperty("--scroll-opacity", String(clamp(progress * 1.5)));
      item.style.setProperty("--scroll-shift", `${(1 - eased) * Number(item.dataset.scrollReveal) * 60}px`);
    });
  };
  const queueReveals = () => {
    if (!revealFrame) revealFrame = requestAnimationFrame(updateReveals);
  };
  window.addEventListener("scroll", queueReveals, { passive: true });
  window.addEventListener("resize", queueReveals);
  window.addEventListener("tropic:ready", queueReveals);
  reducedMotion.addEventListener("change", queueReveals);
  // The loader's fail-safe also removes is-loading if an asset stalls.
  new MutationObserver(queueReveals).observe(document.documentElement, {
    attributes: true, attributeFilter: ["class"]
  });
  updateReveals();

  // Keep the numbered cards stacked while the next event moves into view.
  const eventCards = [...document.querySelectorAll(".event-stack .event-card")];
  const staticCards = window.matchMedia("(max-height: 650px), (prefers-reduced-motion: reduce)");
  let stackFrame = 0;
  const updateStack = () => {
    stackFrame = 0;
    const boxes = eventCards.map((card) => card.getBoundingClientRect());
    const progress = eventCards.map((card, index) => {
      if (staticCards.matches || index === eventCards.length - 1) return 0;
      const top = parseFloat(getComputedStyle(card).top);
      return Math.max(0, Math.min(1, 1 - (boxes[index + 1].top - top) / (boxes[index].height * 0.9)));
    });
    eventCards.forEach((card, index) => {
      card.style.setProperty("--stack-scale", String(1 - progress[index] * 0.035));
      card.style.setProperty("--stack-brightness", String(1 - progress[index] * 0.12));
    });
  };
  const queueStack = () => {
    if (!stackFrame) stackFrame = requestAnimationFrame(updateStack);
  };
  if (eventCards.length) {
    window.addEventListener("scroll", queueStack, { passive: true });
    window.addEventListener("resize", queueStack);
    staticCards.addEventListener("change", queueStack);
    window.addEventListener("tropic:ready", queueStack);
    queueStack();
  }

  // Bring each bowl in from a screen edge, into its unchanged place in the row.
  const bowlRoot = document.querySelector("[data-bowl-scroll]");
  if (bowlRoot) {
    const stage = bowlRoot.querySelector(".bowl-stage");
    const track = bowlRoot.querySelector(".bowl-track");
    const cards = [...bowlRoot.querySelectorAll(".bowl-card")];
    let motion = null;
    let bowlFrame = 0;

    const updateBowls = () => {
      bowlFrame = 0;
      if (!motion) return;
      const box = bowlRoot.getBoundingClientRect();
      const progress = clamp((motion.top - box.top) / motion.travel);
      const arrival = clamp((innerHeight * 0.9 - box.top) / (innerHeight * 0.9 - motion.top));
      track.style.setProperty("--bowl-track-shift", `${-motion.overflow * progress}px`);
      cards.forEach((card, index) => {
        const entry = index === 0 ? arrival :
          clamp((progress * (cards.length - 1) - (index - 1)) / 0.8);
        const eased = 1 - Math.pow(1 - entry, 3);
        const direction = index === 0 ? -1 : 1;
        card.style.setProperty("--bowl-shift", `${(1 - eased) * motion.distance * direction}px`);
        card.style.setProperty("--bowl-opacity", String(clamp(entry * 2)));
      });
    };
    const queueBowls = () => {
      if (!bowlFrame) bowlFrame = requestAnimationFrame(updateBowls);
    };
    const configureBowls = () => {
      motion = null;
      bowlRoot.classList.remove("bowl-motion");
      bowlRoot.style.height = "";
      track.style.removeProperty("--bowl-track-shift");
      cards.forEach((card) => {
        card.style.removeProperty("--bowl-shift");
        card.style.removeProperty("--bowl-opacity");
      });
      if (reducedMotion.matches || innerHeight <= 650) return;
      bowlRoot.classList.add("bowl-motion");
      const top = parseFloat(getComputedStyle(stage).top);
      const height = stage.offsetHeight;
      if (height > innerHeight - top - 20) {
        bowlRoot.classList.remove("bowl-motion");
        return;
      }
      stage.scrollLeft = 0;
      const gap = parseFloat(getComputedStyle(track).columnGap);
      const rowWidth = cards.reduce((width, card) => width + card.getBoundingClientRect().width, 0)
        + gap * (cards.length - 1);
      const overflow = Math.max(0, rowWidth - track.getBoundingClientRect().width);
      const travel = Math.round(Math.max(innerHeight * 1.35, overflow));
      bowlRoot.style.height = `${height + travel}px`;
      motion = { top, travel, overflow, distance: innerWidth + 40 };
      updateBowls();
    };
    track.addEventListener("keydown", (event) => {
      if (!motion || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const start = bowlRoot.getBoundingClientRect().top + scrollY - motion.top;
      const progress = clamp((scrollY - start) / motion.travel);
      const next = event.key === "Home" ? 0 : event.key === "End" ? 1 :
        clamp(progress + (event.key === "ArrowRight" ? 0.5 : -0.5));
      window.scrollTo({ top: start + next * motion.travel, behavior: "smooth" });
    });
    window.addEventListener("scroll", queueBowls, { passive: true });
    window.addEventListener("resize", configureBowls);
    window.addEventListener("languagechange", configureBowls);
    window.addEventListener("tropic:ready", configureBowls);
    reducedMotion.addEventListener("change", configureBowls);
    document.fonts?.ready.then(configureBowls);
    configureBowls();
  }
})();
