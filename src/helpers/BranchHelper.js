import ShellHelper from './ShellHelper';
import LogHelper from './LogHelper';
import until from './Until';
import SemverHelper from './SemverHelper';
import Config from '../config/Config';
import DeployDataHelper from './DeployDataHelper';

const chalk = require('chalk');
const semver = require('semver');
const shell = require('shelljs');

const taggedBranches = [];
const branchLocators = [
  'Merge in (.*) \(pull request',
  "Merge branch \'(.*)\'",
  'Merge branch \"(.*)\"',

];

const checkGitVersion = async () => {
  const [, err] = await until(ShellHelper.exec('git --version'));
  if (!err) {
    return true;
  }
  return LogHelper.throwException('You must install git before using averta.', null, false);
};

const checkGitDirectory = async () => {
  const [resultLines, err] = await until(ShellHelper.exec('git rev-parse --is-inside-work-tree'));
  if (resultLines && resultLines[0] === 'true') {
    return true;
  } else if (err) {
    return LogHelper.throwException('Could not check whether current directory is a git project.', err, false);
  }
  return LogHelper.throwException('You must be inside a git directory in order to use averta.', null, false);
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

const fetchRemote = async () => {
  const spinner = LogHelper.spinner('Fetching branches');
  const [, fetchedErr] = await until(ShellHelper.exec('git fetch && git pull'));
  spinner.stop(true);
  if (fetchedErr) {
    return LogHelper.throwException('Could not fetch remote branches', fetchedErr);
  }
  return true;
};

const isBranchClean = async (branchName) => {
  const [diff, err] = await until(ShellHelper.exec(`git diff ${branchName} | head -1`));
  if (!err) {
    return !diff;
  }
  return LogHelper.throwException('Could not get branch diff', err);
};

const getBranchPushTimestamp = async (branchName) => {
  const [reflogLines, err] = await until(ShellHelper.exec(`git reflog show ${branchName} --pretty='%gd' --date=unix -n 1`));
  if (reflogLines) {
    const timestampMatches = reflogLines[0].match('\@\{([0-9]+)\}');
    if (timestampMatches && timestampMatches[1]) {
      return +timestampMatches[1];
    }
  }
  return LogHelper.throwException(`Could not get reflog for branch ${branchName}`, err);
};

const getAvailablePrefixes = () => {
  const { rules } = Config.current();
  return rules.major.prefixes
    .concat(rules.minor.prefixes)
    .concat(rules.patch.prefixes);
};

const getBranchNamePrefix = (branchName) => {
  const splitName = branchName.split('/');
  if (splitName.length > 1) {
    return splitName[0];
  }
  return undefined;
};

const getReferencePrefix = async (commit) => {
  const currentBranchName = await getCurrentBranchName();
  const mergedBranchNames = await getBranchNamesFromCommitHash(commit.parentHash);
  const availablePrefixes = getAvailablePrefixes();

  const candidateBranches = (
    await Promise.all(mergedBranchNames
      .filter(name => name !== currentBranchName)
      .filter(name => availablePrefixes.includes(getBranchNamePrefix(name)))
      .filter(name => !taggedBranches.includes(name))
      .filter(name => isBranchClean(name))
      .map(async name => ({ name, date: await getBranchPushTimestamp(name) })))
  )
    .filter(branch => branch.date <= commit.date)
    .sort((branchA, branchB) => branchB.date - branchA.date);

  if (!candidateBranches.length) {
    return null;
  }

  const splitName = candidateBranches[0].name.split('/');
  if (splitName.length > 1) {
    taggedBranches.push(candidateBranches[0].name);
    return splitName[0];
  }

  return null;
};

const getBodyPrefix = (commit) => {
  const availablePrefixes = getAvailablePrefixes();
  let mergePrefix;
  commit.body
    .filter(line => av)
};

const getLastTag = async () => {
  const [tagLines, err] = await until(ShellHelper.exec('git describe --abbrev=0'));
  if (tagLines) {
    return tagLines[0];
  }
  return LogHelper.throwException('No tag was found', err);
};

const getCommitBodyVersion = (body) => {
  let cleanVersion = null;
  body.reverse().forEach((line) => {
    const lineVersion = SemverHelper.parseLineToVersion(line);
    cleanVersion = semver.valid(lineVersion) ? lineVersion : null;
  });

  if (cleanVersion) {
    return cleanVersion;
  }

  LogHelper.info('No valid version was found in commit subject');
  return null;
};

const resetChanges = () => {
  LogHelper.info('Resetting all changes and commits...');
  if (shell.exec('git reset --hard', { silent: true }).code !== 0) {
    LogHelper.error('Could not reset changes. You must discard them yourself before using averta again.');
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
  const message = DeployDataHelper.fillTemplate(Config.current().messages.commit);
  const spinner = LogHelper.spinner('Pushing...');
  const branchName = await getCurrentBranchName();
  const [, err] = await until(ShellHelper.exec(`git commit -m "${message}" && git push origin ${branchName}`));
  spinner.stop(true);
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

const pushTag = async (tag) => {
  const message = DeployDataHelper.fillTemplate(Config.current().messages.tag);
  const prefix = 'v';
  const [tagLines, err] = await until(ShellHelper.exec(`git tag -a ${prefix}${tag} -m "${message}" && git push origin ${prefix}${tag}`));
  if (err) {
    return LogHelper.throwException(`Could not create a tag named ${prefix}${tag}`, err);
  }
  LogHelper.info(`Tag ${prefix}${tag} was added and pushed successfully.`);
  return tagLines;
};

const getRepositoryName = async () => {
  const [nameLines, err] = await until(ShellHelper.exec('git rev-parse --show-toplevel'));
  if (err) {
    return LogHelper.throwException('Could not obtain repository name', err);
  }
  return nameLines[0].split('/').slice(-1);
};

const getCommitBody = async (hash) => {
  const [bodyLines, err] = await until(ShellHelper.exec(`git log ${hash} -n 1 --pretty=%B`));
  if (err) {
    return LogHelper.throwException(`Could not obtain commit ${hash} body`, err);
  }
  return bodyLines;
};

const getCommitsSinceTag = async (tag) => {
  const branchName = await getCurrentBranchName();
  const [hashesLines, err] = await until(ShellHelper.exec(`git log ${branchName} ${tag}..HEAD --pretty=format:'%H %ct %P'`));
  if (!err) {
    return Promise.all((hashesLines || []).map(async line => (
      {
        hash: line.split(' ')[0],
        date: line.split(' ')[1],
        parentHash: line.split(' ')[2],
        isMerge: line.split(' ').length > 3,
        body: await getCommitBody(line.split(' ')[0])
      }
    )).reverse());
  }
  return LogHelper.throwException(`Could not obtain commits since tag ${tag}`, err);
};

export default {
  fetchRemote,
  checkGitVersion,
  checkCleanliness,
  checkGitDirectory,
  getCommitBodyVersion,
  getCurrentBranchName,
  getLastTag,
  getReferencePrefix,
  resetChanges,
  pushFiles,
  pushTag,
  getRepositoryName,
  getCommitsSinceTag
};
