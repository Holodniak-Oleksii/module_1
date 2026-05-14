const Exporter = (() => {
  function exportJSON(network) {
    if (!network) {
      Logger.log("Немає даних для експорту — мережа не ініціалізована", "WARN");
      return;
    }

    const state = network.getStats();
    const payload = {
      meta: {
        appVersion: CONFIG.version,
        exportedAt: new Date().toISOString(),
      },
      config: {
        kohNeurons: state.kohNeurons,
        inputSize: state.inputSize,
        outputSize: state.outputSize,
      },
      weights: {
        kohonen: state.kohonenWeights,
        grossberg: state.grossbergWeights,
      },
      training: {
        epochs: state.errors.length,
        finalError: state.errors.at(-1) ?? null,
        errorHistory: state.errors,
      },
      logs: Logger.getEntries(),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${CONFIG.paths?.reportFilePrefix ?? "mzp_report"}_${new Date().toISOString().slice(0, 19).replace(/[:]/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);

    Logger.log("Звіт JSON успішно збережено", "INFO");
  }

  function exportLog() {
    Logger.downloadLog();
  }

  return { exportJSON, exportLog };
})();

window.Exporter = Exporter;
