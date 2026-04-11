import requestContext from './request-context';

const appContext = Object.freeze({
  request: requestContext(),
});

export default appContext;
