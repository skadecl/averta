import BranchHelper from './BranchHelper';
import LogHelper from './LogHelper';

const process = require('process');

const EXIT_CODES = {
  SUCCESS: 0,
  RESET: -1,
  NO_RESET: 1
};

const handleProcessExit = (exitCode, err) => {
  if (err) {
    console.log(err);
    LogHelper.error('Something went wrong.');
  }

  if (exitCode === EXIT_CODES.RESET) {
    BranchHelper.resetChanges();
  }
};

const initProcessEventHandlers = () => {
  process.on('exit', exitCode => handleProcessExit(exitCode));
  process.on('uncaughtException', err => handleProcessExit(EXIT_CODES.RESET, err));
  process.on('unhandledRejection', err => handleProcessExit(EXIT_CODES.RESET, err));
  process.on('SIGINT', () => handleProcessExit(EXIT_CODES.RESET));
  process.on('SIGTERM', () => handleProcessExit(EXIT_CODES.RESET));
  process.on('SIGQUIT', () => handleProcessExit(EXIT_CODES.RESET));
};

export default {
  initProcessEventHandlers,
  EXIT_CODES
};
