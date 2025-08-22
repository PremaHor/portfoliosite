// script.js — čistá verze (opraveno)

document.addEventListener("DOMContentLoaded", () => {
  // =========================
  // 1) Custom cursor (safe)
  // =========================
  (function initCustomCursor() {
    const prefersReduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const noHover =
      window.matchMedia("(hover: none)").matches ||
      window.matchMedia("(pointer: coarse)").matches;

    const cursor = document.getElementById("cursor");
    const follower = document.getElementById("cursor-follower");

    // Pokud není vhodné prostředí nebo prvky chybí, kurzor nespouštěj
    if (prefersReduce || noHover || !cursor || !follower) {
      document.documentElement.classList.add("no-custom-cursor");
      return;
    }

    // Zapni "neviditelný" systémový kurzor teprve teď
    document.body.classList.add("has-custom-cursor");

    let mouseX = 0,
      mouseY = 0,
      fx = 0,
      fy = 0;

    const moveCursor = (x, y) => {
      cursor.style.left = x + "px";
      cursor.style.top = y + "px";
    };
    const moveFollower = () => {
      fx += (mouseX - fx) * 0.12;
      fy += (mouseY - fy) * 0.12;
      follower.style.left = fx + "px";
      follower.style.top = fy + "px";
      requestAnimationFrame(moveFollower);
    };

    // ======== KONTRAST KURZORU PODLE PODKLADU ========
    function parseRGB(str) {
      if (!str) return null;
      if (str.startsWith("rgb")) {
        const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
        if (!m) return null;
        return { r: +m[1], g: +m[2], b: +m[3] };
      }
      if (str[0] === "#") {
        let hex = str.slice(1);
        if (hex.length === 3)
          hex = hex
            .split("")
            .map((c) => c + c)
            .join("");
        if (hex.length !== 6) return null;
        return {
          r: parseInt(hex.slice(0, 2), 16),
          g: parseInt(hex.slice(2, 4), 16),
          b: parseInt(hex.slice(4, 6), 16),
        };
      }
      return null;
    }

    function relativeLuminance({ r, g, b }) {
      const srgb = [r, g, b].map((v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
    }

    function getEffectiveBgColor(el) {
      let node = el;
      while (node && node !== document.documentElement) {
        const cs = getComputedStyle(node);

        // Ruční značky (priorita)
        if (node.classList?.contains("cursor-dark"))
          return { r: 0, g: 0, b: 0 };
        if (node.classList?.contains("cursor-light"))
          return { r: 255, g: 255, b: 255 };

        const bg = cs.backgroundColor;
        // ignoruj 100% transparentní
        if (bg && !/rgba?\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\s*\)/i.test(bg)) {
          const rgb = parseRGB(bg);
          if (rgb) return rgb;
        }
        node = node.parentElement;
      }
      // fallback na barvu body
      const bodyBg =
        getComputedStyle(document.body).backgroundColor || "#ffffff";
      return parseRGB(bodyBg) || { r: 255, g: 255, b: 255 };
    }

    let pendingContrastCheck = false;
    const CONTRAST_THRESHOLD = 0.5; // < 0.5 = tmavé

    function updateCursorContrast() {
      pendingContrastCheck = false;
      const el = document.elementFromPoint(mouseX, mouseY);
      const rgb = getEffectiveBgColor(el || document.body);
      const lum = relativeLuminance(rgb);
      const isDark = lum < CONTRAST_THRESHOLD;
      cursor.classList.toggle("on-dark", isDark);
      follower.classList.toggle("on-dark", isDark);
    }
    // ======== /KONTRAST KURZORU ========

    // Jeden sjednocený mousemove handler
    document.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      moveCursor(mouseX, mouseY);

      if (!pendingContrastCheck) {
        pendingContrastCheck = true;
        requestAnimationFrame(updateCursorContrast);
      }
    });

    // Hover/Click stavy
    const hoverEls = document.querySelectorAll(
      "a, button, .portfolio-item, .cta-button, .nav-links a, .g-item"
    );
    hoverEls.forEach((el) => {
      el.addEventListener("mouseenter", () => {
        cursor.classList.add("hover");
        follower.classList.add("hover");
      });
      el.addEventListener("mouseleave", () => {
        cursor.classList.remove("hover");
        follower.classList.remove("hover");
      });
    });
    document.addEventListener("mousedown", () => {
      cursor.classList.add("click");
      follower.classList.add("click");
    });
    document.addEventListener("mouseup", () => {
      cursor.classList.remove("click");
      follower.classList.remove("click");
    });

    // Viditelnost
    document.addEventListener("mouseleave", () => {
      cursor.style.opacity = "0";
      follower.style.opacity = "0";
    });
    document.addEventListener("mouseenter", () => {
      cursor.style.opacity = "1";
      follower.style.opacity = "1";
    });

    moveFollower();
  })();

  // =========================
  // 2) Desktop dropdown
  // =========================
  (function initDropdown() {
    const wrapper = document.getElementById("dropdown");
    const toggle = document.getElementById("dropdownToggle");
    const menu = document.getElementById("dropdownMenu");
    if (!wrapper || !toggle || !menu) return;

    const open = () => {
      wrapper.classList.add("open");
      toggle.setAttribute("aria-expanded", "true");
    };
    const close = () => {
      wrapper.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    };
    const toggleFn = () =>
      wrapper.classList.contains("open") ? close() : open();

    toggle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleFn();
    });
    if (window.matchMedia("(hover: hover)").matches) {
      wrapper.addEventListener("mouseenter", open);
      wrapper.addEventListener("mouseleave", close);
    }
    document.addEventListener("click", (e) => {
      if (!wrapper.contains(e.target)) close();
    });
    wrapper.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        close();
        toggle.focus();
      }
    });
  })();

  // =========================
  // 3) Mobile menu
  // =========================
  (function initMobileMenu() {
    const btn = document.getElementById("mobileMenu");
    const panel = document.getElementById("navLinksMobile");
    if (!btn || !panel) return;

    const open = () => {
      btn.classList.add("active");
      btn.setAttribute("aria-expanded", "true");
      panel.hidden = false;
      panel.classList.add("show");
    };
    const close = () => {
      btn.classList.remove("active");
      btn.setAttribute("aria-expanded", "false");
      panel.classList.remove("show");
      setTimeout(() => {
        panel.hidden = true;
      }, 200);
    };
    const toggle = () => (panel.classList.contains("show") ? close() : open());

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggle();
    });
    document.addEventListener("click", (e) => {
      if (
        panel.classList.contains("show") &&
        !panel.contains(e.target) &&
        !btn.contains(e.target)
      ) {
        close();
      }
    });
    panel
      .querySelectorAll("a")
      .forEach((a) => a.addEventListener("click", close));
  })();

  // =========================
  // 4) Smooth anchor + cross-page
  // =========================
  (function anchors() {
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        const target = id && document.querySelector(id);
        if (!id || id === "#") return;
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          e.preventDefault();
          window.location.href = "index.html" + id;
        }
      });
    });

    if (window.location.hash) {
      const t = document.querySelector(window.location.hash);
      if (t)
        setTimeout(
          () => t.scrollIntoView({ behavior: "smooth", block: "start" }),
          200
        );
    }
  })();

  // =========================
  // 5) Swipe LIGHTBOX
  // =========================
  (function initLightbox() {
    const lightbox = document.querySelector(".lightbox");
    if (!lightbox) return;

    const track = lightbox.querySelector(".lb-track");
    const btnPrev = lightbox.querySelector(".lb-prev");
    const btnNext = lightbox.querySelector(".lb-next");
    const btnClose = lightbox.querySelector(".lb-close");

    let items = []; // {src, caption}
    let current = 0;
    let locked = false;

    const clamp = (i) => (i + items.length) % items.length;

    function buildFrom(gallery) {
      const figs = [...gallery.querySelectorAll(".g-item")];
      items = figs.map((fig) => {
        const img = fig.querySelector("img");
        return {
          src: img.currentSrc || img.src,
          caption: fig.dataset.caption || img.alt || "",
        };
      });
      track.innerHTML = items
        .map(
          (it, i) => `
            <div class="lb-slide" data-index="${i}">
              <img src="${it.src}" alt="${(it.caption || "").replace(
            /"/g,
            "&quot;"
          )}" loading="eager" decoding="async" />
              <div class="lb-caption">${it.caption || ""}</div>
            </div>
          `
        )
        .join("");
    }

    function render(i, { animate = true } = {}) {
      if (!items.length) return;
      current = clamp(i);
      const x = -current * 100;
      if (!animate) track.style.transition = "none";
      track.style.transform = `translateX(${x}%)`;
      if (!animate) {
        track.getBoundingClientRect(); // reflow
        track.style.transition = "";
      }
    }

    function open(gallery, startIndex) {
      buildFrom(gallery);
      lightbox.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      render(startIndex, { animate: false });
      btnClose && btnClose.focus();
    }

    function close() {
      lightbox.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }

    function step(d) {
      if (locked || !items.length) return;
      locked = true;
      render(current + d);
      setTimeout(() => (locked = false), 350);
    }

    // Open from any .gallery
    document.addEventListener(
      "click",
      (e) => {
        const fig = e.target.closest(".g-item");
        if (!fig) return;
        const gallery = fig.closest(".gallery");
        if (!gallery) return;

        const imgs = [...gallery.querySelectorAll(".g-item img")].map(
          (i) => i.currentSrc || i.src
        );
        const clicked = fig.querySelector("img");
        const src = clicked.currentSrc || clicked.src;
        const idx = Math.max(0, imgs.indexOf(src));

        open(gallery, idx);
      },
      { passive: true }
    );

    // Controls
    btnPrev?.addEventListener("click", () => step(-1));
    btnNext?.addEventListener("click", () => step(1));
    btnClose?.addEventListener("click", close);

    // Backdrop close
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) close();
    });

    // Keyboard
    window.addEventListener("keydown", (e) => {
      if (lightbox.getAttribute("aria-hidden") === "true") return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    });

    // Touch swipe
    let startX = 0,
      touching = false;
    track.addEventListener(
      "touchstart",
      (e) => {
        if (lightbox.getAttribute("aria-hidden") === "true") return;
        touching = true;
        startX = e.touches[0].clientX;
      },
      { passive: true }
    );
    track.addEventListener(
      "touchend",
      (e) => {
        if (!touching) return;
        touching = false;
        const dx = e.changedTouches[0].clientX - startX;
        const TH = 50;
        if (Math.abs(dx) > TH) step(dx > 0 ? -1 : 1);
      },
      { passive: true }
    );
  })();
});
