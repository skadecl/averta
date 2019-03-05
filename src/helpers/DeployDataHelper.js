import until from '../utils/Until';
import LogHelper from './LogHelper';
import PayloadTemplates from '../templates';
import Config from '../config/Config';

const axios = require('axios');
const chalk = require('chalk');

let deployData = {
  currentRepository: '',
  currentBranch: '',
  commit: {}
};

const link = (urlType, resource) => {
  const repositoryUrl = Config.current().links.repository;
  const url = urlType ? Config.current().links[urlType] : '';
  return repositoryUrl + url + resource;
};

const templateKeys = {
  '%rL': () => link(null, deployData.currentRepository),
  '%bL': () => link('branches', deployData.currentBranch),
  '%cL': () => link('commits', deployData.commit.hash),
  '%ovL': () => link('tags', Config.current().options.tagPrefix + deployData.commit.oldVersion),
  '%nvL': () => link('tags', Config.current().options.tagPrefix + deployData.commit.version),
  '%r': () => deployData.currentRepository,
  '%b': () => deployData.currentBranch,
  '%fv': () => deployData.commit.options.FORCE_VERSION,
  '%fM': () => deployData.commit.options.FORCE_MAJOR,
  '%fm': () => deployData.commit.options.FORCE_MINOR,
  '%fp': () => deployData.commit.options.FORCE_PATCH,
  '%fs': () => deployData.commit.options.SKIP,
  '%p': () => deployData.commit.prefix,
  '%i': () => deployData.commit.increment,
  '%ov': () => deployData.commit.oldVersion,
  '%nv': () => deployData.commit.version,
  '%h': () => deployData.commit.hash.slice(0, 7),
  '%H': () => deployData.commit.hash,
  '%a': () => deployData.commit.author,
  '%tp': () => Config.current().options.tagPrefix || 'v'
};

const get = () => deployData;

const set = (data) => {
  deployData = Object.assign(deployData, data);
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

const sendWebHooks = async (webHooks, commit) => {
  if (!webHooks || !webHooks.length) {
    return;
  }

  set({ commit });
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
