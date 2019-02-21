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
  let incrementType;
  let currentVersion;
  let newVersion;

  if (subjectOptions.SKIP) {
    LogHelper.exit('Skip option detected in commit subject', 'Skipping');
  } else if (subjectOptions.FORCE_MAJOR) {
    incrementType = 'major';
  } else if (subjectOptions.FORCE_MINOR) {
    incrementType = 'minor';
  } else if (subjectOptions.FORCE_PATCH) {
    incrementType = 'patch';
  }

  if (!incrementType) {
    mergedPrefix = await BranchHelper.getLastMergedPrefix();
    incrementType = SemverHelper.getIncrementType(mergedPrefix);
  }

  if (subjectOptions.FORCE_VERSION) {
    currentVersion = await BranchHelper.getCommitSubjectVersion();
    newVersion = currentVersion;
    LogHelper.info('Force version option was detected. Version not incrementing');
  } else {
    currentVersion = await BranchHelper.getLastTagVersion();
    newVersion = semver.inc(currentVersion, incrementType);
    if (mergedPrefix) {
      LogHelper.info(`Merged prefix is ${chalk.underline.green(mergedPrefix)}. Incrementing ${chalk.underline.yellow(incrementType)} version.`);
    } else {
      LogHelper.info(`Forced increment type detected. Incrementing ${chalk.underline(incrementType)}`);
    }
  }

  LogHelper.info(`Current version is ${chalk.underline.blue(currentVersion)}`);
  LogHelper.info(`New version will be ${chalk.underline.blue(newVersion)}`);
};

export default {
  init
};

