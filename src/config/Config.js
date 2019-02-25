import LogHelper from '../helpers/LogHelper';
import ConfigSchema from './configSchema';

const jsonFile = require('edit-json-file');
const process = require('process');
const chalk = require('chalk');
const JSONValidator = require('jsonschema').Validator;

const avertaConfig = {
  loaded: false,
  valid: false,
  current: null,
  data: null
};

const isConfigValid = () => {
  const configValidator = new JSONValidator();
  Object.keys(ConfigSchema)
    .forEach(schema => configValidator.addSchema(ConfigSchema[schema], ConfigSchema[schema].id));
  const result = configValidator.validate(avertaConfig.data, ConfigSchema.Config);

  if (result.errors.length) {
    result.errors.forEach((error) => {
      const propName = `${error.property.replace('instance', 'Config')}`;
      LogHelper.error(`${propName} ${error.message}`);
    });

    LogHelper.throwException(`Config file is not valid ${chalk.white.underline('(see errors above)')}.`);
  }

  return !!result.errors.length;
};

const load = () => new Promise((resolve) => {
  const rootPath = process.cwd();
  const config = jsonFile(`${rootPath}/avertaconfig.json`);

  if (config.data) {
    config.data.rootPath = rootPath;
    avertaConfig.data = config.data;
    avertaConfig.loaded = true;
    avertaConfig.valid = isConfigValid();
    resolve(avertaConfig.data);
  } else {
    LogHelper.throwException('avertaconfig.json file not found.');
  }
});

const all = () => avertaConfig.data;

const current = () => avertaConfig.current;

const setBranch = (branchName) => {
  const config = avertaConfig.data.find(cfg => cfg.targetBranches.includes(branchName));
  if (config) {
    avertaConfig.current = config;
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
