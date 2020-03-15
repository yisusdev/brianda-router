const ResponseHandler = require("./response-handler");

const { response: resHandler } = ResponseHandler;

/**
 * @description Pipeline module
 * @type {{create}}
 */
const Pipeline = (() => {
  // FUNCTIONS HANDLERS
  /**
   * @description Function to send to the next middleware function
   * @param idx Current function index
   * @param length Total of middlewares functions
   * @private
   */
  const _next = (idx, length) => e =>
    Promise.resolve(idx ===  length - 1 && length > 2 ? e : [e]);

  /**
   * @description Resolve function to exit from pipeline
   * @param signal Flag to continue or not on pipeline
   * @returns {*}
   * @private
   */
  const _res = signal => () => ({
    statusCode: 200,
    headers: {},
    setHeader: function setHeader(header) {
      this.headers = {...this.headers, ...header};
    },
    send: function send(data) {
      signal.continue = false;

      return Promise.resolve(resHandler(this.statusCode, data, this.headers));
    }
  });

  /**
   * @description Create function with middlewares
   * @param f Middleware functions to execute
   * @returns {*}
   * @private
   */
  const _createPipeline = f => {
    const signal = { continue: true };

    return f.length > 1 ? f.reduce((before, after, idx) =>
      e => before(e , _res(signal)(), _next(idx, f.length)).then(r => {
          const response = signal.continue ? after(...[...r, _res(signal)(), _next(idx, f.length)]) : r;

          signal.continue = true;
          return response;
        }
      )) : e => f[0](e, _res(signal)()).then(r => (r));
  };

  return {
    create: _createPipeline
  };
})();

module.exports = Pipeline;