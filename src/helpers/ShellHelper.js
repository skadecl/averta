const shell = require('shelljs');

const formatLines = (output) => {
  const formatted = output
    .split('\n')
    .filter(line => line && line !== '');

  return formatted.length ? formatted : undefined;
};

const exec = command => new Promise((resolve, reject) => {
  shell.exec(
    `${command} | cat`,
    { silent: true },
    (code, stdout, stderr) => {
      if (code === 0 || !stderr) {
        resolve(formatLines(stdout));
      } else {
        reject(stderr);
      }
    }
  );
});

export default {
  exec
};
