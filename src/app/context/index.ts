import makeRequestContext from './request-context';

const appContext = Object.freeze({
  request: makeRequestContext(),
});

export default appContext;
