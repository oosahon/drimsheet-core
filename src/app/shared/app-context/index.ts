import makeRequestContext from './app-context';

const appContext = Object.freeze({
  request: makeRequestContext(),
});

export default appContext;
