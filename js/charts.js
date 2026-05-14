const Charts = (() => {
  const instances = new Map();

  const PALETTE = [
    "#2563eb", "#16a34a", "#dc2626", "#d97706",
    "#7c3aed", "#0891b2", "#be185d", "#65a30d",
  ];

  const BASE_OPTIONS = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    resizeDelay: 200,
  };

  function _available() {
    return typeof Chart !== "undefined";
  }

  function _getCanvas(canvasId) {
    return document.getElementById(canvasId);
  }

  function _hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function renderErrorChart(canvasId, errorsArray) {
    if (!_available()) return;
    const canvas = _getCanvas(canvasId);
    if (!canvas) return;

    const labels = errorsArray.map((_, i) => i + 1);
    const primary = CONFIG.defaultColors.primary;
    let chart = instances.get(canvasId);

    if (chart) {
      chart.data.labels = labels;
      chart.data.datasets[0].data = errorsArray;
      chart.update("none");
      return;
    }

    chart = new Chart(canvas, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "MSE помилка",
            data: errorsArray,
            borderColor: primary,
            backgroundColor: _hexToRgba(primary, 0.08),
            borderWidth: 2,
            pointRadius: errorsArray.length > 50 ? 0 : 2,
            fill: true,
            tension: 0.3,
          },
        ],
      },
      options: {
        ...BASE_OPTIONS,
        plugins: {
          title: {
            display: true,
            text: "Крива навчання МЗП",
            font: { size: 14, weight: "bold" },
          },
          legend: { labels: { font: { size: 12 } } },
        },
        scales: {
          x: { title: { display: true, text: "Епоха" } },
          y: { title: { display: true, text: "MSE помилка" }, beginAtZero: true },
        },
      },
    });

    instances.set(canvasId, chart);
  }

  function renderWeightsHeatmap(canvasId, weightsMatrix, title) {
    if (!_available()) return;
    const canvas = _getCanvas(canvasId);
    if (!canvas || !weightsMatrix.length) return;

    const weightLabels = weightsMatrix[0].map((_, i) => `W${i + 1}`);
    const datasets = weightsMatrix.map((row, j) => ({
      label: `Нейрон ${j + 1}`,
      data: row,
      backgroundColor: PALETTE[j % PALETTE.length] + "cc",
      borderColor: PALETTE[j % PALETTE.length],
      borderWidth: 1,
    }));

    const existing = instances.get(canvasId);
    if (existing) {
      existing.destroy();
      instances.delete(canvasId);
    }

    const chart = new Chart(canvas, {
      type: "bar",
      data: { labels: weightLabels, datasets },
      options: {
        ...BASE_OPTIONS,
        plugins: {
          title: { display: true, text: title, font: { size: 14, weight: "bold" } },
          legend: { labels: { font: { size: 12 } } },
        },
        scales: {
          x: { title: { display: true, text: "Індекс ваги" } },
          y: { title: { display: true, text: "Значення ваги" }, beginAtZero: true },
        },
      },
    });

    instances.set(canvasId, chart);
  }

  function renderComparisonChart(canvasId, experimentsArray) {
    const canvas = _getCanvas(canvasId);
    if (!canvas) return;

    if (!experimentsArray.length) {
      const existing = instances.get(canvasId);
      if (existing) {
        existing.destroy();
        instances.delete(canvasId);
      }
      const ctx = canvas.getContext("2d");
      const w = canvas.offsetWidth || canvas.parentElement?.clientWidth || 400;
      const h = canvas.offsetHeight || canvas.parentElement?.clientHeight || 280;
      canvas.width = w;
      canvas.height = h;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#64748b";
      ctx.font = "14px Segoe UI, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        "Запустіть навчання ще раз з іншими параметрами для порівняння",
        w / 2,
        h / 2
      );
      return;
    }

    if (!_available()) return;
    const labels = experimentsArray.map((e) => e.label);
    const data = experimentsArray.map((e) => e.finalError);
    let chart = instances.get(canvasId);

    if (chart) {
      chart.data.labels = labels;
      chart.data.datasets[0].data = data;
      chart.data.datasets[0].backgroundColor = labels.map((_, i) => PALETTE[i % PALETTE.length] + "cc");
      chart.data.datasets[0].borderColor = labels.map((_, i) => PALETTE[i % PALETTE.length]);
      chart.update("none");
      return;
    }

    chart = new Chart(canvas, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Фінальна MSE",
            data,
            backgroundColor: labels.map((_, i) => PALETTE[i % PALETTE.length] + "cc"),
            borderColor: labels.map((_, i) => PALETTE[i % PALETTE.length]),
            borderWidth: 1,
          },
        ],
      },
      options: {
        ...BASE_OPTIONS,
        plugins: {
          title: {
            display: true,
            text: "Порівняння ефективності конфігурацій",
            font: { size: 14, weight: "bold" },
          },
          legend: { display: false },
        },
        scales: {
          x: { title: { display: true, text: "Конфігурація" } },
          y: { title: { display: true, text: "Фінальна MSE" }, beginAtZero: true },
        },
      },
    });

    instances.set(canvasId, chart);
  }

  function clearChart(canvasId) {
    const chart = instances.get(canvasId);
    if (chart) {
      chart.destroy();
      instances.delete(canvasId);
    }
  }

  return {
    renderErrorChart,
    renderWeightsHeatmap,
    renderComparisonChart,
    clearChart,
  };
})();

window.Charts = Charts;
