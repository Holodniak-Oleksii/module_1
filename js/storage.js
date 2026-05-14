const AppStorage = (() => {
  const SESSION_KEY = "mzp_session";

  function isEnabled() {
    return CONFIG?.persistence?.enabled !== false;
  }

  function shouldAutoSave() {
    return isEnabled() && CONFIG?.persistence?.autoSave !== false;
  }

  function saveSession(state) {
    if (!isEnabled()) return false;
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ ...state, savedAt: new Date().toISOString() }));
      return true;
    } catch (e) {
      Logger.log(`Не вдалося зберегти стан сесії: ${e.message}`, "WARN");
      return false;
    }
  }

  function loadSession() {
    if (!isEnabled()) return null;
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      return parsed;
    } catch (e) {
      Logger.log(`Не вдалося відновити стан сесії: ${e.message}`, "WARN");
      return null;
    }
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  function exportSessionFile(state) {
    const prefix = CONFIG?.paths?.stateFilePrefix ?? "mzp_state";
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:]/g, "-");
    const filename = `${prefix}_${timestamp}.json`;
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    Logger.log(`Стан збережено у файл: ${filename}`, "INFO");
    return filename;
  }

  function importSessionFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          if (!data || !data.trainResult) {
            throw new Error("Файл не містить даних навченої мережі");
          }
          resolve(data);
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = () => reject(new Error("Не вдалося прочитати файл"));
      reader.readAsText(file);
    });
  }

  return {
    saveSession,
    loadSession,
    clearSession,
    exportSessionFile,
    importSessionFile,
    shouldAutoSave,
    isEnabled,
  };
})();

window.AppStorage = AppStorage;
