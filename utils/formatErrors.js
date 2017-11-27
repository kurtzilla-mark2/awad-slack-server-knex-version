import _ from 'lodash';

export const formatErrors = e => {
  // console.log('ERROR', e);
  // console.log('GGGGGGG', Object.entries(e));

  if (
    e.hasOwnProperty('name') &&
    e.name === 'error' &&
    e.hasOwnProperty('routine') &&
    e.hasOwnProperty('hint')
  ) {
    return [{ path: 'general', message: `${e.routine}: ${e.hint}` }];
  } else if (e.hasOwnProperty('errors')) {
    return e.errors.map(x => _.pick(x, ['path', 'message']));
  } else if (e.hasOwnProperty('path') && e.hasOwnProperty('message')) {
    return e;
  }

  // default
  return [{ path: 'name', message: 'something went wrong' }];
};

export const _linterFix = {};
