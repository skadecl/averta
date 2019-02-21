import ShellHelper from './ShellHelper';
import LogHelper from './LogHelper';
import until from './Until';
import SubjectOptionsHelper from './SubjectOptionsHelper';
import SemverHelper from './SemverHelper';

const chalk = require('chalk');
const semver = require('semver');
const shell = require('shelljs');

const checkGitVersion = async () => {
  const [, err] = await until(ShellHelper.exec('git --version'));
  if (!err) {
    return true;
  }
  return LogHelper.throwException('You must install git before using semverbot.', null, false);
};

const checkGitDirectory = async () => {
  const [resultLines, err] = await until(ShellHelper.exec('git rev-parse --is-inside-work-tree'));
  if (resultLines && resultLines[0] === 'true') {
    return true;
  } else if (err) {
    return LogHelper.throwException('Could not check whether current directory is a git project.', err, false);
  }
  return LogHelper.throwException('You must be inside a git directory in order to use semverbot.', null, false);
};

const checkCleanliness = async () => {
  const [dirty, err] = await until(ShellHelper.exec('git diff --quiet || echo "dirty"'));
  if (err) {
    return LogHelper.throwException('Could not check directory cleanliness.', err, false);
  } else if (dirty) {
    return LogHelper.throwException(`Directory is not clean. You must ${chalk.underline('commit')} or ${chalk.underline('discard')} your changes first.`, null, false);
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

const getBranchNamesFromCommitHash = async (hash) => {
  const [branchNames, err] = await until(ShellHelper.exec(`git branch --contains ${hash} --format='%(refname:short)' --merged`));
  if (branchNames) {
    return branchNames;
  }
  return LogHelper.throwException('Could not find last merged branch', err);
};

const getCommitSubjectOptions = async () => {
  const [subjectLines, err] = await until(ShellHelper.exec('git log -1 --pretty=%B | head -1'));
  if (subjectLines) {
    return SubjectOptionsHelper.build(subjectLines);
  }
  return LogHelper.throwException('Could not get last commit subject', err);
};

const fetchRemote = async () => {
  const spinner = LogHelper.spinner('Fetching branches');
  const [, fetchedErr] = await until(ShellHelper.exec('git fetch && git pull'));
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

const isBranchClean = async (branchName) => {
  const [diff, err] = await until(ShellHelper.exec(`git diff ${branchName} | head -1`));
  if (!err) {
    return !diff;
  }
  return LogHelper.throwException('Could not get branch diff', err);
};

const getBranchPushTimestamp = async (branchName) => {
  const [reflogLines, err] = await until(ShellHelper.exec(`git reflog show ${branchName} --pretty=\'%gd\' --date=unix -n 1`));
  if (reflogLines) {
    const timestampMatches = reflogLines[0].match('\@\{([0-9]+)\}');
    if (timestampMatches && timestampMatches[1]) {
      return +timestampMatches[1];
    }
  }
  return LogHelper.throwException(`Could not get reflog for branch ${branchName}`, err);
};

const getLastMergedPrefix = async () => {
  const currentBranchName = await getCurrentBranchName();
  const mergedBranchNames = await getLastMergedBranchesNames();
  const candidateBranches = (
    await Promise.all(mergedBranchNames
      .filter(name => name !== currentBranchName)
      .filter(name => isBranchClean(name))
      .map(async name => ({ name, date: await getBranchPushTimestamp(name) })))
  ).sort((branchA, branchB) => branchA.date - branchB.date);

  if (!candidateBranches) {
    LogHelper.throwException('Could not find a suitable merged branch candidate');
  }

  const splitName = candidateBranches[0].name.split('/');
  if (splitName.length > 1) {
    return splitName[0];
  }

  return LogHelper.throwException('Could not extract prefix from last merged branch');
};

const getLastTagVersion = async () => {
  const [tagLines, err] = await until(ShellHelper.exec('git describe --abbrev=0'));
  if (tagLines) {
    return SemverHelper.parseLineToVersion(tagLines[0]);
  }
  return LogHelper.throwException('No tag was found', err);
};

const getCommitSubjectVersion = async () => {
  const [subjectLines, err] = await until(ShellHelper.exec('git log -1 --pretty=%B | head -1'));
  if (subjectLines) {
    let cleanVersion = null;
    subjectLines.forEach((line) => {
      const lineVersion = SemverHelper.parseLineToVersion(line);
      cleanVersion = semver.valid(lineVersion) ? lineVersion : null;
    });

    if (cleanVersion) {
      return cleanVersion;
    }
    return LogHelper.throwException('No valid version could be obtained from last commit subject.');
  }
  return LogHelper.throwException('Could not get last commit subject', err);
};

const resetChanges = () => {
  LogHelper.info('Resetting all changes and commits...');
  if (shell.exec('git reset --hard', { silent: true }).code !== 0) {
    LogHelper.error('Could not reset changes. You must discard them yourself before using semverbot again.');
  }
};

const addFile = async (fileUrl) => {
  const [, err] = await until(ShellHelper.exec(`git add ${fileUrl}`));
  if (err) {
    return LogHelper.throwException(`Could not add file ${fileUrl}`, err);
  }
  return true;
};

const addFiles = async (fileHandlers) => {
  let fileUrls = [];
  Object.keys(fileHandlers)
    .forEach((locator) => {
      const locatorFiles = fileHandlers[locator].map(file => file.url);
      fileUrls = fileUrls.concat(locatorFiles);
    });

  fileUrls = fileUrls.map(async url => addFile(url));
  return Promise.all(fileUrls);
};

const commitAndPush = async () => {
  const message = 'Example commit';
  const [, err] = await until(ShellHelper.exec(`git commit -m "${message}"`));
  if (!err) {
    return true;
  }
  return LogHelper.throwException('Could not commit/push changed files', null, false);
};

const pushFiles = async (fileHandlers) => {
  await addFiles(fileHandlers);
  LogHelper.info('All files were added successfully');
  const spinner = LogHelper.spinner('Pushing...');
  await commitAndPush();
  spinner.stop(true);
  LogHelper.info('All files were committed and pushed successfully');
  return true;
};

export default {
  fetchRemote,
  checkGitVersion,
  checkCleanliness,
  checkGitDirectory,
  getCommitSubjectVersion,
  getCurrentBranchName,
  getCommitSubjectOptions,
  getLastTagVersion,
  getLastMergedPrefix,
  resetChanges,
  pushFiles
};
