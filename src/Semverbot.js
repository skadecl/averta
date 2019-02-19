import BranchHelper from './helpers/BranchHelper';
import Config from './config/Config';
import SemverHelper from './helpers/SemverHelper';
import LogHelper from './helpers/LogHelper';

const semver = require('semver');

const init = async () => {
  await Config.load();
  await BranchHelper.fetchRemote();
  await BranchHelper.checkCleanliness();
  await BranchHelper.checkBranchInConfig();

  const subjectOptions = await BranchHelper.getCommitSubjectOptions();
  let increaseType;

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

  const lastTag = await BranchHelper.getLastTagVersion();
  console.log('deploy tipe: ', increaseType);
  console.log('last version: ', lastTag);
  console.log('new version: ', semver.inc(lastTag, increaseType));
};

export default {
  init
};

