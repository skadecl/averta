const containsOption = (subjectLines, option) => (
  subjectLines
    .some(line => line.includes(option))
);

const build = (subjectLines) => {
  const options = {
    SKIP: '[avt skip]',
    FORCE_VERSION: '[avt force]',
    FORCE_MAJOR: '[avt major]',
    FORCE_MINOR: '[avt minor]',
    FORCE_PATCH: '[avt patch]',
    NO_TAG: '[avt notag]'
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
