/* ==========================================================
   お問い合わせフォーム: FormSubmit.co 経由でメール送信
   送信先: Ever_CEOsoffice@e-effort.net
   - 登録不要 / APIキー不要 / 完全無料
   - 初回送信時のみ受信箱に届く「Activate」リンクを1回クリック
     して有効化が必要(spam防止のため業界標準仕様)
   ========================================================== */
(() => {
  "use strict";

  const TO = "Ever_CEOsoffice@e-effort.net";
  const ENDPOINT = "https://formsubmit.co/ajax/" + encodeURIComponent(TO);

  const form = document.querySelector(".cf-form");
  if (!form) return;

  const steps = document.querySelectorAll(".cf-steps li");
  const submitBtn = form.querySelector('button[type="submit"]');

  const INQUIRY_LABELS = {
    service: "サービスについて",
    recruit: "採用について",
    partnership: "業務提携・取材依頼",
    press: "プレスリリース・メディア掲載",
    other: "その他",
  };
  const METHOD_LABELS = {
    email: "メール",
    phone: "電話",
    either: "どちらでも可",
  };

  const labelOf = (val, dict) => (val && dict[val]) || val || "(未選択)";
  const orHyphen = (v) => (v && String(v).trim() !== "" ? String(v) : "-");

  // ステップインジケータ更新
  const setStep = (n) => {
    steps.forEach((li, i) => {
      li.classList.toggle("is-active", i === n - 1);
      li.classList.toggle("is-done", i < n - 1);
    });
  };

  // 成功画面の差し込み (一度だけ生成して使い回し)
  let successPanel = null;
  const showSuccess = () => {
    if (!successPanel) {
      successPanel = document.createElement("div");
      successPanel.className = "cf-success";
      successPanel.innerHTML = `
        <div class="cf-success-icon">✓</div>
        <h2 class="cf-success-title">送信が完了しました</h2>
        <p class="cf-success-lead">
          お問い合わせいただきありがとうございます。<br>
          内容を確認のうえ、担当者より <strong>3営業日以内</strong> にご返信いたします。
        </p>
        <a href="index.html" class="cf-btn cf-btn-primary"><span>トップへ戻る</span></a>
      `;
      form.parentNode.insertBefore(successPanel, form.nextSibling);
    }
    form.style.display = "none";
    successPanel.style.display = "block";
    setStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const showError = (msg) => {
    alert(
      msg ||
        "送信に失敗しました。お手数ですが時間をおいて再度お試しいただくか、お電話でお問い合わせください。"
    );
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const data = new FormData(form);
    const inquiryType = labelOf(data.get("inquiry_type"), INQUIRY_LABELS);
    const contactMethod = labelOf(data.get("contact_method"), METHOD_LABELS);
    const subject = `【お問い合わせ】${orHyphen(data.get("subject"))} (${inquiryType})`;

    // FormSubmit に送るペイロード
    // _xxx で始まるフィールドは FormSubmit の制御パラメータ
    const payload = {
      _subject: subject,
      _template: "table",  // メール本文を整形した表形式に
      _captcha: "false",   // AJAX送信なので reCAPTCHA は不要
      _replyto: data.get("email") || "",  // 返信先をフォーム入力メアドに
      // 表示順を制御するため、日本語ラベルで並べる
      お問い合わせ種別: inquiryType,
      お名前: orHyphen(data.get("name")),
      フリガナ: orHyphen(data.get("kana")),
      会社名: orHyphen(data.get("company")),
      部署役職: orHyphen(data.get("department")),
      メールアドレス: orHyphen(data.get("email")),
      電話番号: orHyphen(data.get("phone")),
      ご希望の連絡方法: contactMethod,
      件名: orHyphen(data.get("subject")),
      お問い合わせ内容: orHyphen(data.get("message")),
    };

    // 送信中UI
    const originalLabel = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = "<span>送信中…</span>";
    setStep(2);

    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      // FormSubmit は success: "true" (文字列) を返す
      if (res.ok && (json.success === true || json.success === "true")) {
        showSuccess();
      } else {
        throw new Error(json.message || "送信に失敗しました");
      }
    } catch (err) {
      console.error("[contact-form] submit error:", err);
      showError();
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalLabel;
      setStep(1);
    }
  });
})();
