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
  let increaseType;
  let lastVersion;

  if (subjectOptions.SKIP) {
    LogHelper.exit('Skip option detected in sommit subject', 'Skipping');
  } else if (subjectOptions.FORCE_MAJOR) {
    increaseType = 'major';
  } else if (subjectOptions.FORCE_MINOR) {
    increaseType = 'minor';
  } else if (subjectOptions.FORCE_PATCH) {
    increaseType = 'patch';
  }

  if (!increaseType) {
    const mergedPrefix = await BranchHelper.getLastMergedPrefix();
    increaseType = SemverHelper.getIncreaseType(mergedPrefix);
  }

  if (subjectOptions.FORCE_VERSION) {
    lastVersion = await BranchHelper.getCommitSubjectVersion();
    if (!lastVersion) {
      LogHelper.throwException(`Failed to force version: ${chalk.underline('No valid version was found in commit subject.')}`);
    }
  } else {
    lastVersion = await BranchHelper.getLastTagVersion();
  }

  console.log('Increase type: ', increaseType);
  console.log('Last version: ', lastVersion);
  console.log('New version: ', semver.inc(lastVersion, increaseType));
};

export default {
  init
};

