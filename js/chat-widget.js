/* ==========================================================
 * エバーにゃんAI受付 - Chat Widget
 * Pure HTML/CSS/JS, no APIs, FAQ scoring chatbot.
 *
 * 設置: <link rel="stylesheet" href="css/chat-widget.css">
 *        <script src="js/chat-widget.js" defer></script>
 *
 * 公開API: window.EvChat.open() / close() / setLinks({...})
 * ========================================================== */

(() => {
  // ---------- 設定 ----------
  const CHAT_LINKS = {
    recruit: "#entry",
    contact: "#contact",
    company: "#company",
    philosophy: "#philosophy",
    line: "#line",
  };

  // FAQ データ。keywords/synonyms に当たればスコア加点。
  const FAQ_DATA = [
    {
      id: "未経験応募",
      keywords: ["未経験", "初心者", "経験なし", "営業未経験", "応募できる", "応募可能", "新人", "ビギナー"],
      answer:
        "未経験の方でも応募可能ですニャン！\n営業の基礎から学べる環境があり、最初から一人で任されるのではなく、先輩のサポートを受けながら成長できます。",
    },
    {
      id: "仕事内容",
      keywords: ["仕事内容", "業務", "何する", "営業", "仕事", "どんな仕事", "業務内容", "職務"],
      answer:
        "主な仕事は、お客様への提案・案内・フォローなどの営業活動です。\n人と話す力、課題を見つける力、行動力を磨ける仕事ですニャン。",
    },
    {
      id: "雰囲気",
      keywords: ["雰囲気", "社風", "人間関係", "職場", "社員", "上司", "チーム", "カルチャー", "風土"],
      answer:
        "勢いと熱量を大切にする雰囲気です。\n若手が挑戦しやすく、成長意欲のある人が活躍しやすい環境ですニャン！",
    },
    {
      id: "給与評価",
      keywords: ["給与", "給料", "年収", "評価", "インセンティブ", "稼げる", "報酬", "賞与", "ボーナス", "昇給"],
      answer:
        "成果や成長をしっかり評価する仕組みがあります。\n詳細な給与条件や評価制度については、採用情報または面談時にご確認ください。",
    },
    {
      id: "研修",
      keywords: ["研修", "教育", "教えて", "サポート", "成長", "育成", "トレーニング", "勉強"],
      answer:
        "営業未経験でもスタートしやすいよう、基礎研修や先輩社員のサポートがあります。\n実践を通じて営業力を身につけられますニャン！",
    },
    {
      id: "応募方法",
      keywords: ["応募", "エントリー", "面接", "採用", "求人", "選考", "履歴書", "申し込み"],
      answer:
        "応募は採用情報ページまたはお問い合わせフォームから可能です。\n少しでも興味があれば、まずは気軽にご相談くださいニャン！",
    },
    {
      id: "企業向け",
      keywords: ["営業支援", "企業", "法人", "取引", "依頼", "相談", "BtoB", "業務提携", "アウトソーシング"],
      answer:
        "営業支援や人材に関するご相談も受け付けています。\n詳しい内容はお問い合わせフォームよりご連絡ください。",
    },
    {
      id: "問い合わせ",
      keywords: ["問い合わせ", "連絡", "相談", "電話", "メール", "コンタクト", "聞きたい"],
      answer:
        "お問い合わせは専用フォームから受け付けています。\n採用・法人相談どちらもお気軽にご連絡くださいニャン！",
    },
    {
      id: "会社情報",
      keywords: ["会社情報", "会社概要", "所在地", "代表", "理念", "ビジョン", "ミッション", "経営"],
      answer:
        "会社情報や理念については、会社情報ページで詳しく確認できます。\nEverエフォートの考え方や大切にしている価値観をご覧ください。",
    },
    {
      id: "キャリア",
      keywords: ["キャリア", "昇進", "出世", "ステップアップ", "将来", "ポジション", "役職"],
      answer:
        "成果と意欲次第で早期のキャリアアップが可能です。\nマネージャー職や新規事業への挑戦の機会もありますニャン！",
    },
  ];

  // 同義語マップ（曖昧な入力にもヒットさせる）
  const SYNONYMS = {
    "応募": ["エントリー", "面接", "申し込み"],
    "雰囲気": ["社風", "カルチャー", "風土"],
    "給料": ["給与", "年収", "報酬"],
    "問い合わせ": ["連絡", "コンタクト"],
    "未経験": ["初心者", "経験なし"],
    "仕事": ["業務", "職務"],
  };

  // クイック質問（初期表示）
  const QUICK_PRESETS = [
    { label: "未経験でも応募できる？", q: "未経験でも応募できる？" },
    { label: "仕事内容を知りたい", q: "仕事内容を知りたい" },
    { label: "会社の雰囲気は？", q: "会社の雰囲気は？" },
    { label: "給与/評価制度は？", q: "給与 評価制度" },
    { label: "問い合わせしたい", q: "問い合わせしたい" },
    { label: "企業向け相談", q: "企業向け相談" },
  ];

  // 最後の手段で出す CTA
  const FALLBACK_CTAS = [
    { label: "採用情報を見る", href: () => CHAT_LINKS.recruit, cta: true },
    { label: "会社情報を見る", href: () => CHAT_LINKS.company },
    { label: "お問い合わせする", href: () => CHAT_LINKS.contact, cta: true },
  ];

  // ---------- マッチング ----------
  const normalize = (s) =>
    (s || "")
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[、。・！？!?,.\-_/]/g, "");

  function expandQuery(q) {
    const norm = normalize(q);
    let tokens = new Set([norm]);
    // 元キーに対応する同義語を含める
    Object.entries(SYNONYMS).forEach(([key, syns]) => {
      if (norm.includes(key)) syns.forEach((s) => tokens.add(s));
      syns.forEach((s) => {
        if (norm.includes(s)) tokens.add(key);
      });
    });
    return { norm, tokens: Array.from(tokens) };
  }

  function scoreFaq(q, faq) {
    const { norm, tokens } = expandQuery(q);
    let score = 0;
    let hits = 0;
    for (const kw of faq.keywords) {
      const k = normalize(kw);
      // 完全一致（クエリ全体がキーワードと一致）
      if (norm === k) score += 100;
      // 部分一致
      if (norm.includes(k)) {
        score += 30;
        hits++;
      }
      // 同義語経由
      for (const t of tokens) {
        if (t !== norm && t.includes(k)) {
          score += 12;
          hits++;
        }
      }
    }
    // 複数キーワード一致ボーナス
    if (hits >= 2) score += 10 * (hits - 1);
    return score;
  }

  function findBestFaq(q) {
    if (!q || !q.trim()) return null;
    let best = null;
    let bestScore = 0;
    for (const f of FAQ_DATA) {
      const s = scoreFaq(q, f);
      if (s > bestScore) {
        bestScore = s;
        best = f;
      }
    }
    return bestScore >= 20 ? best : null;
  }

  // ---------- DOM ----------
  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") node.className = v;
      else if (k === "html") node.innerHTML = v;
      else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) node.setAttribute(k, v);
    }
    for (const c of children) {
      if (c == null) continue;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    }
    return node;
  }

  // ルートコンテナ
  const root = el("div", { class: "evchat-root", "aria-live": "polite" });
  document.documentElement.appendChild(root);

  // ランチャー
  const MASCOT_SRC = "images/mascot_chat.png";
  const launcherIcon = el("span", { class: "evchat-launcher-icon" });
  launcherIcon.appendChild(
    el("img", { src: MASCOT_SRC, alt: "エバニャン" })
  );
  const launcher = el(
    "button",
    {
      type: "button",
      class: "evchat-launcher",
      "aria-label": "エバーにゃんAI受付を開く",
    },
    launcherIcon,
    el("span", { class: "evchat-launcher-label" }, "AI受付"),
    el("span", { class: "evchat-badge" }, "1")
  );
  root.appendChild(launcher);

  // 横の吹き出しヒント（数秒で自動消去）
  const hint = el("div", { class: "evchat-hint", role: "status" }, "話しかけてニャン！");
  root.appendChild(hint);
  setTimeout(() => {
    hint.classList.add("is-gone");
    setTimeout(() => hint.remove(), 280);
  }, 6500);

  // ウィンドウ
  const body = el("div", { class: "evchat-body", role: "log" });
  const input = el("input", {
    class: "evchat-input",
    type: "text",
    placeholder: "気になることを書いてニャン…",
    "aria-label": "メッセージを入力",
    maxlength: "120",
  });
  const sendBtn = el("button", { type: "button", class: "evchat-send", "aria-label": "送信" }, "➤");

  const win = el(
    "div",
    { class: "evchat-window", role: "dialog", "aria-label": "エバーにゃんAI受付" },
    el(
      "div",
      { class: "evchat-header" },
      el(
        "div",
        { class: "evchat-avatar" },
        el("img", { src: MASCOT_SRC, alt: "エバニャン" })
      ),
      el(
        "div",
        { class: "evchat-title" },
        el("div", { class: "evchat-title-main" }, "エバーにゃんAI受付"),
        el(
          "div",
          { class: "evchat-title-sub" },
          "採用・会社情報・お問い合わせをすぐに案内するニャン！"
        )
      ),
      el("button", { type: "button", class: "evchat-close", "aria-label": "閉じる" }, "×")
    ),
    body,
    el(
      "div",
      { class: "evchat-footer" },
      input,
      sendBtn
    ),
    el("div", { class: "evchat-disclaimer" }, "※自動応答です。詳細は採用ページ / お問い合わせから")
  );
  root.appendChild(win);

  const closeBtn = win.querySelector(".evchat-close");
  const badge = launcher.querySelector(".evchat-badge");

  // ---------- 描画ヘルパ ----------
  function scrollBottom() {
    requestAnimationFrame(() => {
      body.scrollTop = body.scrollHeight;
    });
  }
  function addBot(text) {
    const msg = el("div", { class: "evchat-msg is-bot" });
    msg.style.whiteSpace = "pre-wrap";
    msg.textContent = text;
    body.appendChild(msg);
    scrollBottom();
  }
  function addUser(text) {
    const msg = el("div", { class: "evchat-msg is-user" }, text);
    body.appendChild(msg);
    scrollBottom();
  }
  function addQuicks(items) {
    const wrap = el("div", { class: "evchat-quicks" });
    items.forEach((it) => {
      const btn = el(
        "button",
        {
          type: "button",
          class: "evchat-quick" + (it.cta ? " is-cta" : ""),
          onclick: () => it.onClick(),
        },
        it.label
      );
      wrap.appendChild(btn);
    });
    body.appendChild(wrap);
    scrollBottom();
  }
  function addTyping() {
    const t = el(
      "div",
      { class: "evchat-typing" },
      el("span"),
      el("span"),
      el("span")
    );
    body.appendChild(t);
    scrollBottom();
    return t;
  }

  // ---------- 会話制御 ----------
  function presentPresets() {
    addQuicks(
      QUICK_PRESETS.map((p) => ({
        label: p.label,
        onClick: () => ask(p.q),
      }))
    );
  }

  function presentCtas() {
    const items = [
      {
        label: "📌 採用情報を見る",
        cta: true,
        onClick: () => goTo(CHAT_LINKS.recruit),
      },
      {
        label: "📨 お問い合わせ",
        cta: true,
        onClick: () => goTo(CHAT_LINKS.contact),
      },
      {
        label: "🏢 会社情報",
        onClick: () => goTo(CHAT_LINKS.company),
      },
      {
        label: "🔥 企業理念",
        onClick: () => goTo(CHAT_LINKS.philosophy),
      },
    ];
    addQuicks(items);
  }

  function goTo(href) {
    if (!href) return;
    try {
      if (href.startsWith("#")) {
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          close();
          return;
        }
      }
      window.location.href = href;
    } catch (e) {
      window.location.href = href;
    }
  }

  let answering = false;
  function ask(q) {
    if (answering) return;
    if (!q || !q.trim()) return;
    addUser(q);
    answering = true;
    const t = addTyping();
    const delay = 520 + Math.random() * 380;
    setTimeout(() => {
      t.remove();
      const best = findBestFaq(q);
      if (best) {
        addBot(best.answer);
        // 関連の次の一手
        const next = pickFollowUp(best);
        if (next && next.length) addQuicks(next);
      } else {
        addBot(
          "すみません、まだその質問には詳しく答えられませんニャン…\n下のボタンから採用 / 会社情報 / お問い合わせをご覧いただけます。"
        );
        addQuicks(
          FALLBACK_CTAS.map((c) => ({
            label: c.label,
            cta: c.cta,
            onClick: () => goTo(c.href()),
          }))
        );
      }
      answering = false;
    }, delay);
  }

  function pickFollowUp(faq) {
    // FAQ ごとに次のおすすめボタンを用意
    const map = {
      未経験応募: [
        { label: "応募方法を見る", cta: true, onClick: () => goTo(CHAT_LINKS.recruit) },
        { label: "研修制度は？", onClick: () => ask("研修") },
      ],
      仕事内容: [
        { label: "1日の流れは？", onClick: () => ask("1日のスケジュール") },
        { label: "応募方法", cta: true, onClick: () => goTo(CHAT_LINKS.recruit) },
      ],
      雰囲気: [
        { label: "社員の声を見る", onClick: () => ask("仲間インタビュー") },
        { label: "会社情報", onClick: () => goTo(CHAT_LINKS.company) },
      ],
      給与評価: [
        { label: "応募方法", cta: true, onClick: () => goTo(CHAT_LINKS.recruit) },
        { label: "問い合わせる", onClick: () => goTo(CHAT_LINKS.contact) },
      ],
      研修: [
        { label: "応募方法", cta: true, onClick: () => goTo(CHAT_LINKS.recruit) },
        { label: "キャリアアップは？", onClick: () => ask("キャリアアップ") },
      ],
      応募方法: [
        { label: "📌 採用ページへ", cta: true, onClick: () => goTo(CHAT_LINKS.recruit) },
        { label: "📨 お問い合わせ", onClick: () => goTo(CHAT_LINKS.contact) },
      ],
      企業向け: [
        { label: "📨 お問い合わせ", cta: true, onClick: () => goTo(CHAT_LINKS.contact) },
      ],
      問い合わせ: [
        { label: "📨 お問い合わせフォーム", cta: true, onClick: () => goTo(CHAT_LINKS.contact) },
      ],
      会社情報: [
        { label: "🏢 会社情報を見る", cta: true, onClick: () => goTo(CHAT_LINKS.company) },
        { label: "🔥 企業理念", onClick: () => goTo(CHAT_LINKS.philosophy) },
      ],
      キャリア: [
        { label: "📌 採用ページへ", cta: true, onClick: () => goTo(CHAT_LINKS.recruit) },
      ],
    };
    return map[faq.id] || null;
  }

  // ---------- 開閉 ----------
  let initialized = false;
  function open() {
    win.classList.add("is-open");
    launcher.classList.add("is-hidden");
    if (badge) badge.remove();
    if (!initialized) {
      initialized = true;
      addBot(
        "こんにちは！エバーにゃんAI受付です。\n採用情報・仕事内容・会社の雰囲気・お問い合わせについて案内できます。\n気になる項目を選んでくださいニャン！"
      );
      presentPresets();
    }
    setTimeout(() => input.focus(), 280);
  }
  function close() {
    win.classList.remove("is-open");
    launcher.classList.remove("is-hidden");
  }

  launcher.addEventListener("click", () => {
    const h = document.querySelector(".evchat-hint");
    if (h) { h.classList.add("is-gone"); setTimeout(() => h.remove(), 280); }
    open();
  });
  closeBtn.addEventListener("click", close);
  sendBtn.addEventListener("click", () => {
    const v = input.value.trim();
    if (!v) return;
    input.value = "";
    ask(v);
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.isComposing) {
      e.preventDefault();
      sendBtn.click();
    }
  });
  // Esc で閉じる
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && win.classList.contains("is-open")) close();
  });

  // ---------- 公開 API ----------
  window.EvChat = {
    open,
    close,
    setLinks(partial) {
      Object.assign(CHAT_LINKS, partial || {});
    },
    addFaq(item) {
      if (item && Array.isArray(item.keywords) && item.answer) FAQ_DATA.push(item);
    },
  };
})();
