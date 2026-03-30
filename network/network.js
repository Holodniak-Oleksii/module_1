import { KohonenLayer } from "./kohonen.js";
import { GrossbergLayer } from "./grossberg.js";
import { log } from "../utils/logger.js";

export class CounterPropagationNetwork {
  constructor(inputSize, outputSize, config) {
    this.kohonen = new KohonenLayer(inputSize, config.kohonenNeurons, config.learningRate);
    this.grossberg = new GrossbergLayer(config.kohonenNeurons, outputSize, config.learningRate);
    this.epochs = config.epochs;
  }

  train(data) {
    log("Training started");
    const errors = [];

    for (let epoch = 0; epoch < this.epochs; epoch++) {
      let totalError = 0;

      data.forEach(({ input, target }) => {
        const winner = this.kohonen.train(input);
        const output = this.grossberg.predict(winner);

        const error = output.reduce((sum, val, i) => sum + Math.abs(target[i] - val), 0);
        totalError += error;

        this.grossberg.train(winner, target);
      });

      errors.push(totalError);
      log(`Epoch ${epoch + 1}: error = ${totalError.toFixed(4)}`);
    }

    log("Training finished");
    return errors;
  }

  predict(input) {
    const winner = this.kohonen.getWinner(input);
    const result = this.grossberg.predict(winner);
    log(`Predict → winner: ${winner}, result: ${result.map(x=>x.toFixed(2))}`);
    return result;
  }
}