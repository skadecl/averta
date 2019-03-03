import BranchHelper from './helpers/BranchHelper';
import Config from './config/Config';
import SemverHelper from './helpers/SemverHelper';
import LogHelper from './helpers/LogHelper';
import SubjectOptionsHelper from './helpers/SubjectOptionsHelper';

const semver = require('semver');
const chalk = require('chalk');
const figlet = require('figlet');
const { version } = require('../package.json');

const greet = () => {
  figlet('Averta', (err, data) => {
    if (err) {
      return LogHelper.throwException('Could not show greet message.');
    }
    console.log(chalk.blue.bold(data));
    return LogHelper.info(chalk.blue(`Averta v${version}`));
  });
};

const init = async () => {
  greet();

  await BranchHelper.checkGitVersion();
  await BranchHelper.checkGitDirectory();
  await BranchHelper.checkCleanliness();
  await BranchHelper.fetchRemote();
  await Config.load();

  const currentBranch = await BranchHelper.getCurrentBranchName();
  // const currentRepository = await BranchHelper.getRepositoryName();
  // const lastTag = await BranchHelper.getLastTag();
  const lastTag = 'v1.5.3';
  const commitsSinceTag = await BranchHelper.getCommitsSinceTag(lastTag);
  // const branchConfig = Config.setBranch(currentBranch);
  Config.setBranch(currentBranch);

  let currentVersion = SemverHelper.parseLineToVersion(lastTag);

  for (let i = 0; i < commitsSinceTag.length; i++) {
    let newVersion;
    const commit = commitsSinceTag[i];

    LogHelper.info(`Processing commit ${chalk.bold(commit.hash)}`);

    commit.options = SubjectOptionsHelper.build(commit.body);
    if (commit.options.SKIP) {
      LogHelper.info('Skip option detected in commit subject');
      commit.skip = true;
    } else if (commit.options.FORCE_VERSION) {
      LogHelper.info('Force VERSION option detected in commit subject');
      commit.force = true;
      commit.version = BranchHelper.getCommitBodyVersion(commit.body);
    } else if (commit.options.FORCE_MAJOR) {
      LogHelper.info('Force MAJOR option detected in commit subject');
      commit.increment = 'major';
    } else if (commit.options.FORCE_MINOR) {
      LogHelper.info('Force MINOR option detected in commit subject');
      commit.increment = 'minor';
    } else if (commit.options.FORCE_PATCH) {
      LogHelper.info('Force PATCH option detected in commit subject');
      commit.increment = 'patch';
    } else if (commit.isMerge) {
      commit.prefix = await BranchHelper.getReferencePrefix(commit);
      commit.increment = SemverHelper.getIncrementType(commit.prefix);
    } else {
      LogHelper.info('No valid option nor merge were detected');
      commit.skip = true;
    }

    if (commit.increment || commit.force) {
      newVersion = commit.force ? commit.version : semver.inc(currentVersion, commit.increment);

      if (newVersion) {
        LogHelper.info(`Current version is ${chalk.underline(currentVersion)}`);
        LogHelper.info(`New version will be ${chalk.underline(newVersion)}`);
        currentVersion = newVersion;
      }
    } else {
      LogHelper.info('Skipping commit...');
    }
  }

  // FileHandlers.handleFileUpdate(branchConfig.fileHandlers, newVersion);
  // await BranchHelper.pushFiles(branchConfig.fileHandlers);
  // await BranchHelper.pushTag(newVersion);
  // await DeployDataHelper.sendWebHooks(branchConfig.webHooks);
};

export default {
  init
};

