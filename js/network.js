class CounterPropagationNetwork {
  /**
   * Створює мережу зустрічного поширення з шарами Кохонена та Гроссберга.
   * @param {number} inputSize — розмірність вхідного вектора
   * @param {number} kohNeurons — кількість нейронів шару Кохонена
   * @param {number} outputSize — розмірність вихідного вектора
   */
  constructor(inputSize, kohNeurons, outputSize) {
    this.inputSize = inputSize;
    this.kohNeurons = kohNeurons;
    this.outputSize = outputSize;
    this.kohonen = new KohonenLayer(inputSize, kohNeurons);
    this.grossberg = new GrossbergLayer(kohNeurons, outputSize);
    this.errors = [];
    this.trained = false;
    this.lastTrainParams = null;
    Logger.log(
      `CounterPropagationNetwork: ініціалізовано (вхід=${inputSize}, нейрони=${kohNeurons}, вихід=${outputSize})`,
      "INFO"
    );
  }

  /**
   * Обчислює середньоквадратичну помилку між двома векторами.
   * @param {number[]} predicted
   * @param {number[]} target
   * @returns {number}
   * @private
   */
  _mse(predicted, target) {
    return (
      predicted.reduce((sum, val, i) => sum + (val - target[i]) ** 2, 0) /
      predicted.length
    );
  }

  /**
   * Перевіряє коректність навчального набору даних.
   * @param {{ input: number[], target: number[] }[]} dataset
   * @throws {Error} якщо набір порожній або має некоректну структуру
   * @private
   */
  _validateDataset(dataset) {
    if (!Array.isArray(dataset) || dataset.length === 0) {
      Logger.log("CounterPropagationNetwork: dataset порожній або не є масивом", "ERROR");
      throw new Error("dataset не може бути порожнім");
    }

    for (let i = 0; i < dataset.length; i++) {
      const item = dataset[i];

      if (
        !item ||
        typeof item !== "object" ||
        !Array.isArray(item.input) ||
        item.input.length === 0 ||
        !Array.isArray(item.target) ||
        item.target.length === 0
      ) {
        Logger.log(
          `CounterPropagationNetwork: некоректна структура зразка #${i} (очікується { input: [], target: [] })`,
          "ERROR"
        );
        throw new Error(`Некоректна структура зразка #${i}`);
      }

      if (item.input.length !== this.inputSize) {
        Logger.log(
          `CounterPropagationNetwork: зразок #${i} — розмір input (${item.input.length}) не збігається з inputSize (${this.inputSize})`,
          "ERROR"
        );
        throw new Error(`Зразок #${i}: input має містити ${this.inputSize} елементів`);
      }

      if (item.target.length !== this.outputSize) {
        Logger.log(
          `CounterPropagationNetwork: зразок #${i} — розмір target (${item.target.length}) не збігається з outputSize (${this.outputSize})`,
          "ERROR"
        );
        throw new Error(`Зразок #${i}: target має містити ${this.outputSize} елементів`);
      }

      if (item.input.some((v) => typeof v !== "number" || Number.isNaN(v))) {
        Logger.log(`CounterPropagationNetwork: зразок #${i} — input містить NaN`, "ERROR");
        throw new Error(`Зразок #${i}: input не може містити NaN`);
      }

      if (item.target.some((v) => typeof v !== "number" || Number.isNaN(v))) {
        Logger.log(`CounterPropagationNetwork: зразок #${i} — target містить NaN`, "ERROR");
        throw new Error(`Зразок #${i}: target не може містити NaN`);
      }
    }
  }

  /**
   * Навчає мережу на заданому наборі даних протягом вказаної кількості епох.
   * @param {{ input: number[], target: number[] }[]} dataset — навчальні зразки
   * @param {number} epochs — кількість епох
   * @param {number} lrKohonen — швидкість навчання шару Кохонена
   * @param {number} lrGrossberg — швидкість навчання шару Гроссберга
   * @returns {{ errors: number[], finalWeightsKoh: number[][], finalWeightsGross: number[][] }}
   */
  runEpoch(dataset, lrKohonen, lrGrossberg) {
    let totalError = 0;
    for (const sample of dataset) {
      const bmu = this.kohonen.train(sample.input, lrKohonen);
      this.grossberg.train(bmu, sample.target, lrGrossberg);
      const predicted = this.grossberg.predict(bmu);
      totalError += this._mse(predicted, sample.target);
    }
    const avgError = totalError / dataset.length;
    this.errors.push(avgError);
    return avgError;
  }

  train(dataset, epochs, lrKohonen, lrGrossberg, onEpoch, onDone) {
    this._validateDataset(dataset);
    this.errors = [];
    this.lastTrainParams = { epochs, lrKohonen, lrGrossberg };

    Logger.log(
      `CounterPropagationNetwork.train: початок навчання — ${epochs} епох, ${dataset.length} зразків, lrKohonen=${lrKohonen}, lrGrossberg=${lrGrossberg}`,
      "INFO"
    );

    const run = async () => {
      for (let epoch = 0; epoch < epochs; epoch++) {
        await new Promise((r) => setTimeout(r, 0));

        const avgError = this.runEpoch(dataset, lrKohonen, lrGrossberg);

        if (typeof onEpoch === "function") {
          onEpoch(epoch + 1, avgError);
        }
      }

      this.trained = true;

      const result = {
        errors: [...this.errors],
        finalWeightsKoh: this.kohonen.getWeights(),
        finalWeightsGross: this.grossberg.getWeights(),
      };

      Logger.log(
        `CounterPropagationNetwork.train: навчання завершено, фінальна MSE = ${this.errors.at(-1).toFixed(6)}`,
        "INFO"
      );

      if (typeof onDone === "function") {
        onDone(result);
      }

      return result;
    };

    return run();
  }

  /**
   * Виконує передбачення для вхідного вектора через обидва шари мережі.
   * @param {number[]} inputVector — вхідний вектор
   * @returns {number[]} вихідний вектор шару Гроссберга
   */
  predict(inputVector) {
    const bmu = this.kohonen.predict(inputVector);
    return this.grossberg.predict(bmu);
  }

  /**
   * Повертає поточний стан мережі: ваги, розміри, параметри та історію помилок.
   * @returns {{ kohNeurons: number, inputSize: number, outputSize: number, kohonenWeights: number[][], grossbergWeights: number[][], errors: number[], trained: boolean, lastTrainParams: object|null }}
   */
  getStats() {
    return {
      kohNeurons: this.kohNeurons,
      inputSize: this.inputSize,
      outputSize: this.outputSize,
      kohonenWeights: this.kohonen.getWeights(),
      grossbergWeights: this.grossberg.getWeights(),
      errors: [...this.errors],
      trained: this.trained,
      lastTrainParams: this.lastTrainParams ? { ...this.lastTrainParams } : null,
    };
  }
}

window.CounterPropagationNetwork = CounterPropagationNetwork;
