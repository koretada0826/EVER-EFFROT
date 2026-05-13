// ============ Loader (進捗 % + バー) ============
(() => {
  const loader = document.getElementById("loader");
  const percentEl = document.getElementById("loaderPercent");
  const barFill = document.getElementById("loaderBarFill");
  if (!loader || !percentEl || !barFill) return;

  const DURATION = 2200;
  const start = performance.now();
  let pageLoaded = false;

  window.addEventListener("load", () => { pageLoaded = true; });

  const tick = (now) => {
    const elapsed = now - start;
    const ratio = Math.min(elapsed / DURATION, 1);
    const pct = Math.floor(ratio * 100);
    percentEl.textContent = `${pct}%`;
    barFill.style.width = `${pct}%`;

    if (ratio >= 1 && pageLoaded) {
      percentEl.textContent = "100%";
      barFill.style.width = "100%";
      setTimeout(() => loader.classList.add("hide"), 200);
      return;
    }
    if (ratio >= 1 && !pageLoaded) {
      percentEl.textContent = "99%";
      barFill.style.width = "99%";
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})();

// ============ Mobile: 横スクロール根絶（runtime safety net） ============
// CSS で防げない要素を JS で実行時に潰す。viewport を超える要素を max-width: 100vw で抑え込む。
(() => {
  const isMobile = () => window.innerWidth <= 768;

  const enforceNoHorizontalScroll = () => {
    if (!isMobile()) return;
    const vw = document.documentElement.clientWidth;
    // ルートを viewport 幅に固定（width は付けず、max-width だけにすることでスクロール根絶＋幅誤計算回避）
    document.documentElement.style.overflowX = "hidden";
    document.documentElement.style.maxWidth = "100vw";
    document.body.style.overflowX = "hidden";
    document.body.style.maxWidth = "100vw";
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    // viewport 右端を超える要素を全て抑え込む
    // 除外: カルーセル内部・ドロワー・MENUボタン・主要セクション・装飾用 absolute 要素
    const skipSelector = [
      ".carousel-track", ".carousel-track *",
      ".banner", ".banner *",
      ".carousel-nav", ".carousel-nav *",
      ".carousel-fire",                          // inset:-14px で意図的に外にはみ出す装飾
      ".carousel-arrow",
      ".side-left", ".side-left *",
      ".side-right", ".side-right *",
      ".mobile-drawer-overlay",
      ".mobile-menu-btn", ".mobile-menu-btn *",
      ".info-panels", ".info-panels *",
      ".feature-panels", ".feature-panels *",
      ".news", ".news *",
      ".company-info", ".company-info *",
      ".philosophy", ".philosophy *",
      ".content-blocks", ".content-blocks *",
      ".recruit-cta", ".recruit-cta *",
      ".contact", ".contact *",
      ".site-footer", ".site-footer *",
      ".stage-bg", ".stage-bg *",
      ".embers", ".embers *", ".leaves", ".leaves *",
    ].map(s => `:not(${s})`).join("");
    document.querySelectorAll(`body *${skipSelector}`).forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.right > vw + 0.5 || r.left < -0.5) {
        el.style.maxWidth = "100vw";
        el.style.boxSizing = "border-box";
        const cs = getComputedStyle(el);
        if (cs.position !== "fixed" && cs.position !== "absolute") {
          el.style.overflowX = "hidden";
        }
        // デバッグ: コンソールに犯人を出力
        console.warn("[fix-h-scroll] clipped:", el, `right=${r.right} > vw=${vw}`);
      }
    });
  };

  // 初回 + ロード後 + リサイズで実行
  enforceNoHorizontalScroll();
  window.addEventListener("load", () => setTimeout(enforceNoHorizontalScroll, 100));
  window.addEventListener("resize", enforceNoHorizontalScroll);
  // カルーセル切替後にも検査（ただし observer ではなく interval で軽量に）
  setInterval(() => { if (isMobile()) enforceNoHorizontalScroll(); }, 2000);
})();

