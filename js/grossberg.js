class GrossbergLayer {
  /**
   * Ініціалізує шар Гроссберга з випадковими вагами у діапазоні [0, 1].
   * @param {number} kohNeurons — кількість нейронів (рядків матриці ваг)
   * @param {number} outputSize — розмірність вихідного вектора (стовпців матриці ваг)
   */
  constructor(kohNeurons, outputSize) {
    this.kohNeurons = kohNeurons;
    this.outputSize = outputSize;
    this.weights = this._initWeights();
    Logger.log(
      `GrossbergLayer: ініціалізовано ${kohNeurons} нейронів, розмір виходу ${outputSize}`,
      "INFO"
    );
  }

  /**
   * Генерує матрицю випадкових ваг у діапазоні [0, 1].
   * @returns {number[][]}
   * @private
   */
  _initWeights() {
    return Array.from({ length: this.kohNeurons }, () =>
      Array.from({ length: this.outputSize }, () => Math.random())
    );
  }

  /**
   * Перевіряє коректність індексу нейрона-переможця (BMU).
   * @param {number} bmuIndex
   * @throws {Error} якщо індекс поза межами
   * @private
   */
  _validateBMUIndex(bmuIndex) {
    if (
      typeof bmuIndex !== "number" ||
      !Number.isInteger(bmuIndex) ||
      bmuIndex < 0 ||
      bmuIndex >= this.kohNeurons
    ) {
      Logger.log(
        `GrossbergLayer: некоректний bmuIndex=${bmuIndex} (допустимо 0..${this.kohNeurons - 1})`,
        "ERROR"
      );
      throw new Error(`bmuIndex має бути цілим числом від 0 до ${this.kohNeurons - 1}`);
    }
  }

  /**
   * Перевіряє коректність цільового вектора.
   * @param {number[]} targetVector
   * @throws {Error} якщо вектор порожній, має некоректну довжину або містить NaN
   * @private
   */
  _validateTargetVector(targetVector) {
    if (!Array.isArray(targetVector) || targetVector.length === 0) {
      Logger.log("GrossbergLayer: цільовий вектор порожній або не є масивом", "ERROR");
      throw new Error("targetVector не може бути порожнім");
    }
    if (targetVector.length !== this.outputSize) {
      Logger.log(
        `GrossbergLayer: розмір targetVector (${targetVector.length}) не збігається з outputSize (${this.outputSize})`,
        "ERROR"
      );
      throw new Error(
        `targetVector має містити ${this.outputSize} елементів, отримано ${targetVector.length}`
      );
    }
    if (targetVector.some((v) => typeof v !== "number" || Number.isNaN(v))) {
      Logger.log("GrossbergLayer: targetVector містить NaN або некоректні значення", "ERROR");
      throw new Error("targetVector не може містити NaN");
    }
  }

  /**
   * Навчає шар: оновлює ваги рядка bmuIndex за правилом w = w + lr * (target - w).
   * @param {number} bmuIndex — індекс нейрона-переможця
   * @param {number[]} targetVector — цільовий вихідний вектор
   * @param {number} learningRate — швидкість навчання
   */
  train(bmuIndex, targetVector, learningRate) {
    this._validateBMUIndex(bmuIndex);
    this._validateTargetVector(targetVector);
    for (let k = 0; k < this.outputSize; k++) {
      this.weights[bmuIndex][k] +=
        learningRate * (targetVector[k] - this.weights[bmuIndex][k]);
    }
  }

  /**
   * Повертає вихідний вектор для заданого нейрона-переможця без оновлення ваг.
   * @param {number} bmuIndex — індекс нейрона-переможця
   * @returns {number[]} вихідний вектор
   */
  predict(bmuIndex) {
    this._validateBMUIndex(bmuIndex);
    return [...this.weights[bmuIndex]];
  }

  /**
   * Повертає глибоку копію поточної матриці ваг.
   * @returns {number[][]}
   */
  getWeights() {
    return this.weights.map((row) => [...row]);
  }

  /**
   * Скидає ваги до нових випадкових значень у діапазоні [0, 1].
   * @param {number} kohNeurons — нова кількість нейронів
   * @param {number} outputSize — нова розмірність виходу
   */
  reset(kohNeurons, outputSize) {
    if (
      typeof kohNeurons !== "number" ||
      !Number.isInteger(kohNeurons) ||
      kohNeurons < 1
    ) {
      Logger.log(`GrossbergLayer.reset: некоректний kohNeurons=${kohNeurons}`, "ERROR");
      throw new Error("kohNeurons має бути цілим числом >= 1");
    }
    if (
      typeof outputSize !== "number" ||
      !Number.isInteger(outputSize) ||
      outputSize < 1
    ) {
      Logger.log(`GrossbergLayer.reset: некоректний outputSize=${outputSize}`, "ERROR");
      throw new Error("outputSize має бути цілим числом >= 1");
    }

    this.kohNeurons = kohNeurons;
    this.outputSize = outputSize;
    this.weights = this._initWeights();
    Logger.log(
      `GrossbergLayer.reset: ваги скинуто, нейронів=${kohNeurons}, розмір виходу=${outputSize}`,
      "INFO"
    );
  }
}

window.GrossbergLayer = GrossbergLayer;
