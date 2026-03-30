export class KohonenLayer {
  constructor(inputSize, neuronCount, learningRate) {
    this.learningRate = learningRate;
    this.weights = Array.from({ length: neuronCount }, () =>
      Array.from({ length: inputSize }, () => Math.random()),
    );
  }

  distance(a, b) {
    return Math.sqrt(a.reduce((sum, val, i) => sum + (val - b[i]) ** 2, 0));
  }

  getWinner(input) {
    let minDist = Infinity,
      winner = 0;
    this.weights.forEach((w, i) => {
      const dist = this.distance(input, w);
      if (dist < minDist) {
        minDist = dist;
        winner = i;
      }
    });
    return winner;
  }

  train(input) {
    const winner = this.getWinner(input);
    this.weights[winner] = this.weights[winner].map(
      (w, i) => w + this.learningRate * (input[i] - w),
    );
    return winner;
  }
}
