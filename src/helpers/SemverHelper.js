import LogHelper from './LogHelper';
import Config from '../config/Config';

const getIncrementType = (prefix) => {
  const flows = Config.current().rules;

  if (flows.major.prefixes.includes(prefix)) {
    return 'major';
  } else if (flows.minor.prefixes.includes(prefix)) {
    return 'minor';
  } else if (flows.patch.prefixes.includes(prefix)) {
    return 'patch';
  }
  return LogHelper.exit('Last merged branch prefix is not included in any flow', 'Skipping...');
};

const parseLineToVersion = (line) => {
  const matcher = new RegExp('((0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(-(0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*)(\\.(0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*))*)?(\\+[0-9a-zA-Z-]+(\\.[0-9a-zA-Z-]+)*)?)');
  const result = line.match(matcher);
  return result && result[0] ? result[0] : null;
};


export default {
  getIncrementType,
  parseLineToVersion
};
