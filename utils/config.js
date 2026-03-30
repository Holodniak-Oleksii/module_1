// Конфігурація застосунку: завантаження дефолтів з зовнішнього config.json
// та злиття з введеними користувачем значеннями.

let cachedConfig = null;

export async function loadConfig() {
  if (cachedConfig) return cachedConfig;
  try {
    const resp = await fetch("./config.json", { cache: "no-store" });
    if (!resp.ok) throw new Error(`Config HTTP ${resp.status}`);
    cachedConfig = await resp.json();
    return cachedConfig;
  } catch (e) {
    // дефолти на випадок відсутності файлу
    cachedConfig = { learningRate: 0.1, epochs: 100, kohonenNeurons: 3, version: "1.0.0" };
    return cachedConfig;
  }
}

export function applyDefaultsToUI(cfg) {
  const lrEl = document.getElementById("lr");
  const epEl = document.getElementById("epochs");
  const nEl = document.getElementById("neurons");
  if (lrEl && !lrEl.value) lrEl.value = String(cfg.learningRate ?? 0.1);
  if (epEl && !epEl.value) epEl.value = String(cfg.epochs ?? 100);
  if (nEl && !nEl.value) nEl.value = String(cfg.kohonenNeurons ?? 3);
}

export function readConfigFromUI(fallback) {
  const lr = parseFloat(document.getElementById("lr")?.value ?? fallback.learningRate);
  const epochs = parseInt(document.getElementById("epochs")?.value ?? fallback.epochs);
  const neurons = parseInt(document.getElementById("neurons")?.value ?? fallback.kohonenNeurons);
  return {
    learningRate: isFinite(lr) ? lr : fallback.learningRate,
    epochs: Number.isInteger(epochs) ? epochs : fallback.epochs,
    kohonenNeurons: Number.isInteger(neurons) ? neurons : fallback.kohonenNeurons,
    version: fallback.version,
  };
}

export function validateConfig(cfg, classesCount = 2) {
  const errors = [];
  if (!(cfg.learningRate > 0 && cfg.learningRate <= 1)) {
    errors.push("Learning rate має бути у діапазоні (0, 1].");
  }
  if (!(Number.isInteger(cfg.epochs) && cfg.epochs > 0 && cfg.epochs <= 1e6)) {
    errors.push("Epochs має бути додатним цілим числом (розумні межі).");
  }
  if (!(Number.isInteger(cfg.kohonenNeurons) && cfg.kohonenNeurons >= classesCount)) {
    errors.push(`Кількість нейронів має бути ≥ кількості класів (${classesCount}).`);
  }
  return errors;
}

