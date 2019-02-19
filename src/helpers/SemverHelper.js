import LogHelper from './LogHelper';
import Config from '../config/Config';

const getIncreaseType = (prefix) => {
  const flows = Config.get().versioning;

  if (flows.major.includes(prefix)) {
    return 'major';
  } else if (flows.minor.includes(prefix)) {
    return 'minor';
  } else if (flows.patch.includes(prefix)) {
    return 'patch';
  }
  return LogHelper.exit('Last merged branch prefix is not included in any flow', 'Skipping...');
};


export default {
  getIncreaseType
};
