class KohonenLayer {
  /**
   * Ініціалізує шар Кохонена з випадковими вагами у діапазоні [0, 1].
   * @param {number} inputSize — розмірність вхідного вектора
   */
  constructor(inputSize, neuronCount = CONFIG.kohNeurons) {
    this.inputSize = inputSize;
    this.neuronCount = neuronCount;
    this.weights = this._initWeights();
    Logger.log(
      `KohonenLayer: ініціалізовано ${this.neuronCount} нейронів, розмір входу ${inputSize}`,
      "INFO"
    );
  }

  /**
   * Генерує матрицю випадкових ваг у діапазоні [0, 1].
   * @returns {number[][]}
   * @private
   */
  _initWeights() {
    return Array.from({ length: this.neuronCount }, () =>
      Array.from({ length: this.inputSize }, () => Math.random())
    );
  }

  /**
   * Перевіряє коректність вхідного вектора.
   * @param {number[]} inputVector
   * @throws {Error} якщо вектор порожній або містить NaN
   * @private
   */
  _validateInput(inputVector) {
    if (!Array.isArray(inputVector) || inputVector.length === 0) {
      Logger.log("KohonenLayer: вхідний вектор порожній або не є масивом", "ERROR");
      throw new Error("inputVector не може бути порожнім");
    }
    if (inputVector.some((v) => typeof v !== "number" || Number.isNaN(v))) {
      Logger.log("KohonenLayer: вхідний вектор містить NaN або некоректні значення", "ERROR");
      throw new Error("inputVector не може містити NaN");
    }
    if (inputVector.length !== this.inputSize) {
      Logger.log(
        `KohonenLayer: розмір вектора (${inputVector.length}) не збігається з inputSize (${this.inputSize})`,
        "ERROR"
      );
      throw new Error(
        `Вхідний вектор має містити ${this.inputSize} елементів, отримано ${inputVector.length}`
      );
    }
  }

  /**
   * Обчислює евклідову відстань між двома векторами.
   * @param {number[]} a
   * @param {number[]} b
   * @returns {number}
   * @private
   */
  _euclideanDistance(a, b) {
    return Math.sqrt(a.reduce((sum, val, i) => sum + (val - b[i]) ** 2, 0));
  }

  /**
   * Знаходить нейрон-переможець (BMU) за мінімальною евклідовою відстанню.
   * @param {number[]} inputVector
   * @returns {number} індекс BMU
   * @private
   */
  _findBMU(inputVector) {
    let minDist = Infinity;
    let bmu = 0;
    for (let j = 0; j < this.neuronCount; j++) {
      const dist = this._euclideanDistance(inputVector, this.weights[j]);
      if (dist < minDist) {
        minDist = dist;
        bmu = j;
      }
    }
    return bmu;
  }

  /**
   * Навчає шар: знаходить BMU та оновлює його ваги за правилом w = w + lr * (x - w).
   * @param {number[]} inputVector — вхідний вектор
   * @param {number} learningRate — швидкість навчання
   * @returns {number} індекс нейрона-переможця (BMU)
   */
  train(inputVector, learningRate) {
    this._validateInput(inputVector);
    const bmu = this._findBMU(inputVector);
    for (let k = 0; k < this.inputSize; k++) {
      this.weights[bmu][k] += learningRate * (inputVector[k] - this.weights[bmu][k]);
    }
    return bmu;
  }

  /**
   * Знаходить BMU для вхідного вектора без оновлення ваг.
   * @param {number[]} inputVector — вхідний вектор
   * @returns {number} індекс нейрона-переможця (BMU)
   */
  predict(inputVector) {
    this._validateInput(inputVector);
    return this._findBMU(inputVector);
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
   * @param {number} inputSize — новий розмірність вхідного вектора
   */
  reset(inputSize, neuronCount = CONFIG.kohNeurons) {
    this.inputSize = inputSize;
    this.neuronCount = neuronCount;
    this.weights = this._initWeights();
    Logger.log(
      `KohonenLayer.reset: ваги скинуто, розмір входу ${inputSize}, нейронів ${this.neuronCount}`,
      "INFO"
    );
  }
}

window.KohonenLayer = KohonenLayer;
