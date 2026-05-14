const Logger = (() => {
  const STORAGE_KEY = "mzp_log";
  let entries = [];
  let errorLogSaved = false;

  function _maxEntries() {
    return CONFIG?.logging?.maxEntries ?? 500;
  }

  function _displayLimit() {
    return CONFIG?.logging?.displayLimit ?? 10;
  }

  function _logPrefix() {
    return CONFIG?.paths?.logFilePrefix ?? "mzp";
  }

  const LEVELS = ["INFO", "WARN", "ERROR"];

  function _timestamp() {
    return new Date().toISOString().replace("T", " ").slice(0, 19);
  }

  function _formatEntry(entry) {
    return `[${entry.time}] [${entry.level}] ${entry.message}`;
  }

  function _persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (e) {
      console.warn("Logger: не вдалося зберегти лог у localStorage", e);
    }
  }

  function _redrawLogBox() {
    const logBox = document.getElementById("logBox");
    if (!logBox) return;

    logBox.innerHTML = "";
    entries.slice(-_displayLimit()).forEach((entry) => {
      const row = document.createElement("div");
      row.className = "log-entry";

      const time = document.createElement("span");
      time.className = "log-entry__time";
      time.textContent = entry.time;

      const level = document.createElement("span");
      level.className = `log-entry__level log-entry__level--${entry.level}`;
      level.textContent = entry.level;

      const msg = document.createElement("span");
      msg.className = "log-entry__msg";
      msg.textContent = entry.message;

      row.appendChild(time);
      row.appendChild(level);
      row.appendChild(msg);
      logBox.appendChild(row);
    });
    logBox.scrollTop = logBox.scrollHeight;
  }

  function _downloadText(filename, text) {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadLog(silent = false) {
    const text = entries.map(_formatEntry).join("\n");
    const date = new Date().toISOString().slice(0, 10);
    const filename = `${_logPrefix()}_${date}.log`;
    _downloadText(filename, text || `[${_timestamp()}] [INFO] Лог порожній\n`);
    if (!silent) {
      log(`Файл логу збережено: ${filename}`, "INFO");
    }
    return filename;
  }

  function flushLogFile(reason) {
    if (!entries.length) return;
    const date = new Date().toISOString().slice(0, 10);
    const filename = `${_logPrefix()}_${date}.log`;
    const header = reason
      ? `# Автозбереження: ${reason}\n# Версія: ${CONFIG?.version ?? "?"}\n\n`
      : "";
    const text = header + entries.map(_formatEntry).join("\n");
    _downloadText(filename, text);
  }

  function log(message, level = "INFO") {
    const normalised = LEVELS.includes(level) ? level : "INFO";
    const entry = { time: _timestamp(), level: normalised, message: String(message) };
    entries.push(entry);

    while (entries.length > _maxEntries()) {
      entries.shift();
    }

    _persist();
    _redrawLogBox();

    if (level === "ERROR" && CONFIG?.logging?.autoSaveLogOnError && !errorLogSaved) {
      errorLogSaved = true;
      try {
        flushLogFile("критична помилка");
      } catch (_) {}
    }
  }

  function getEntries() {
    return [...entries];
  }

  function clear() {
    entries = [];
    errorLogSaved = false;
    localStorage.removeItem(STORAGE_KEY);
    _redrawLogBox();
  }

  function _restore() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          entries = parsed.slice(-_maxEntries());
        }
      }
    } catch (e) {
      console.warn("Logger: не вдалося відновити лог", e);
    }
    _redrawLogBox();
  }

  function installGlobalHandlers() {
    window.addEventListener("error", (event) => {
      log(
        `Неперехоплена помилка: ${event.message} (${event.filename}:${event.lineno})`,
        "ERROR"
      );
    });

    window.addEventListener("unhandledrejection", (event) => {
      const msg = event.reason?.message ?? String(event.reason);
      log(`Неперехоплене відхилення Promise: ${msg}`, "ERROR");
    });

    window.addEventListener("beforeunload", () => {
      if (CONFIG?.logging?.autoSaveLogOnClose && entries.length) {
        _persist();
      }
    });
  }

  _restore();

  return { log, getEntries, clear, downloadLog, flushLogFile, installGlobalHandlers };
})();

window.Logger = Logger;
