const UI = (() => {
  let network = null;
  let trainResult = null;
  let testHistory = [];
  let experiments = [];
  let isTraining = false;

  const TASK_LABEL = "Розпізнавання кольорів";

  function _networkPalette() {
    return (
      CONFIG.ui?.networkColors ?? [
        { name: "червоний", hex: "#ef4444" },
        { name: "зелений", hex: "#22c55e" },
        { name: "синій", hex: "#3b82f6" },
        { name: "жовтий", hex: "#eab308" },
        { name: "білий", hex: "#ffffff" },
        { name: "чорний", hex: "#000000" },
      ]
    );
  }

  function _expectedOutputSize() {
    return _networkPalette().length;
  }

  function _colorClasses() {
    return _networkPalette().map((c) => c.name);
  }

  function _colorHex() {
    return _networkPalette().map((c) => c.hex);
  }

  const TRAINING_SAMPLES = [
    { input: [1.0, 0.0, 0.0], target: [1, 0, 0, 0, 0, 0] },
    { input: [0.9, 0.1, 0.1], target: [1, 0, 0, 0, 0, 0] },
    { input: [0.8, 0.0, 0.0], target: [1, 0, 0, 0, 0, 0] },
    { input: [0.0, 1.0, 0.0], target: [0, 1, 0, 0, 0, 0] },
    { input: [0.1, 0.9, 0.1], target: [0, 1, 0, 0, 0, 0] },
    { input: [0.0, 0.8, 0.0], target: [0, 1, 0, 0, 0, 0] },
    { input: [0.0, 0.0, 1.0], target: [0, 0, 1, 0, 0, 0] },
    { input: [0.1, 0.1, 0.9], target: [0, 0, 1, 0, 0, 0] },
    { input: [0.0, 0.0, 0.8], target: [0, 0, 1, 0, 0, 0] },
    { input: [1.0, 1.0, 0.0], target: [0, 0, 0, 1, 0, 0] },
    { input: [0.9, 0.9, 0.1], target: [0, 0, 0, 1, 0, 0] },
    { input: [0.8, 0.8, 0.0], target: [0, 0, 0, 1, 0, 0] },
    { input: [1.0, 1.0, 1.0], target: [0, 0, 0, 0, 1, 0] },
    { input: [0.95, 0.95, 0.95], target: [0, 0, 0, 0, 1, 0] },
    { input: [0.9, 0.9, 0.9], target: [0, 0, 0, 0, 1, 0] },
    { input: [0.0, 0.0, 0.0], target: [0, 0, 0, 0, 0, 1] },
    { input: [0.05, 0.05, 0.05], target: [0, 0, 0, 0, 0, 1] },
    { input: [0.1, 0.1, 0.1], target: [0, 0, 0, 0, 0, 1] },
  ];

  function _val(id) {
    return document.getElementById(id).value.trim();
  }

  function _el(id) {
    return document.getElementById(id);
  }

  function _showFieldError(fieldId, message) {
    const err = _el(`${fieldId}Error`);
    if (!err) return;
    err.textContent = message;
    err.hidden = false;
  }

  function _clearFieldErrors() {
    document.querySelectorAll(".field-error").forEach((el) => {
      el.textContent = "";
      el.hidden = true;
    });
  }

  function _getParams() {
    return {
      kohNeurons: parseInt(_val("kohNeurons"), 10),
      learningRateKohonen: parseFloat(_val("learningRateKohonen")),
      learningRateGrossberg: parseFloat(_val("learningRateGrossberg")),
      maxEpochs: parseInt(_val("maxEpochs"), 10),
    };
  }

  function _validateForm() {
    _clearFieldErrors();
    const params = _getParams();
    const errors = validateTrainingParams(params, _expectedOutputSize());

    errors.forEach((err) => _showFieldError(err.field, err.message));

    if (errors.length) {
      Logger.log("Валідація форми не пройдена", "ERROR");
      return false;
    }

    return true;
  }

  function _getDataset() {
    return TRAINING_SAMPLES.map((s) => ({
      input: [...s.input],
      target: [...s.target],
    }));
  }

  function _updateProgress(current, total) {
    const pct = Math.round((current / total) * 100);
    _el("progressFill").style.width = `${pct}%`;
    _el("progressBar").setAttribute("aria-valuenow", String(pct));
    _el("progressLabel").textContent =
      `Навчання: епоха ${current} / ${total} (${pct}%)`;
  }

  function _resetProgress() {
    _el("progressFill").style.width = "0%";
    _el("progressBar").setAttribute("aria-valuenow", "0");
    _el("progressLabel").textContent = "Готовий до навчання";
  }

  function _rgbToHex(r, g, b) {
    return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
  }

  function _hexToRgb(hex) {
    const value = hex.replace("#", "");
    return [
      parseInt(value.slice(0, 2), 16),
      parseInt(value.slice(2, 4), 16),
      parseInt(value.slice(4, 6), 16),
    ];
  }

  function _normalizeRgb(r, g, b) {
    return [r / 255, g / 255, b / 255];
  }

  function _getRgbFromControls() {
    return [
      parseInt(_el("testR").value, 10),
      parseInt(_el("testG").value, 10),
      parseInt(_el("testB").value, 10),
    ];
  }

  function _setRgbControls(r, g, b) {
    _el("testR").value = r;
    _el("testG").value = g;
    _el("testB").value = b;
    _el("testRVal").textContent = r;
    _el("testGVal").textContent = g;
    _el("testBVal").textContent = b;
    _el("testColorPicker").value = _rgbToHex(r, g, b);
    _updateColorPreview(r, g, b);
  }

  function _updateColorPreview(r, g, b) {
    _el("colorPreview").style.background = `rgb(${r}, ${g}, ${b})`;
  }

  function _syncColorFromPicker() {
    const [r, g, b] = _hexToRgb(_el("testColorPicker").value);
    _setRgbControls(r, g, b);
  }

  function _syncColorFromSliders() {
    const r = parseInt(_el("testR").value, 10);
    const g = parseInt(_el("testG").value, 10);
    const b = parseInt(_el("testB").value, 10);
    _el("testRVal").textContent = r;
    _el("testGVal").textContent = g;
    _el("testBVal").textContent = b;
    _el("testColorPicker").value = _rgbToHex(r, g, b);
    _updateColorPreview(r, g, b);
  }

  function _softmax(values) {
    const max = Math.max(...values);
    const exps = values.map((v) => Math.exp(v - max));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map((v) => v / sum);
  }

  function _getColorPrediction(output) {
    const probs = _softmax(output);
    const idx = probs.indexOf(Math.max(...probs));
    return {
      idx,
      name: _colorClasses()[idx] || "невідомий",
      confidence: probs[idx],
      probs,
    };
  }

  function _renderConfidenceBars(probs) {
    const container = _el("confidenceBars");
    container.innerHTML = _colorClasses()
      .map((name, i) => {
        const hex = _colorHex()[i];
        const pct = (probs[i] * 100).toFixed(1);
        return `
        <div class="confidence-bar">
          <span class="confidence-bar__label">
            <span class="confidence-bar__dot" style="background:${hex}"></span>
            ${name}
          </span>
          <div class="confidence-bar__track">
            <div class="confidence-bar__fill" style="width:${pct}%;background:${hex}"></div>
          </div>
          <span class="confidence-bar__pct">${pct}%</span>
        </div>`;
      })
      .join("");
  }

  function _resetConfidenceBars(message) {
    _el("confidenceBars").innerHTML =
      `<p class="confidence-bars__empty">${message}</p>`;
  }

  function _canTestColors() {
    return (
      network &&
      network.trained &&
      network.inputSize === 3 &&
      network.outputSize === _expectedOutputSize()
    );
  }

  function _updateTestNotice() {
    const notice = _el("testNotice");
    if (!_canTestColors()) {
      notice.textContent = "Спочатку навчіть мережу на вкладці «Навчання».";
      notice.hidden = false;
      _resetConfidenceBars("Навчіть мережу на задачі «Розпізнавання кольорів»");
      return;
    }
    notice.hidden = true;
  }

  function _buildSessionState() {
    if (!network || !trainResult) return null;
    return {
      params: _getParams(),
      trainResult: {
        errors: [...trainResult.errors],
        finalWeightsKoh: trainResult.finalWeightsKoh.map((r) => [...r]),
        finalWeightsGross: trainResult.finalWeightsGross.map((r) => [...r]),
      },
      testHistory: [...testHistory],
      experiments: [...experiments],
      inputSize: network.inputSize,
      outputSize: network.outputSize,
      kohNeurons: network.kohNeurons,
    };
  }

  function _saveSession() {
    if (!AppStorage.shouldAutoSave()) return;
    const state = _buildSessionState();
    if (state) AppStorage.saveSession(state);
  }

  function _restoreSession(data) {
    if (!data?.trainResult?.finalWeightsKoh) return false;
    try {
      const p = data.params;
      _el("kohNeurons").value = p.kohNeurons;
      _el("learningRateKohonen").value = p.learningRateKohonen;
      _el("learningRateGrossberg").value = p.learningRateGrossberg;
      _el("maxEpochs").value = p.maxEpochs;

      network = new CounterPropagationNetwork(
        data.inputSize,
        data.kohNeurons,
        data.outputSize,
      );
      network.kohonen.weights = data.trainResult.finalWeightsKoh.map((r) => [
        ...r,
      ]);
      network.grossberg.weights = data.trainResult.finalWeightsGross.map(
        (r) => [...r],
      );
      network.errors = [...data.trainResult.errors];
      network.trained = true;
      network.lastTrainParams = {
        epochs: p.maxEpochs,
        lrKohonen: p.learningRateKohonen,
        lrGrossberg: p.learningRateGrossberg,
      };

      trainResult = {
        errors: [...data.trainResult.errors],
        finalWeightsKoh: data.trainResult.finalWeightsKoh.map((r) => [...r]),
        finalWeightsGross: data.trainResult.finalWeightsGross.map((r) => [
          ...r,
        ]),
      };
      testHistory = Array.isArray(data.testHistory)
        ? [...data.testHistory]
        : [];
      experiments = Array.isArray(data.experiments)
        ? [...data.experiments]
        : [];

      _updateReportTables();
      _renderTestHistory();
      _updateTestNotice();
      _safeChart(() =>
        Charts.renderErrorChart("trainingChart", trainResult.errors),
      );
      _safeChart(() =>
        Charts.renderComparisonChart("comparisonChart", experiments),
      );
      _el("progressLabel").textContent =
        `Відновлено. Фінальна MSE: ${trainResult.errors.at(-1)?.toFixed(6) ?? "—"}`;
      return true;
    } catch (e) {
      Logger.log(`Помилка відновлення стану: ${e.message}`, "ERROR");
      return false;
    }
  }

  function _updateReportTables() {
    if (!network || !trainResult) return;

    const stats = network.getStats();
    const params = _getParams();

    _el("paramsTableBody").innerHTML = `
      <tr><td>Задача</td><td>${TASK_LABEL}</td></tr>
      <tr><td>Розмір входу</td><td>${stats.inputSize}</td></tr>
      <tr><td>Розмір виходу</td><td>${stats.outputSize}</td></tr>
      <tr><td>Нейронів Кохонена</td><td>${stats.kohNeurons}</td></tr>
      <tr><td>Коеф. навчання Кохонена</td><td>${params.learningRateKohonen}</td></tr>
      <tr><td>Коеф. навчання Гроссберга</td><td>${params.learningRateGrossberg}</td></tr>
      <tr><td>Кількість епох</td><td>${params.maxEpochs}</td></tr>
      <tr><td>Фінальна MSE</td><td>${trainResult.errors.at(-1)?.toFixed(6) ?? "—"}</td></tr>
      <tr><td>Навчено</td><td>${stats.trained ? "так" : "ні"}</td></tr>
    `;

    const kohWeights = trainResult.finalWeightsKoh;
    const kohHead = _el("kohWeightsHead");
    const kohBody = _el("kohWeightsTableBody");
    if (kohWeights.length) {
      const cols = kohWeights[0].map((_, i) => `<th>W${i + 1}</th>`).join("");
      kohHead.innerHTML = `<tr><th>Нейрон</th>${cols}</tr>`;
      kohBody.innerHTML = kohWeights
        .map(
          (row, i) =>
            `<tr><td>${i + 1}</td>${row.map((w) => `<td>${w.toFixed(4)}</td>`).join("")}</tr>`,
        )
        .join("");
    }

    const grossWeights = trainResult.finalWeightsGross;
    const grossHead = _el("grossWeightsHead");
    const grossBody = _el("grossWeightsTableBody");
    if (grossWeights.length) {
      const cols = grossWeights[0].map((_, i) => `<th>Y${i + 1}</th>`).join("");
      grossHead.innerHTML = `<tr><th>Нейрон</th>${cols}</tr>`;
      grossBody.innerHTML = grossWeights
        .map(
          (row, i) =>
            `<tr><td>${i + 1}</td>${row.map((w) => `<td>${w.toFixed(4)}</td>`).join("")}</tr>`,
        )
        .join("");
    }
  }

  function _renderTestHistory() {
    const tbody = _el("testHistoryBody");
    if (!testHistory.length) {
      tbody.innerHTML = `<tr class="data-table__empty"><td colspan="5">Ще немає тестових запитів</td></tr>`;
      return;
    }
    tbody.innerHTML = testHistory
      .map(
        (row, i) =>
          `<tr>
            <td>${i + 1}</td>
            <td>${row.time}</td>
            <td class="data-table__color-cell">
              <span class="data-table__color-swatch" style="background:${row.rgbCss}"></span>${row.rgbLabel}
            </td>
            <td>${row.colorName}</td>
            <td>${row.confidence}</td>
          </tr>`,
      )
      .join("");
  }

  function _setTrainingState(active) {
    isTraining = active;
    _el("btnTrain").disabled = active;
    _el("btnReset").disabled = active;
  }

  function _switchTab(tabName) {
    document.querySelectorAll(".tabs__btn").forEach((btn) => {
      const isActive = btn.dataset.tab === tabName;
      btn.classList.toggle("tabs__btn--active", isActive);
      btn.setAttribute("aria-selected", String(isActive));
    });
    document.querySelectorAll(".tab-panel").forEach((panel) => {
      const isActive = panel.id === `tab-${tabName}`;
      panel.classList.toggle("tab-panel--active", isActive);
      panel.hidden = !isActive;
    });
  }

  function _safeChart(fn) {
    try {
      fn();
    } catch (e) {
      Logger.log(`Помилка графіка: ${e.message}`, "WARN");
    }
  }

  async function handleTrain() {
    if (isTraining) return;
    if (!_validateForm()) return;

    _setTrainingState(true);
    _resetProgress();

    try {
      const params = _getParams();
      const dataset = _getDataset();
      const inputSize = dataset[0].input.length;
      const outputSize = dataset[0].target.length;

      network = new CounterPropagationNetwork(
        inputSize,
        params.kohNeurons,
        outputSize,
      );

      Logger.log(
        `Початок навчання: ${dataset.length} зразків, ${params.maxEpochs} епох`,
        "INFO",
      );

      const result = await network.train(
        dataset,
        params.maxEpochs,
        params.learningRateKohonen,
        params.learningRateGrossberg,
        (epoch) => {
          _updateProgress(epoch, params.maxEpochs);
          if (epoch % 10 === 0 || epoch === params.maxEpochs) {
            _safeChart(() =>
              Charts.renderErrorChart("trainingChart", [...network.errors]),
            );
          }
        },
        (doneResult) => {
          trainResult = {
            errors: [...doneResult.errors],
            finalWeightsKoh: doneResult.finalWeightsKoh,
            finalWeightsGross: doneResult.finalWeightsGross,
          };

          experiments.push({
            label: `lrK=${params.learningRateKohonen}, lrG=${params.learningRateGrossberg}, n=${params.kohNeurons}`,
            finalError: doneResult.errors.at(-1),
          });

          _safeChart(() =>
            Charts.renderErrorChart("trainingChart", trainResult.errors),
          );
          _safeChart(() =>
            Charts.renderComparisonChart("comparisonChart", experiments),
          );
          _updateReportTables();
          _updateTestNotice();

          _el("progressLabel").textContent =
            `Навчання завершено. Фінальна MSE: ${doneResult.errors.at(-1).toFixed(6)}`;
          Logger.log(
            `Навчання завершено. Фінальна MSE: ${doneResult.errors.at(-1).toFixed(6)}`,
            "INFO",
          );
          _saveSession();
        },
      );

      if (!trainResult) {
        trainResult = {
          errors: [...result.errors],
          finalWeightsKoh: result.finalWeightsKoh,
          finalWeightsGross: result.finalWeightsGross,
        };
      }
    } catch (e) {
      Logger.log(`Помилка навчання: ${e.message}`, "ERROR");
      _el("progressLabel").textContent =
        "Помилка навчання. Перевірте параметри та дані.";
      _showFieldError(
        "maxEpochs",
        e.message || "Не вдалося завершити навчання.",
      );
    } finally {
      _setTrainingState(false);
    }
  }

  function handlePredict() {
    _clearFieldErrors();

    if (!_canTestColors()) {
      Logger.log("Мережа не готова до тестування кольорів", "WARN");
      _showFieldError(
        "testRgb",
        "Навчіть мережу на задачі «Розпізнавання кольорів» (вхід RGB, 3 компоненти).",
      );
      _el("interpretationResult").innerHTML = "—";
      _updateTestNotice();
      return;
    }

    try {
      const [r, g, b] = _getRgbFromControls();
      const input = _normalizeRgb(r, g, b);
      const output = network.predict(input);
      const { name, confidence, probs } = _getColorPrediction(output);
      const outputStr = output.map((v) => v.toFixed(4)).join(", ");
      const confidencePct = `${(confidence * 100).toFixed(1)}%`;
      const rgbLabel = `rgb(${r}, ${g}, ${b})`;
      const rgbCss = `rgb(${r}, ${g}, ${b})`;

      _el("interpretationResult").innerHTML = `
        <span class="result-box__swatch" style="background:${rgbCss}"></span>
        <span class="result-box__text">${name}</span>`;
      _renderConfidenceBars(probs);

      const time = new Date().toLocaleTimeString("uk-UA");
      testHistory.unshift({
        time,
        rgbLabel,
        rgbCss,
        colorName: name,
        confidence: confidencePct,
        input: input.map((v) => v.toFixed(3)).join(", "),
        output: outputStr,
        interpretation: name,
      });
      if (testHistory.length > 10) testHistory.length = 10;
      _renderTestHistory();
      _saveSession();

      Logger.log(`Тест RGB ${rgbLabel} → ${name} (${confidencePct})`, "INFO");
    } catch (e) {
      Logger.log(`Помилка розпізнавання: ${e.message}`, "ERROR");
      _showFieldError("testRgb", "Не вдалося виконати розпізнавання.");
      _el("interpretationResult").innerHTML = "Помилка обробки запиту";
    }
  }

  function handleExportJSON() {
    try {
      if (!network || !trainResult) {
        Logger.log("Немає даних для експорту", "WARN");
        alert("Спочатку навчіть мережу, щоб сформувати звіт.");
        return;
      }

      const stats = network.getStats();
      const params = _getParams();

      const payload = {
        meta: {
          appVersion: CONFIG.version,
          exportedAt: new Date().toISOString(),
          task: TASK_LABEL,
        },
        parameters: {
          kohNeurons: params.kohNeurons,
          learningRateKohonen: params.learningRateKohonen,
          learningRateGrossberg: params.learningRateGrossberg,
          maxEpochs: params.maxEpochs,
          inputSize: stats.inputSize,
          outputSize: stats.outputSize,
        },
        weights: {
          kohonen: trainResult.finalWeightsKoh,
          grossberg: trainResult.finalWeightsGross,
        },
        training: {
          errors: trainResult.errors,
          finalError: trainResult.errors.at(-1),
        },
        tests: testHistory,
        experiments,
        logs: Logger.getEntries(),
      };

      const prefix = CONFIG.paths?.reportFilePrefix ?? "mzp_report";
      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/[:]/g, "-");
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${prefix}_v${CONFIG.version}_${timestamp}.json`;
      a.click();
      URL.revokeObjectURL(url);

      Logger.log("Звіт JSON успішно завантажено", "INFO");
    } catch (e) {
      Logger.log(`Помилка експорту JSON: ${e.message}`, "ERROR");
      alert("Не вдалося зберегти звіт. Спробуйте ще раз.");
    }
  }

  function handleExportLog() {
    try {
      Logger.downloadLog();
    } catch (e) {
      Logger.log(`Помилка завантаження логу: ${e.message}`, "ERROR");
      alert("Не вдалося завантажити файл логу.");
    }
  }

  function handleExportState() {
    try {
      const state = _buildSessionState();
      if (!state) {
        Logger.log("Немає даних для збереження стану", "WARN");
        alert("Спочатку навчіть мережу, щоб зберегти стан.");
        return;
      }
      AppStorage.exportSessionFile({
        meta: { appVersion: CONFIG.version, task: TASK_LABEL },
        ...state,
      });
    } catch (e) {
      Logger.log(`Помилка збереження стану: ${e.message}`, "ERROR");
      alert("Не вдалося зберегти стан.");
    }
  }

  function handleImportState() {
    _el("importStateFile").click();
  }

  async function _onImportStateFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const data = await AppStorage.importSessionFile(file);
      if (_restoreSession(data)) {
        AppStorage.saveSession(data);
        Logger.log(`Стан відновлено з файлу: ${file.name}`, "INFO");
      } else {
        throw new Error("Некоректний формат файлу стану");
      }
    } catch (e) {
      Logger.log(`Помилка імпорту стану: ${e.message}`, "ERROR");
      alert(`Не вдалося відновити стан: ${e.message}`);
    }
  }

  function handleReset() {
    try {
      network = null;
      trainResult = null;
      testHistory = [];
      experiments = [];

      Charts.clearChart("trainingChart");
      Charts.clearChart("comparisonChart");
      _safeChart(() => Charts.renderErrorChart("trainingChart", []));
      _safeChart(() => Charts.renderComparisonChart("comparisonChart", []));

      _resetProgress();
      _clearFieldErrors();

      _el("paramsTableBody").innerHTML =
        '<tr><td colspan="2">Мережу ще не навчено</td></tr>';
      _el("kohWeightsTableBody").innerHTML = "<tr><td>Немає даних</td></tr>";
      _el("grossWeightsTableBody").innerHTML = "<tr><td>Немає даних</td></tr>";
      _el("interpretationResult").innerHTML = "—";
      AppStorage.clearSession();
      _resetConfidenceBars(
        "Спочатку навчіть мережу на задачі «Розпізнавання кольорів»",
      );
      _updateTestNotice();
      _renderTestHistory();

      Logger.log("Стан застосунку скинуто", "INFO");
    } catch (e) {
      Logger.log(`Помилка скидання: ${e.message}`, "ERROR");
    }
  }

  function init() {
    try {
      if (CONFIG.appTitle) {
        _el("appTitle").textContent = CONFIG.appTitle;
        document.title = `МЗП — ${CONFIG.appTitle}`;
      }
      _el("appVersion").textContent = `v${CONFIG.version}`;
      _el("kohNeurons").value = CONFIG.kohNeurons;
      _el("learningRateKohonen").value = CONFIG.learningRateKohonen;
      _el("learningRateGrossberg").value = CONFIG.learningRateGrossberg;
      _el("maxEpochs").value = CONFIG.maxEpochs;

      document.querySelectorAll(".tabs__btn").forEach((btn) => {
        btn.addEventListener("click", () => _switchTab(btn.dataset.tab));
      });

      _el("btnTrain").addEventListener("click", handleTrain);
      _el("btnReset").addEventListener("click", handleReset);
      _el("btnPredict").addEventListener("click", handlePredict);
      _el("btnExportJSON").addEventListener("click", handleExportJSON);
      _el("btnExportLog").addEventListener("click", handleExportLog);
      _el("btnExportState").addEventListener("click", handleExportState);
      _el("btnImportState").addEventListener("click", handleImportState);
      _el("importStateFile").addEventListener("change", _onImportStateFile);
      _el("testColorPicker").addEventListener("input", _syncColorFromPicker);
      _el("testR").addEventListener("input", _syncColorFromSliders);
      _el("testG").addEventListener("input", _syncColorFromSliders);
      _el("testB").addEventListener("input", _syncColorFromSliders);

      _setRgbControls(230, 25, 25);
      _updateTestNotice();

      const saved = AppStorage.loadSession();
      if (saved && _restoreSession(saved)) {
        Logger.log("Стан сесії відновлено з локального сховища", "INFO");
      }

      _safeChart(() => Charts.renderErrorChart("trainingChart", []));
      _safeChart(() => Charts.renderComparisonChart("comparisonChart", []));

      Logger.log(`МЗП v${CONFIG.version} запущено`, "INFO");
    } catch (e) {
      Logger.log(`Помилка ініціалізації інтерфейсу: ${e.message}`, "ERROR");
    }
  }

  return {
    init,
    handleTrain,
    handlePredict,
    handleExportJSON,
    handleReset,
  };
})();

window.UI = UI;
