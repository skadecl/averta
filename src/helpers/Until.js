const until = promise => (
  promise
    .then(res => [res, undefined])
    .catch(err => [undefined, err])
);

export default until;
