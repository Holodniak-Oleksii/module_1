const DEFAULT_NETWORK_COLORS = [
  { name: "червоний", hex: "#ef4444" },
  { name: "зелений", hex: "#22c55e" },
  { name: "синій", hex: "#3b82f6" },
  { name: "жовтий", hex: "#eab308" },
  { name: "білий", hex: "#ffffff" },
  { name: "чорний", hex: "#000000" },
];

const DEFAULT_CONFIG = {
  version: "1.0.0",
  locale: "uk",
  appTitle: "Мережа зустрічного поширення",
  paths: {
    logFilePrefix: "mzp",
    reportFilePrefix: "mzp_report",
    stateFilePrefix: "mzp_state",
  },
  defaults: {
    kohNeurons: 6,
    learningRateKohonen: 0.3,
    learningRateGrossberg: 0.1,
    maxEpochs: 100,
  },
  ui: {
    primaryColor: "#2563eb",
    primaryHoverColor: "#1d4ed8",
    primaryLightColor: "rgba(37, 99, 235, 0.1)",
    secondaryColor: "#64748b",
    secondaryHoverColor: "#475569",
    backgroundColor: "#f8fafc",
    surfaceColor: "#ffffff",
    borderColor: "#e2e8f0",
    textColor: "#1e293b",
    textMutedColor: "#64748b",
    successColor: "#16a34a",
    warningColor: "#d97706",
    errorColor: "#dc2626",
    errorBackgroundColor: "#fef2f2",
    errorBorderColor: "#fecaca",
    networkColors: DEFAULT_NETWORK_COLORS,
  },
  logging: {
    maxEntries: 500,
    displayLimit: 10,
    autoSaveLogOnError: true,
    autoSaveLogOnClose: true,
  },
  persistence: {
    enabled: true,
    autoSave: true,
  },
};

let CONFIG = _normalizeConfig(DEFAULT_CONFIG);

function _normalizeConfig(raw) {
  const uiRaw = raw.ui ?? {};
  const networkColors =
    Array.isArray(uiRaw.networkColors) && uiRaw.networkColors.length
      ? uiRaw.networkColors.map((c) => ({
          name: String(c.name),
          hex: String(c.hex),
        }))
      : DEFAULT_NETWORK_COLORS;

  const merged = {
    ...DEFAULT_CONFIG,
    ...raw,
    paths: { ...DEFAULT_CONFIG.paths, ...raw.paths },
    defaults: { ...DEFAULT_CONFIG.defaults, ...raw.defaults },
    ui: { ...DEFAULT_CONFIG.ui, ...uiRaw, networkColors },
    logging: { ...DEFAULT_CONFIG.logging, ...raw.logging },
    persistence: { ...DEFAULT_CONFIG.persistence, ...raw.persistence },
  };

  const ui = Object.freeze({
    primaryColor: merged.ui.primaryColor,
    primaryHoverColor: merged.ui.primaryHoverColor,
    primaryLightColor: merged.ui.primaryLightColor,
    secondaryColor: merged.ui.secondaryColor,
    secondaryHoverColor: merged.ui.secondaryHoverColor,
    backgroundColor: merged.ui.backgroundColor,
    surfaceColor: merged.ui.surfaceColor,
    borderColor: merged.ui.borderColor,
    textColor: merged.ui.textColor,
    textMutedColor: merged.ui.textMutedColor,
    successColor: merged.ui.successColor,
    warningColor: merged.ui.warningColor,
    errorColor: merged.ui.errorColor,
    errorBackgroundColor: merged.ui.errorBackgroundColor,
    errorBorderColor: merged.ui.errorBorderColor,
    networkColors: Object.freeze(
      networkColors.map((c) => Object.freeze({ ...c })),
    ),
  });

  return Object.freeze({
    version: merged.version,
    locale: merged.locale,
    appTitle: merged.appTitle,
    paths: Object.freeze({ ...merged.paths }),
    kohNeurons: merged.defaults.kohNeurons,
    learningRateKohonen: merged.defaults.learningRateKohonen,
    learningRateGrossberg: merged.defaults.learningRateGrossberg,
    maxEpochs: merged.defaults.maxEpochs,
    ui,
    defaultColors: Object.freeze({
      primary: ui.primaryColor,
      background: ui.backgroundColor,
    }),
    logging: Object.freeze({ ...merged.logging }),
    persistence: Object.freeze({ ...merged.persistence }),
  });
}

function applyConfigTheme() {
  const ui = CONFIG.ui;
  const root = document.documentElement.style;
  root.setProperty("--color-primary", ui.primaryColor);
  root.setProperty("--color-primary-hover", ui.primaryHoverColor);
  root.setProperty("--color-primary-light", ui.primaryLightColor);
  root.setProperty("--color-secondary", ui.secondaryColor);
  root.setProperty("--color-secondary-hover", ui.secondaryHoverColor);
  root.setProperty("--color-background", ui.backgroundColor);
  root.setProperty("--color-surface", ui.surfaceColor);
  root.setProperty("--color-border", ui.borderColor);
  root.setProperty("--color-text", ui.textColor);
  root.setProperty("--color-text-muted", ui.textMutedColor);
  root.setProperty("--color-success", ui.successColor);
  root.setProperty("--color-warning", ui.warningColor);
  root.setProperty("--color-error", ui.errorColor);
  root.setProperty("--color-error-bg", ui.errorBackgroundColor);
  root.setProperty("--color-error-border", ui.errorBorderColor);
  document.documentElement.lang = CONFIG.locale || "uk";
}

async function loadConfig() {
  if (typeof fetch === "undefined") {
    applyConfigTheme();
    return CONFIG;
  }
  try {
    const response = await fetch("config.json", { cache: "no-store" });
    if (response.ok) {
      const data = await response.json();
      CONFIG = _normalizeConfig(data);
    }
  } catch (_) {}
  applyConfigTheme();
  return CONFIG;
}

window.CONFIG = CONFIG;
window.loadConfig = loadConfig;
window.applyConfigTheme = applyConfigTheme;
