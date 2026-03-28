window.TelegramApp = {
  init() {
    const tg = window.Telegram?.WebApp;
    if (!tg) {
      console.log("Telegram WebApp SDK не найден");
      return;
    }

    tg.ready();
    tg.expand();

    try {
      tg.setHeaderColor("#11151c");
      tg.setBackgroundColor("#0f1115");
    } catch (e) {
      console.log("Не удалось применить цвета Telegram WebApp", e);
    }

    window.tg = tg;
    console.log("Telegram Mini App инициализирован");
    console.log("initDataUnsafe:", tg.initDataUnsafe);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  window.TelegramApp.init();
});
