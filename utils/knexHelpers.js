import _ from 'lodash';

// condense a row
export const normalizeRow = e => e[0] || e;

// use this until we get Bluebird promisify figured out
export const promisify = fn => new Promise((resolve, reject) => fn(resolve));

export const _linterFix = {};