// ============ Mobile: セクション幅を JS で物理的に viewport 幅に固定 ============
// CSS の !important が何かに負けているケースに対する最終手段。
// 実 pixel 値で width を inline で焼き付ける。
(() => {
  const isMobile = () => window.innerWidth <= 768;
  const SECTION_SELECTORS = [
    ".info-panels",
    ".feature-panels",
    ".news",
    ".company-info",
    ".philosophy",
    ".content-blocks",
    ".recruit-cta",
    ".contact",
    ".site-footer",
  ];
  const INNER_SELECTORS = [
    ".panels-grid",
    ".feature-grid",
    ".features-grid",
    ".news-list",
    ".company-info dl",
    ".company-inner",
    ".philosophy-inner",
    ".grid",
    ".cta-buttons",
  ];
  // カード要素（金枠の info-panel など）にも直接 width を焼き付ける
  // 注意: ネスト要素（.message-quote など、カード内のさらに内側）は含めない。
  // 含めると親より広くなって overflow: hidden で片側だけクリップされ右寄りになる。
  const CARD_SELECTORS = [
    ".info-panel",
    ".feature-panel",
    ".card",
    ".block",
    ".news-list > li",
  ];

  const fixWidths = () => {
    if (!isMobile()) {
      // PC に戻ったら inline スタイルを除去
      SECTION_SELECTORS.concat(INNER_SELECTORS).concat(CARD_SELECTORS).forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
          el.style.removeProperty("width");
          el.style.removeProperty("max-width");
          el.style.removeProperty("min-width");
          el.style.removeProperty("margin-left");
          el.style.removeProperty("margin-right");
        });
      });
      return;
    }
    const vw = Math.round(window.innerWidth);
    const innerW = Math.max(0, vw - 28);
    console.log("[fix-widths] vw=", vw, "innerW=", innerW,
      "html.clientWidth=", document.documentElement.clientWidth,
      "body.clientWidth=", document.body.clientWidth);
    // 念のため html/body も明示的に viewport 幅へ
    document.documentElement.style.setProperty("width", `${vw}px`, "important");
    document.documentElement.style.setProperty("max-width", `${vw}px`, "important");
    document.body.style.setProperty("width", `${vw}px`, "important");
    document.body.style.setProperty("max-width", `${vw}px`, "important");
    document.body.style.setProperty("min-width", `${vw}px`, "important");
    document.body.style.setProperty("margin", "0", "important");
    document.body.style.setProperty("padding", "0", "important");
    // セクションは viewport 幅
    SECTION_SELECTORS.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        el.style.setProperty("width", `${vw}px`, "important");
        el.style.setProperty("max-width", `${vw}px`, "important");
        el.style.setProperty("min-width", `${vw}px`, "important");
        el.style.setProperty("margin-left", "0", "important");
        el.style.setProperty("margin-right", "0", "important");
        el.style.setProperty("padding-left", "14px", "important");
        el.style.setProperty("padding-right", "14px", "important");
        el.style.setProperty("box-sizing", "border-box", "important");
      });
    });
    // 内側コンテナは viewport - 28px、中央寄せ
    INNER_SELECTORS.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        el.style.setProperty("width", `${innerW}px`, "important");
        el.style.setProperty("max-width", `${innerW}px`, "important");
        el.style.setProperty("min-width", "0", "important");
        el.style.setProperty("margin-left", "auto", "important");
        el.style.setProperty("margin-right", "auto", "important");
        el.style.setProperty("box-sizing", "border-box", "important");
      });
    });
    // カード（金枠の info-panel など）も innerW で固定して左右の余白を物理的に対称化
    CARD_SELECTORS.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        el.style.setProperty("width", `${innerW}px`, "important");
        el.style.setProperty("max-width", `${innerW}px`, "important");
        el.style.setProperty("min-width", "0", "important");
        el.style.setProperty("margin-left", "auto", "important");
        el.style.setProperty("margin-right", "auto", "important");
        el.style.setProperty("box-sizing", "border-box", "important");
      });
    });
  };

  fixWidths();
  window.addEventListener("load", () => setTimeout(fixWidths, 50));
  window.addEventListener("resize", fixWidths);
})();

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

  const isMobile = () => window.matchMedia("(max-width: 768px)").matches;

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

// ============ Mobile: ドロワーメニュー（MENUボタンで開閉） ============
(() => {
  const mq = window.matchMedia("(max-width: 768px)");
  const btn = document.getElementById("mobileMenuBtn");
  const drawer = document.getElementById("sideLeftDrawer");
  const overlay = document.getElementById("mobileDrawerOverlay");
  const closeBtn = document.getElementById("mobileDrawerClose");
  if (!btn || !drawer || !overlay) return;

  const open = () => {
    drawer.classList.add("is-open");
    overlay.classList.add("is-open");
    document.body.style.overflow = "hidden";  // 背景スクロール固定
  };
  const close = () => {
    drawer.classList.remove("is-open");
    overlay.classList.remove("is-open");
    document.body.style.overflow = "";
  };

  btn.addEventListener("click", open);
  overlay.addEventListener("click", close);
  closeBtn?.addEventListener("click", close);

  // ドロワー内のリンクをクリックしたら閉じる
  drawer.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      if (mq.matches) close();
    });
  });

  // PCに戻ったら強制クローズ
  mq.addEventListener("change", (e) => { if (!e.matches) close(); });
})();

