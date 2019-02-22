import BranchHelper from './helpers/BranchHelper';
import Config from './config/Config';
import SemverHelper from './helpers/SemverHelper';
import LogHelper from './helpers/LogHelper';
import FileHandlers from './handlers';
import DeployDataHelper from './helpers/DeployDataHelper';

const semver = require('semver');
const chalk = require('chalk');
const figlet = require('figlet');
const { version } = require('../package.json');

const greet = () => {
  figlet('Semverbot', (err, data) => {
    if (err) {
      return LogHelper.throwException('Could not show greet message.');
    }
    console.log(chalk.blue.bold(data));
    return LogHelper.info(chalk.blue(`Semverbot v${version}`));
  });
};

const init = async () => {
  greet();

  await BranchHelper.checkGitVersion();
  await BranchHelper.checkGitDirectory();
  await BranchHelper.checkCleanliness();
  await BranchHelper.fetchRemote();
  await Config.load();

  let mergedPrefix;
  let incrementType;
  let currentVersion;
  let newVersion;

  const subjectOptions = await BranchHelper.getCommitSubjectOptions();
  const currentBranch = await BranchHelper.getCurrentBranchName();
  const currentRepository = await BranchHelper.getRepositoryName();
  const branchConfig = Config.setBranch(currentBranch);

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
      LogHelper.info(`Merged prefix is ${chalk.underline(mergedPrefix)}. Incrementing ${chalk.underline(incrementType)} version.`);
    } else {
      LogHelper.info(`Forced increment type detected. Incrementing ${chalk.underline(incrementType)}`);
    }
  }

  LogHelper.info(`Current version is ${chalk.underline(currentVersion)}`);
  LogHelper.info(`New version will be ${chalk.underline(newVersion)}`);

  DeployDataHelper.set({
    currentRepository,
    currentBranch,
    subjectOptions,
    mergedPrefix,
    incrementType,
    currentVersion,
    newVersion
  });

  FileHandlers.handleFileUpdate(branchConfig.fileHandlers, newVersion);
  await BranchHelper.pushFiles(branchConfig.fileHandlers);
  await BranchHelper.pushTag(newVersion);
  await DeployDataHelper.sendWebHooks(branchConfig.webHooks);
};

export default {
  init
};

