async function runTests() {
  let passed = 0;
  let failed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log("✅ " + name);
      passed++;
    } else {
      console.error("❌ " + name);
      failed++;
    }
  }

  function assertThrows(fn, name) {
    try {
      fn();
      console.error("❌ " + name);
      failed++;
    } catch {
      console.log("✅ " + name);
      passed++;
    }
  }

  function weightsEqual(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  const koh = new KohonenLayer(2, 3);
  koh.weights = [
    [1.0, 0.0],
    [0.0, 1.0],
    [0.5, 0.5],
  ];
  assert(koh.predict([1.0, 0.0]) === 0, "KohonenLayer: predict повертає BMU=0 для вектора [1,0]");
  assert(koh.predict([0.0, 1.0]) === 1, "KohonenLayer: predict повертає BMU=1 для вектора [0,1]");

  const kohTrain = new KohonenLayer(2, 3);
  kohTrain.weights = [
    [0.9, 0.1],
    [0.0, 1.0],
    [0.5, 0.5],
  ];
  const beforeTrain = kohTrain.getWeights();
  const bmu = kohTrain.train([1.0, 0.0], 0.5);
  const afterTrain = kohTrain.getWeights();
  assert(bmu === 0, "KohonenLayer: train повертає індекс BMU=0");
  assert(
    weightsEqual(beforeTrain[1], afterTrain[1]) && weightsEqual(beforeTrain[2], afterTrain[2]),
    "KohonenLayer: train змінює лише ваги BMU"
  );
  assert(
    !weightsEqual(beforeTrain[0], afterTrain[0]),
    "KohonenLayer: ваги BMU змінилися після train"
  );

  assertThrows(() => koh.predict([]), "KohonenLayer: кидає помилку при порожньому векторі");

  const gross = new GrossbergLayer(3, 2);
  gross.weights = [
    [0.1, 0.2],
    [0.3, 0.4],
    [0.5, 0.6],
  ];
  const grossBefore = gross.getWeights();
  gross.train(1, [1.0, 0.0], 1.0);
  const grossAfter = gross.getWeights();
  assert(
    weightsEqual(grossBefore[0], grossAfter[0]) && weightsEqual(grossBefore[2], grossAfter[2]),
    "GrossbergLayer: train оновлює лише рядок bmuIndex"
  );
  assert(
    !weightsEqual(grossBefore[1], grossAfter[1]),
    "GrossbergLayer: рядок bmuIndex змінився після train"
  );

  const out = gross.predict(2);
  assert(Array.isArray(out) && out.length === 2, "GrossbergLayer: predict повертає вектор розміру outputSize");

  const dataset = [
    { input: [0.0, 0.0], target: [1, 0] },
    { input: [1.0, 1.0], target: [1, 0] },
    { input: [0.0, 1.0], target: [0, 1] },
    { input: [1.0, 0.0], target: [0, 1] },
  ];

  const net = new CounterPropagationNetwork(2, 4, 2);
  const result = await net.train(dataset, 50, 0.5, 0.3);
  const finalMse = result.errors[result.errors.length - 1];
  assert(finalMse < 0.1, `CounterPropagationNetwork: MSE < 0.1 після 50 епох (фактично ${finalMse.toFixed(4)})`);

  const wBefore = JSON.stringify(net.getStats());
  net.predict([0.0, 1.0]);
  const wAfter = JSON.stringify(net.getStats());
  assert(wBefore === wAfter, "CounterPropagationNetwork: predict не змінює ваги");

  console.log(`Результат: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

window.runTests = runTests;
