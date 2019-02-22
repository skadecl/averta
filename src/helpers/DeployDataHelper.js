import until from './Until';
import LogHelper from './LogHelper';
import PayloadTemplates from '../templates';

const axios = require('axios');
const chalk = require('chalk');

let deployData = {
  currentRepository: '',
  currentBranch: '',
  subjectOptions: {},
  mergedPrefix: '',
  incrementType: '',
  currentVersion: '',
  newVersion: ''
};

const templateKeys = {
  '%r': () => deployData.currentRepository,
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

const replaceInLine = (line, search, replacement) => line.split(search).join(replacement);

const fillLine = (line) => {
  let filled = line;
  Object.keys(templateKeys)
    .forEach(key => filled = replaceInLine(filled, key, templateKeys[key]()));
  return filled;
};

const fillObject = (object) => {
  const o = JSON.parse(JSON.stringify(object));
  Object.keys(o).forEach((key) => {
    if (o[key] && typeof o[key] === 'object') {
      o[key] = fillObject(o[key]);
    } else if (o[key] && typeof o[key] === 'string') {
      o[key] = fillLine(o[key]);
    }
  });

  return o;
};

const fillTemplate = (template) => {
  switch (typeof template) {
    case 'string':
      return fillLine(template);
    case 'object':
      return fillObject(template);
    default:
      return undefined;
  }
};

const sendWebHooks = async (webHooks) => {
  if (!webHooks || !webHooks.length) {
    return;
  }

  const spinner = LogHelper.spinner('Sending WebHooks...');
  const responses = await Promise.all((webHooks)
    .map(async (webHook) => {
      const request = {
        method: webHook.method.toLowerCase(),
        url: fillTemplate(webHook.url),
      };

      if (['post', 'put', 'patch'].includes(request.method)) {
        request.data = webHook.payload || PayloadTemplates.get(webHook.template) || deployData;
      }

      return until(axios(request));
    }));

  spinner.stop(true);
  responses.forEach((response, i) => {
    const [, err] = response;
    if (err) {
      LogHelper.info(`${chalk.red(`WebHook #${i + 1}`)}: ${err.message}.`);
    } else {
      LogHelper.info(`${chalk.green(`WebHook #${i + 1}`)}: Sent successfully.`);
    }
  });
};

export default {
  get,
  set,
  fillTemplate,
  sendWebHooks
};
