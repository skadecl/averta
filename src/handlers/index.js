import JSONFileChanger from './javascript/JSONFileChanger';
import FileHandlerLocator from './locator/FileHandlerLocator';

const FileHandlers = {
  Locator: FileHandlerLocator,
  Javascript: {
    JSON: JSONFileChanger
  }
};

export default FileHandlers;
