import ShellHelper from './ShellHelper';
import LogHelper from './LogHelper';
import until from './Until';
import Config from '../config/Config';
import SubjectOptionsHelper from './SubjectOptionsHelper';

const chalk = require('chalk');
const semver = require('semver');

const checkCleanliness = async () => {
  const [dirty, err] = await until(ShellHelper.exec('git diff --quiet || echo "dirty"'));
  if (err) {
    return LogHelper.throwException('Could not check directory cleanliness', err);
  } else if (dirty) {
    return LogHelper.throwException(`Directory is not clean. You must ${chalk.underline('commit')} or ${chalk.underline('discard')} your changes first.`);
  }
  return true;
};

const getCurrentBranchName = async () => {
  const [nameLines, err] = await until(ShellHelper.exec('git rev-parse --abbrev-ref HEAD'));
  if (!err) {
    return nameLines[0];
  }
  return LogHelper.throwException('Could not get current branch name', err);
};

const checkBranchInConfig = async () => {
  const currentBranchName = await getCurrentBranchName();
  if (Config.get().branches.includes(currentBranchName)) {
    return true;
  }
  return LogHelper.exit('Current branch is not included in config file', 'Skipping...');
};

const getBranchNamesFromCommitHash = async (hash) => {
  const [branchNames, err] = await until(ShellHelper.exec(`git branch --contains ${hash} --format='%(refname:short)'`));
  if (branchNames) {
    return branchNames;
  }
  return LogHelper.throwException('Could not find last merged branch', err);
};

const getCommitSubjectOptions = async () => {
  const [subjectLines, err] = await until(ShellHelper.exec('git log -1 --pretty=%B | cat'));
  if (subjectLines) {
    subjectLines.push('ddiaskdjaskdj ksajdask [svb major]');
    return SubjectOptionsHelper.build(subjectLines);
  }
  return LogHelper.throwException('Could not get last commit subject', err);
};

const fetchRemote = async () => {
  const spinner = LogHelper.spinner('Fetching branches');
  const [, fetchedErr] = await until(ShellHelper.exec('git fetch'));
  spinner.stop(true);
  if (fetchedErr) {
    return LogHelper.throwException('Could not fetch remote branches', fetchedErr);
  }
  return true;
};

const getLastMergedBranchesNames = async () => {
  const [hashesLines, hashesErr] = await until(ShellHelper.exec('git log --merges --first-parent master -n 1 --pretty=%P'));
  if (hashesLines) {
    const commitHash = hashesLines[0].split(' ')[0];
    return getBranchNamesFromCommitHash(commitHash);
  }
  return LogHelper.throwException('Could not find last merged branch', hashesErr);
};

const getLastMergedPrefix = async () => {
  const currentBranchName = await getCurrentBranchName();
  const mergedBranchNames = await getLastMergedBranchesNames();
  const lasMergedBranchName = mergedBranchNames.filter(name => name !== currentBranchName)[0];
  const splittedName = lasMergedBranchName.split('/');
  if (splittedName.length > 1) {
    return splittedName[0];
  }
  return LogHelper.throwException('Could not extract prefix from last merged branch');
};

const getLastTagVersion = async () => {
  const [tagLines, err] = await until(ShellHelper.exec('git describe --abbrev=0'));
  if (tagLines) {
    return semver.clean(tagLines[0]);
  }
  return LogHelper.throwException('Could not get last tag', err);
};

export default {
  fetchRemote,
  checkCleanliness,
  getCurrentBranchName,
  getCommitSubjectOptions,
  getLastTagVersion,
  checkBranchInConfig,
  getLastMergedPrefix
};