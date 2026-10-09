/* ===== サイト設定（ここだけ書き換えれば反映されます）=====
   未記入のままだと、画面に「【…を村田さんが記入】」と表示されます。 */
window.SITE_CONFIG = {
  // 無料相談の申込みフォーム（GoogleフォームのURL）
  FORM_URL: "https://docs.google.com/forms/d/e/1FAIpQLSfCmlGO5wQaKVgEN18aG3xpJQOTL0yU8fTLBmSKBReAAPDPqA/viewform",
  // フォームの「ご興味のあるサービス」欄の項目ID（選んだサービスを事前入力するために使います）
  FORM_ENTRY_SERVICE: "entry.99179705",
  // フォームをページ内に埋め込む場合のみ記入（Googleフォーム →「送信」→「<>埋め込む」の src の URL）。空なら埋め込まずリンクのみ。
  FORM_EMBED_URL: "",
  // GA4の測定ID（例：G-XXXXXXXXXX）
  GA4_ID: "【GA4測定IDを村田さんが記入】",
  // 実行プランの現在の残り枠（社数を数字で。例："2"）。空欄なら残り枠は表示しません。
  SLOTS_LEFT: ""
};
