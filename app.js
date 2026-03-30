import { CounterPropagationNetwork } from "./network/network.js";
import { applyDefaultsToUI, loadConfig, readConfigFromUI, validateConfig } from "./utils/config.js";
import { downloadLogs, log, showToast } from "./utils/logger.js";

window.downloadLogs = downloadLogs;

let net, chart;
let lastTrainingErrors = [];
let baseConfig = null;

//  Ініціалізація конфігурації та UI при завантаженні
window.addEventListener("DOMContentLoaded", async () => {
  baseConfig = await loadConfig();
  applyDefaultsToUI(baseConfig);
  log("App ready");
});

const trainingData = [
  { input: [0, 0], target: [1, 0] },
  { input: [0, 1], target: [1, 0] },
  { input: [1, 0], target: [0, 1] },
  { input: [1, 1], target: [0, 1] },
];

// 🔹 Ініціалізація
window.init = () => {
  const config = readConfigFromUI(baseConfig ?? { learningRate: 0.1, epochs: 100, kohonenNeurons: 3 });
  const validationErrors = validateConfig(config, 2);
  if (validationErrors.length) {
    validationErrors.forEach((e) => log(e, "ERROR"));
    showToast(validationErrors[0], "error");
    return;
  }

  net = new CounterPropagationNetwork(2, 2, config);

  log(`Network initialized (lr=${config.learningRate}, epochs=${config.epochs}, neurons=${config.kohonenNeurons})`);
  showToast("Мережа ініціалізована ✅", "success");
};

// 🔹 Навчання
window.train = () => {
  if (!net) {
    log("Network not initialized", "ERROR");
    showToast("Спочатку ініціалізуй мережу!", "error");
    return;
  }

  showToast("Навчання почалось...", "info");

  const errors = net.train(trainingData);
  lastTrainingErrors = errors.slice();

  document.getElementById("result").innerText =
    "Остання помилка: " + errors.at(-1).toFixed(4);

  drawChart(errors);
  drawNetworkMap();

  showToast("Мережа навчена 🎉", "success");
};

// 🔹 Прогноз
window.predict = () => {
  if (!net) {
    log("Network not initialized", "ERROR");
    showToast("Спочатку ініціалізуй мережу!", "error");
    return;
  }

  try {
    const raw = document.getElementById("inputData").value;

    if (!raw) {
      showToast("Введи дані (наприклад: 1,0)", "error");
      return;
    }

    const input = raw.split(",").map(Number);

    if (input.length !== 2 || input.some(isNaN)) {
      throw new Error();
    }

    const result = net.predict(input);

    document.getElementById("result").innerText =
      "Результат: " + result.map((x) => x.toFixed(2)).join(", ");

    showToast("Прогноз виконано ✅", "success");
  } catch {
    log("Invalid input", "ERROR");
    showToast("Неправильний формат! Приклад: 1,0", "error");
    document.getElementById("result").innerText = "Помилка введення!";
  }
};

// 📊 Графік помилок
function drawChart(errors) {
  const ctx = document.getElementById("chart");

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: errors.map((_, i) => i + 1),
      datasets: [
        {
          label: "Error",
          data: errors,
        },
      ],
    },
    options: {
      responsive: true,
    },
  });
}

// 🗺️ Візуалізація Кохонена
function drawNetworkMap() {
  const canvas = document.getElementById("networkMap");
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!net) return;

  // 🔹 Дані
  trainingData.forEach(({ input, target }) => {
    ctx.fillStyle = target[0] === 1 ? "orange" : "cyan";

    ctx.beginPath();
    ctx.arc(input[0] * 300 + 50, 350 - input[1] * 300, 10, 0, 2 * Math.PI);
    ctx.fill();
  });

  // 🔹 Нейрони
  net.kohonen.weights.forEach((w, i) => {
    ctx.fillStyle = "red";

    ctx.beginPath();
    ctx.arc(w[0] * 300 + 50, 350 - w[1] * 300, 12, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = "white";
    ctx.fillText("N" + i, w[0] * 300 + 45, 350 - w[1] * 300 - 15);
  });
}

// 💾 Збереження/відновлення моделі
window.saveModel = () => {
  if (!net) {
    showToast("Спочатку ініціалізуй мережу!", "error");
    return;
  }
  const payload = {
    version: baseConfig?.version ?? "1.0.0",
    kohonen: { weights: net.kohonen.weights },
    grossberg: { weights: net.grossberg.weights },
    meta: { timestamp: new Date().toISOString() },
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "cpn_model.json";
  a.click();
  showToast("Модель збережено ✅", "success");
};

window.loadModelFromFile = (evt) => {
  const file = evt?.target?.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const obj = JSON.parse(reader.result);
      if (!net) {
        // ініціалізуємо приблизну структуру, якщо не було
        const cfg = readConfigFromUI(baseConfig ?? { learningRate: 0.1, epochs: 100, kohonenNeurons: (obj?.kohonen?.weights?.length ?? 3) });
        net = new CounterPropagationNetwork(2, 2, cfg);
      }
      if (obj?.kohonen?.weights && obj?.grossberg?.weights) {
        net.kohonen.weights = obj.kohonen.weights;
        net.grossberg.weights = obj.grossberg.weights;
        drawNetworkMap();
        showToast("Модель завантажено ✅", "success");
        log("Model loaded from file");
      } else {
        throw new Error("Invalid model file structure");
      }
    } catch (e) {
      log(`Model load error: ${e.message}`, "ERROR");
      showToast("Помилка завантаження моделі", "error");
    }
  };
  reader.readAsText(file);
};

// 🧾 Експорт простого звіту
window.downloadReport = () => {
  const cfg = readConfigFromUI(baseConfig ?? { learningRate: 0.1, epochs: 100, kohonenNeurons: 3 });
  const lines = [];
  lines.push("Звіт МЗП (Counterpropagation Network)");
  lines.push(`Версія: ${baseConfig?.version ?? "1.0.0"}`);
  lines.push(`Параметри: lr=${cfg.learningRate}, epochs=${cfg.epochs}, neurons=${cfg.kohonenNeurons}`);
  if (lastTrainingErrors.length) {
    lines.push(`К-сть епох у логах: ${lastTrainingErrors.length}`);
    lines.push(`Остання помилка: ${lastTrainingErrors.at(-1).toFixed(6)}`);
  } else {
    lines.push("Навчання ще не запускалось.");
  }
  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "report.txt";
  a.click();
  showToast("Звіт збережено ✅", "success");
};
