let deployData = {
  currentBranch: '',
  subjectOptions: {},
  mergedPrefix: '',
  incrementType: '',
  currentVersion: '',
  newVersion: ''
};

const templateKeys = {
  '%b': () => deployData.currentBranch,
  '%fv': () => deployData.subjectOptions.FORCE_VERSION,
  '%fM': () => deployData.subjectOptions.FORCE_MAJOR,
  '%fm': () => deployData.subjectOptions.FORCE_MINOR,
  '%fp': () => deployData.subjectOptions.FORCE_PATCH,
  '%fs': () => deployData.subjectOptions.SKIP,
  '%p': () => deployData.mergedPrefix,
  '%i': () => deployData.incrementType,
  '%cv': () => deployData.currentVersion,
  '%nv': () => deployData.newVersion
};

const get = () => deployData;

const set = (data) => {
  deployData = data;
};

const fillTemplate = (template) => {
  let filled = template;
  Object.keys(templateKeys)
    .forEach(key => filled = filled.replace(key, templateKeys[key]()));
  return filled;
};

export default {
  get,
  set,
  fillTemplate
};
