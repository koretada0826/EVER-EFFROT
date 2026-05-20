/* ==========================================================
   お問い合わせフォーム: 送信時にメーラーを開いて
   Ever_CEOsoffice@e-effort.net 宛にフォーム内容を送る
   ========================================================== */
(() => {
  "use strict";

  const TO = "Ever_CEOsoffice@e-effort.net";

  const form = document.querySelector(".cf-form");
  if (!form) return;

  // 種別コードを日本語ラベルに変換
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

  const fieldOrLabel = (val, dict) => (val && dict[val]) || val || "(未選択)";
  const orHyphen = (v) => (v && v.trim() !== "" ? v : "-");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // 必須項目チェック (HTML5 標準バリデーションを使う)
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const data = new FormData(form);
    const inquiryType = fieldOrLabel(data.get("inquiry_type"), INQUIRY_LABELS);
    const contactMethod = fieldOrLabel(data.get("contact_method"), METHOD_LABELS);

    const subject = `【お問い合わせ】${orHyphen(data.get("subject"))} (${inquiryType})`;

    const body = [
      "■お問い合わせ種別",
      inquiryType,
      "",
      "■お名前",
      orHyphen(data.get("name")),
      "",
      "■フリガナ",
      orHyphen(data.get("kana")),
      "",
      "■会社名 / 団体名",
      orHyphen(data.get("company")),
      "",
      "■部署 / 役職",
      orHyphen(data.get("department")),
      "",
      "■メールアドレス",
      orHyphen(data.get("email")),
      "",
      "■電話番号",
      orHyphen(data.get("phone")),
      "",
      "■ご希望の連絡方法",
      contactMethod,
      "",
      "■件名",
      orHyphen(data.get("subject")),
      "",
      "■お問い合わせ内容",
      orHyphen(data.get("message")),
      "",
      "----",
      "本メールはウェブサイトの問い合わせフォームから自動生成されました。",
    ].join("\n");

    const mailto =
      "mailto:" +
      encodeURIComponent(TO) +
      "?subject=" +
      encodeURIComponent(subject) +
      "&body=" +
      encodeURIComponent(body);

    // メーラー起動
    window.location.href = mailto;
  });
})();
