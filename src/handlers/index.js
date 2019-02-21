import JSONFileChanger from './javascript/JSONFileChanger';
import FileHandlerLocator from './locator/FileHandlerLocator';
import LogHelper from '../helpers/LogHelper';

const handleFileUpdate = (fileHandlers, newVersion) => {
  const handlerLocators = Object.keys(fileHandlers);
  handlerLocators.forEach((handlerLocator) => {
    const handlerInstance = FileHandlerLocator.getHandler(handlerLocator);
    const files = fileHandlers[handlerLocator];
    handlerInstance.updateFiles(files, newVersion);
  });
  LogHelper.info('All files were updated successfully');
};

const FileHandlers = {
  handleFileUpdate,
  Locator: FileHandlerLocator,
  Javascript: {
    JSON: JSONFileChanger
  }
};

export default FileHandlers;
