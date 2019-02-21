import LogHelper from '../helpers/LogHelper';
import configSchema from './configSchema';

const jsonFile = require('edit-json-file');
const process = require('process');
const chalk = require('chalk');
const JSONValidator = require('jsonschema').Validator;

const semverbotConfig = {
  loaded: false,
  valid: false,
  current: null,
  data: null
};

const isConfigValid = () => {
  const configValidator = new JSONValidator();
  configValidator.addSchema(configSchema);
  const result = configValidator.validate(semverbotConfig.data, configSchema);

  if (result.errors.length) {
    result.errors.forEach((error) => {
      const propName = `${error.property.replace('instance.', 'Config.')}`;
      LogHelper.error(`${propName} ${error.message}`);
    });

    LogHelper.throwException(`Config file is not valid ${chalk.white.underline('(see errors above)')}.`);
  }

  return !!result.errors.length;
};

const load = () => new Promise((resolve) => {
  const rootPath = process.cwd();
  const config = jsonFile(`${rootPath}/../semverconfig.json`);

  if (config.data) {
    config.data.rootPath = rootPath;
    semverbotConfig.data = config.data;
    semverbotConfig.loaded = true;
    semverbotConfig.valid = isConfigValid();
    resolve(semverbotConfig.data);
  } else {
    LogHelper.throwException('semverconfig.json file not found.');
  }
});

const all = () => semverbotConfig.data;

const current = () => semverbotConfig.current;

const setBranch = (branchName) => {
  const config = semverbotConfig.data.find(cfg => cfg.branches.includes(branchName));
  if (config) {
    semverbotConfig.current = config;
    return config;
  }
  return LogHelper.throwException(`Branch ${chalk.underline(branchName)} was not found in configuration file.`);
};


export default {
  load,
  all,
  setBranch,
  current
};
