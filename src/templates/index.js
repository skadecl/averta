import SlackTemplate from './SlackTemplate';
import DeployDataHelper from '../helpers/DeployDataHelper';

const templates = {
  slack: SlackTemplate
};

const get = (templateName) => {
  const template = templates[templateName];

  if (template) {
    return DeployDataHelper.fillTemplate(template);
  }

  return undefined;
};

const PayloadTemplates = {
  get
};

export default PayloadTemplates;