// ============ Mobile: 無限ループ 横スクロール カルーセル + マスコット bounce 同期 ============
// 原本バナーをクローンしてトラック長を2倍化、末尾到達時に瞬時ジャンプで繋ぎ目を隠す。
(() => {
  const mq = window.matchMedia("(max-width: 768px)");
  const track = document.querySelector(".carousel-track");
  const viewport = document.querySelector(".carousel-viewport");
  const navUp = document.querySelector(".carousel-nav-up");
  const navDown = document.querySelector(".carousel-nav-down");
  const mascot = document.querySelector(".hero-image[data-mascot-frames]");
  if (!track || !viewport || !navUp || !navDown) return;

  const originals = Array.from(track.querySelectorAll(".banner"));
  if (originals.length === 0) return;
  const N = originals.length;

  let clonedDone = false;
  const setupClones = () => {
    if (clonedDone) return;
    originals.forEach((b) => {
      const c = b.cloneNode(true);
      c.classList.add("banner-clone");
      c.setAttribute("aria-hidden", "true");
      track.appendChild(c);
    });
    clonedDone = true;
  };

  let visualIdx = 0;       // 拡張トラック内のインデックス (0..2N-1)
  let paused = false;
  let snapTimer = null;
  const SCROLL_DURATION = 700; // smooth scroll の所要時間想定

  const getBanners = () => Array.from(track.querySelectorAll(".banner"));

  const scrollToVisualIdx = (idx, behavior = "smooth") => {
    const banners = getBanners();
    const b = banners[idx];
    if (!b) return;
    const left = b.offsetLeft - (track.clientWidth - b.offsetWidth) / 2;
    track.scrollTo({ left: Math.max(0, left), behavior });
  };

  const advance = () => {
    if (paused) return;
    visualIdx++;
    scrollToVisualIdx(visualIdx, "smooth");
    // クローンエリアに入ったら、smooth scroll 完了後に瞬時に対応する元位置へワープ
    if (visualIdx >= N) {
      clearTimeout(snapTimer);
      snapTimer = setTimeout(() => {
        visualIdx = visualIdx - N;
        scrollToVisualIdx(visualIdx, "instant");
      }, SCROLL_DURATION);
    }
  };

  const reverse = () => {
    if (paused) return;
    if (visualIdx === 0) {
      // 先頭にいる時は、瞬時にクローン位置 N（視覚的に同じ banner 0）にワープしてから戻る
      visualIdx = N;
      scrollToVisualIdx(visualIdx, "instant");
      requestAnimationFrame(() => {
        visualIdx--;
        scrollToVisualIdx(visualIdx, "smooth");
      });
    } else {
      visualIdx--;
      scrollToVisualIdx(visualIdx, "smooth");
    }
  };

  // マスコット bounce (1.6s) のイテレーションで進行 → 自動的にずっと回る
  if (mascot) {
    mascot.addEventListener("animationiteration", (e) => {
      if (e.animationName !== "mascotBounce") return;
      if (!mq.matches) return;
      if (paused) return;
      advance();
    });
  }
  // マスコット非依存のフォールバック
  let fallbackTimer = null;
  const startFallback = () => {
    stopFallback();
    if (!mq.matches) return;
    fallbackTimer = setInterval(() => { if (!paused) advance(); }, 1600);
  };
  const stopFallback = () => {
    if (fallbackTimer) clearInterval(fallbackTimer);
    fallbackTimer = null;
  };

  navUp.addEventListener("click", (e) => {
    if (!mq.matches) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    reverse();
  }, true);
  navDown.addEventListener("click", (e) => {
    if (!mq.matches) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    advance();
  }, true);

  // タッチ/スワイプ中は一時停止
  track.addEventListener("touchstart", () => { paused = true; }, { passive: true });
  track.addEventListener("touchend", () => {
    setTimeout(() => { paused = false; }, 400);
  }, { passive: true });

  const sync = () => {
    if (mq.matches) {
      setupClones();
      visualIdx = 0;
      scrollToVisualIdx(0, "instant");
      startFallback();
    } else {
      stopFallback();
    }
  };
  sync();
  mq.addEventListener("change", sync);
})();
