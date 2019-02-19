import FileHandlers from '../index';
import LogHelper from '../../helpers/LogHelper';

const getHandler = (locatorString) => {
  const locators = locatorString.split('.');
  let handlerInstance = null;

  locators.forEach((locator) => {
    handlerInstance = FileHandlers[locator];
    if (!handlerInstance) {
      LogHelper.throwException(`${locatorString} is not a valid FileHandler`);
    }
  });
  return handlerInstance;
};

export default {
  getHandler
};
