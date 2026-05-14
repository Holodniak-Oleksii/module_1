const fs = require("fs");
const path = require("path");
const vm = require("vm");

const validationPath = path.join(__dirname, "../js/validation.js");
const validationCode = fs.readFileSync(validationPath, "utf8") + "\nglobal.__validateTrainingParams = validateTrainingParams;";
global.window = global;
vm.runInThisContext(validationCode, { filename: validationPath });
const validateTrainingParams = global.__validateTrainingParams;

const C = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
};

const valid = {
  kohNeurons: 6,
  learningRateKohonen: 0.3,
  learningRateGrossberg: 0.1,
  maxEpochs: 100,
};

const SUITE = [
  {
    group: "kohNeurons",
    tests: [
      { name: "6 нейронів → OK", run: () => validateTrainingParams(valid, 6).length === 0 },
      { name: "2 нейрони < 6 класів → помилка", run: () => validateTrainingParams({ ...valid, kohNeurons: 2 }, 6).length > 0 },
      { name: "21 нейрон → помилка", run: () => validateTrainingParams({ ...valid, kohNeurons: 21 }, 6).length > 0 },
      { name: "NaN → помилка", run: () => validateTrainingParams({ ...valid, kohNeurons: NaN }, 6).length > 0 },
    ],
  },
  {
    group: "learningRate",
    tests: [
      { name: "lr Kohonen = 0 → помилка", run: () => validateTrainingParams({ ...valid, learningRateKohonen: 0 }, 6).length > 0 },
      { name: "lr Kohonen = 1 → OK", run: () => validateTrainingParams({ ...valid, learningRateKohonen: 1 }, 6).length === 0 },
      { name: "lr Grossberg > 1 → помилка", run: () => validateTrainingParams({ ...valid, learningRateGrossberg: 1.5 }, 6).length > 0 },
    ],
  },
  {
    group: "maxEpochs",
    tests: [
      { name: "epochs = 1 → OK", run: () => validateTrainingParams({ ...valid, maxEpochs: 1 }, 6).length === 0 },
      { name: "epochs = 0 → помилка", run: () => validateTrainingParams({ ...valid, maxEpochs: 0 }, 6).length > 0 },
      { name: "epochs = 501 → помилка", run: () => validateTrainingParams({ ...valid, maxEpochs: 501 }, 6).length > 0 },
      { name: "epochs = 3.5 → помилка", run: () => validateTrainingParams({ ...valid, maxEpochs: 3.5 }, 6).length > 0 },
    ],
  },
];

const flatTests = SUITE.flatMap((g) => g.tests.map((t) => ({ ...t, group: g.group })));
const total = flatTests.length;

function progressBar(done, width = 28) {
  const filled = Math.round((done / total) * width);
  const bar = "█".repeat(filled) + "░".repeat(width - filled);
  const pct = Math.round((done / total) * 100);
  return `${C.cyan}[${bar}]${C.reset} ${C.bold}${pct}%${C.reset} (${done}/${total})`;
}

function runSuite() {
  let passed = 0;
  let failed = 0;
  let index = 0;

  console.log("");
  console.log(`${C.bold}Unit tests: validateTrainingParams${C.reset}`);
  console.log(`${C.dim}Модуль: js/validation.js${C.reset}`);
  console.log("");

  for (const { group, tests } of SUITE) {
    console.log(`${C.cyan}▸ ${group}${C.reset}`);
    for (const test of tests) {
      index += 1;
      let ok = false;
      try {
        ok = Boolean(test.run());
      } catch (e) {
        ok = false;
      }

      if (ok) passed += 1;
      else failed += 1;

      const status = ok
        ? `${C.green}PASS${C.reset}`
        : `${C.red}FAIL${C.reset}`;
      const counter = `${C.dim}[${String(index).padStart(2, " ")}/${total}]${C.reset}`;

      console.log(`  ${counter} ${status}  ${test.name}`);
      console.log(`  ${progressBar(index)}`);
    }
    console.log("");
  }

  console.log("─".repeat(48));
  if (failed === 0) {
    console.log(`${C.green}${C.bold}✔ Усі тести пройшли${C.reset}  (${passed}/${total})`);
  } else {
    console.log(`${C.red}${C.bold}✘ Є помилки${C.reset}  ${C.green}пройшло: ${passed}${C.reset}, ${C.red}завалено: ${failed}${C.reset}`);
  }
  console.log("");

  process.exit(failed > 0 ? 1 : 0);
}

runSuite();
