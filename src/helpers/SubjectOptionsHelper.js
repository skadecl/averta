const containsOption = (subjectLines, option) => (
  subjectLines
    .some(line => line.includes(option))
);

const build = (subjectLines) => {
  const options = {
    SKIP: '[svb skip]',
    FORCE_VERSION: '[svb force]',
    FORCE_MAJOR: '[svb major]',
    FORCE_MINOR: '[svb minor]',
    FORCE_PATCH: '[svb patch]',
    NO_TAG: '[svb notag]'
  };

  Object.keys(options)
    .map((option) => {
      options[option] = containsOption(subjectLines, options[option]);
      return options[option];
    });
  return options;
};

export default {
  build
};
