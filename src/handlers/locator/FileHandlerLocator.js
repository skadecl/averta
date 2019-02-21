import FileHandlers from '../index';
import LogHelper from '../../helpers/LogHelper';

const getHandler = (locatorString) => {
  const locators = locatorString.split('.');
  let handlerInstance = FileHandlers;

  locators.forEach((locator) => {
    handlerInstance = handlerInstance[locator];
    if (!handlerInstance) {
      LogHelper.throwException(`${locatorString} is not a valid FileHandler.`);
    }
  });
  return handlerInstance;
};

export default {
  getHandler
};
