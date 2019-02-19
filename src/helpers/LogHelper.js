const chalk = require('chalk');
const process = require('process');
const { Spinner } = require('cli-spinner');

const { log } = console;

// Default spinner options
Spinner.setDefaultSpinnerString(18);

const spinner = (message) => {
  const spinnerInstance = new Spinner(message);
  spinnerInstance.start();
  return spinnerInstance;
};

const info = (message, description) => {
  let messageOutput = `[INFO] ${message}`;
  if (description) {
    messageOutput += `: ${chalk.underline(description)}`;
  }

  log(messageOutput);
};

const exit = (message, description) => {
  let messageOutput = `[SEMVERBOT] ${message}`;
  if (description) {
    messageOutput += `: ${chalk.blue(description)}`;
  }

  log(messageOutput);

  process.exit(0);
};

const error = (message, description) => {
  let messageOutput = `[ERROR] ${message}`;
  if (description) {
    messageOutput += `: ${chalk.bold.red(description)}`;
  }

  log(messageOutput);
};

const throwException = (message, description) => {
  error(message);

  if (description && description.length) {
    info('Cmd output', description);
  }

  process.exit(-1);
};


export default {
  spinner,
  info,
  error,
  exit,
  throwException
};
