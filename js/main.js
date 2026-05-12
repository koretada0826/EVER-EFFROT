// ============ Loader ============
window.addEventListener("load", () => {
  setTimeout(() => {
    document.getElementById("loader")?.classList.add("hide");
  }, 1400);
});

// ============ Mascot frame cycling on each bounce ============
(() => {
  const mascot = document.querySelector(".hero-image[data-mascot-frames]");
  if (!mascot) return;
  const frames = mascot.dataset.mascotFrames.split(",").map(s => s.trim()).filter(Boolean);
  if (frames.length < 2) return;

  frames.forEach((src) => { const img = new Image(); img.src = src; });

  let i = 0;
  mascot.addEventListener("animationiteration", (e) => {
    if (e.animationName !== "mascotBounce") return;
    i = (i + 1) % frames.length;
    mascot.src = frames[i];
  });
})();

// ============ Scroll reveal ============
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) {
      e.target.classList.add("in-view");
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.15 });
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

// ============ Top button ============
const topBtn = document.getElementById("topBtn");
const topJumpHero = document.getElementById("topJumpHero");
window.addEventListener("scroll", () => {
  topBtn?.classList.toggle("show", window.scrollY > 400);
});
const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
topBtn?.addEventListener("click", scrollTop);
topJumpHero?.addEventListener("click", scrollTop);

// ============ Right-side Banner Carousel (true rotation) ============
(() => {
  const track = document.querySelector(".carousel-track");
  const viewport = document.querySelector(".carousel-viewport");
  const navUp = document.querySelector(".carousel-nav-up");
  const navDown = document.querySelector(".carousel-nav-down");
  if (!track || !viewport || !navUp || !navDown) return;

  const banners = Array.from(track.querySelectorAll(".banner"));
  if (banners.length === 0) return;

  const isMobile = () => window.matchMedia("(max-width: 800px)").matches;

  const N = banners.length;
  const halfN = Math.floor(N / 2);
  const slots = banners.map((_, i) => i - halfN);
  let stepPx = 96;
  let autoTimer = null;

  const computeStep = () => {
    const h = viewport.offsetHeight || 460;
    stepPx = Math.min(Math.max(h * 0.20, 86), 108);
  };

  const styleForSlot = (slot) => {
    const abs = Math.abs(slot);
    if (abs === 0)      return { s: 1.0,  o: 1,    z: 20 };
    if (abs === 1)      return { s: 0.86, o: 1,    z: 12 };
    if (abs === 2)      return { s: 0.72, o: 0.75, z: 6  };
    return { s: 0.6, o: 0, z: 0 };
  };

  const applySlot = (b, slot) => {
    const { s, o, z } = styleForSlot(slot);
    b.style.setProperty("--y", `${slot * stepPx}px`);
    b.style.setProperty("--s", s);
    b.style.setProperty("--o", o);
    b.style.setProperty("--z", z);
  };

  const renderAll = () => {
    if (isMobile()) {
      banners.forEach((b) => {
        b.style.removeProperty("--y");
        b.style.removeProperty("--s");
        b.style.removeProperty("--o");
        b.style.removeProperty("--z");
        b.style.transition = "";
        b.classList.remove("is-active");
      });
      return;
    }
    banners.forEach((b, i) => {
      applySlot(b, slots[i]);
      b.classList.toggle("is-active", slots[i] === 0);
    });
  };

  // dir=+1: 次へ(▼) → バナーは上へ流れ、上端のものが下から再出現
  // dir=-1: 前へ(▲) → バナーは下へ流れ、下端のものが上から再出現
  const go = (dir) => {
    if (isMobile()) return;

    const wraps = [];
    banners.forEach((b, i) => {
      const newSlot = slots[i] - dir;
      if (newSlot > halfN) {
        // 下にはみ出した → 上(off-screen)に瞬時に飛ばして、そこから現れる
        wraps.push({ b, i, teleportSlot: -halfN - 1, finalSlot: newSlot - N });
      } else if (newSlot < -halfN) {
        // 上にはみ出した → 下(off-screen)に飛ばして、そこから現れる
        wraps.push({ b, i, teleportSlot: halfN + 1, finalSlot: newSlot + N });
      } else {
        slots[i] = newSlot;
      }
    });

    if (wraps.length === 0) {
      renderAll();
      return;
    }

    // 1) ラップするバナーをtransition無しで反対側 off-screen に瞬間移動
    wraps.forEach(({ b, teleportSlot }) => {
      b.style.transition = "none";
      applySlot(b, teleportSlot);
    });

    // 2) 強制リフロー(瞬間移動を確定させる)
    track.getBoundingClientRect();

    // 3) slotを最終値に更新
    wraps.forEach(({ i, finalSlot }) => {
      slots[i] = finalSlot;
    });

    // 4) 次フレームでtransitionを戻して最終位置へアニメ
    requestAnimationFrame(() => {
      wraps.forEach(({ b }) => {
        b.style.transition = "";
      });
      renderAll();
    });
  };

  const startAuto = () => {
    stopAuto();
    if (isMobile()) return;
    autoTimer = setInterval(() => go(1), 1600);
  };
  const stopAuto = () => {
    if (autoTimer) clearInterval(autoTimer);
    autoTimer = null;
  };

  navUp.addEventListener("click", () => { go(-1); startAuto(); });
  navDown.addEventListener("click", () => { go(1); startAuto(); });
  viewport.addEventListener("mouseenter", stopAuto);
  viewport.addEventListener("mouseleave", startAuto);

  // 非アクティブバナークリックで中央へ回転
  banners.forEach((b, i) => {
    b.addEventListener("click", (e) => {
      if (isMobile()) return;
      const slot = slots[i];
      if (slot !== 0) {
        e.preventDefault();
        const direction = Math.sign(slot);
        const steps = Math.abs(slot);
        for (let k = 0; k < steps; k++) {
          setTimeout(() => go(direction), k * 90);
        }
        startAuto();
      }
    });
  });

  computeStep();
  renderAll();
  startAuto();
  window.addEventListener("resize", () => {
    computeStep();
    renderAll();
    startAuto();
  });
})();
