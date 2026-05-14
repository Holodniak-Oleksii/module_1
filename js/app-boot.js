async function bootApp() {
  await loadConfig();

  const scripts = [
    "js/logger.js",
    "js/validation.js",
    "js/storage.js",
    "js/kohonen.js",
    "js/grossberg.js",
    "js/network.js",
    "js/charts.js",
    "js/export.js",
    "js/ui.js",
  ];

  for (const src of scripts) {
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Не вдалося завантажити ${src}`));
      document.body.appendChild(script);
    });
  }

  Logger.installGlobalHandlers();
  UI.init();
}

bootApp().catch((e) => {
  const banner = document.getElementById("appErrorBanner");
  if (banner) {
    banner.hidden = false;
    banner.textContent = `Помилка запуску застосунку: ${e.message}. Перевірте наявність config.json та перезавантажте сторінку.`;
  }
  console.error(e);
});
