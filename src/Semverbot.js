import BranchHelper from './helpers/BranchHelper';
import Config from './config/Config';
import SemverHelper from './helpers/SemverHelper';
import LogHelper from './helpers/LogHelper';

const semver = require('semver');
const chalk = require('chalk');

const init = async () => {
  await Config.load();
  await BranchHelper.fetchRemote();
  await BranchHelper.checkCleanliness();
  await BranchHelper.checkBranchInConfig();

  const subjectOptions = await BranchHelper.getCommitSubjectOptions();
  let mergedPrefix;
  let increaseType;
  let currentVersion;
  let newVersion;

  if (subjectOptions.SKIP) {
    LogHelper.exit('Skip option detected in commit subject', 'Skipping');
  } else if (subjectOptions.FORCE_MAJOR) {
    increaseType = 'major';
  } else if (subjectOptions.FORCE_MINOR) {
    increaseType = 'minor';
  } else if (subjectOptions.FORCE_PATCH) {
    increaseType = 'patch';
  }

  if (!increaseType) {
    mergedPrefix = await BranchHelper.getLastMergedPrefix();
    increaseType = SemverHelper.getIncreaseType(mergedPrefix);
  }

  if (subjectOptions.FORCE_VERSION) {
    currentVersion = await BranchHelper.getCommitSubjectVersion();
    newVersion = currentVersion;
    LogHelper.info('Force version option was detected. Version not increasing');
  } else {
    currentVersion = await BranchHelper.getLastTagVersion();
    newVersion = semver.inc(currentVersion, increaseType);
    if (mergedPrefix) {
      LogHelper.info(`Merged prefix is ${chalk.underline.green(mergedPrefix)}. Increasing ${chalk.underline.yellow(increaseType)} version.`);
    } else {
      LogHelper.info(`Forced increase type detected. Ingreasing ${chalk.underline(increaseType)}`);
    }
  }

  LogHelper.info(`Current version is ${chalk.underline.blue(currentVersion)}`);
  LogHelper.info(`New version will be ${chalk.underline.blue(newVersion)}`);
};

export default {
  init
};

