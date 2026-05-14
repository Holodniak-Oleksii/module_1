function validateTrainingParams(params, minClasses = 6) {
  const errors = [];

  if (
    Number.isNaN(params.kohNeurons) ||
    params.kohNeurons < 2 ||
    params.kohNeurons > 20
  ) {
    errors.push({ field: "kohNeurons", message: "Введіть ціле число від 2 до 20" });
  } else if (params.kohNeurons < minClasses) {
    errors.push({
      field: "kohNeurons",
      message: `Для розпізнавання кольорів потрібно щонайменше ${minClasses} нейронів Кохонена`,
    });
  }

  if (
    Number.isNaN(params.learningRateKohonen) ||
    params.learningRateKohonen < 0.01 ||
    params.learningRateKohonen > 1
  ) {
    errors.push({
      field: "learningRateKohonen",
      message: "Коефіцієнт має бути від 0.01 до 1.0",
    });
  }

  if (
    Number.isNaN(params.learningRateGrossberg) ||
    params.learningRateGrossberg < 0.01 ||
    params.learningRateGrossberg > 1
  ) {
    errors.push({
      field: "learningRateGrossberg",
      message: "Коефіцієнт має бути від 0.01 до 1.0",
    });
  }

  if (
    Number.isNaN(params.maxEpochs) ||
    params.maxEpochs < 1 ||
    params.maxEpochs > 500 ||
    !Number.isInteger(params.maxEpochs)
  ) {
    errors.push({ field: "maxEpochs", message: "Кількість епох має бути цілим числом від 1 до 500" });
  }

  return errors;
}

window.validateTrainingParams = validateTrainingParams;
