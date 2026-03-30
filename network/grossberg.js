export class GrossbergLayer {
  constructor(kohonenNeurons, outputSize, learningRate) {
    this.learningRate = learningRate;
    this.weights = Array.from({ length: kohonenNeurons }, () =>
      Array.from({ length: outputSize }, () => Math.random()),
    );
  }

  train(winnerIndex, target) {
    this.weights[winnerIndex] = this.weights[winnerIndex].map(
      (w, i) => w + this.learningRate * (target[i] - w),
    );
  }

  predict(winnerIndex) {
    return this.weights[winnerIndex];
  }
}
