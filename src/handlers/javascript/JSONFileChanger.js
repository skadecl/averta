import LogHelper from '../../helpers/LogHelper';

const process = require('process');
const chalk = require('chalk');
const fileChanger = require('edit-json-file');

const handlerName = 'JSONFileChanger';

const defaultKeys = [
  'version'
];

const isKeyValid = key => (
  typeof key === 'string'
);

const updateFiles = (filesData, newVersion) => {
  const rootPath = process.cwd();

  filesData.forEach((file) => {
    const openedFile = fileChanger(`${rootPath}/${file.url}`, {});
    let fileKeys = file.keys;

    if (!fileKeys || !fileKeys.length) {
      LogHelper.info(`Keys for file ${file.url} not specified. Using default keys instead.`);
      fileKeys = defaultKeys;
    }

    const invalidKeys = fileKeys.filter(key => !isKeyValid(key));
    if (invalidKeys.length) {
      invalidKeys.forEach(key => LogHelper.info(`Key ${chalk.underline(key)} is not valid for ${handlerName}.`));
      LogHelper.throwException(`One or more keys are not valid for ${handlerName}.`);
    }

    fileKeys.forEach((key) => {
      const value = openedFile.get(key);
      if (!value) {
        return LogHelper.throwException(`Key ${chalk.underline.white(key)} was not found in ${chalk.underline.white(file.url)} file.`);
      }
      return openedFile.set(key, newVersion);
    });

    openedFile.save();
  });
};

export default {
  updateFiles
};
