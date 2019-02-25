import ProcessHelper from './ProcessHelper';

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
  let messageOutput = `[Averta] ${message}`;
  if (description) {
    messageOutput += `: ${chalk.blue(description)}`;
  }

  log(messageOutput);

  process.exit(0);
};

const error = (message, description) => {
  let messageOutput = `[ERROR] ${chalk.bold.red(message)}`;
  if (description) {
    messageOutput += `: ${description}`;
  }

  log(messageOutput);
};

const throwException = (message, description, resetChanges = true) => {
  error(message);

  if (description && description.length) {
    info('Cmd output', description);
  }

  const exitCode = resetChanges ?
    ProcessHelper.EXIT_CODES.RESET : ProcessHelper.EXIT_CODES.NO_RESET;

  process.exit(exitCode);
};


export default {
  spinner,
  info,
  error,
  exit,
  throwException
};
