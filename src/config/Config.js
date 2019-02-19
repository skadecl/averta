import LogHelper from '../helpers/LogHelper';
import configSchema from './configSchema';

const jsonFile = require('edit-json-file');
const process = require('process');
const chalk = require('chalk');
const JSONValidator = require('jsonschema').Validator;

const semverbotConfig = {
  loaded: false,
  valid: false,
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

const get = () => semverbotConfig.data;


export default {
  load,
  get
};
