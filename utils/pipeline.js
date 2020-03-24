const Emitter = require("events").EventEmitter;
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
   * @param params Params array with [signal, emitter, evt]
   * @returns {*}
   * @private
   */
  const _res = (...params) => () => {
    const [ signal, emitter, evt ] = params;
    return {
      statusCode: 200,
      headers: {},
      /**
       * @description Add new header to headers response
       * @param header Header to be added
       */
      setHeader: function setHeader(header) {
        this.headers = {...this.headers, ...header};
      },
      /**
       * @description Event listener
       * @param event Event to listen
       * @param cb Callback listener
       */
      on: function on(event, cb) {
        emitter.on(event, data => {

          // Remove listener once called
          emitter.removeListener(event, cb);

          // Callback execution
          cb(data);
        });
      },
      /**
       * @description Send a response
       * @param data Data to send
       * @returns {Promise.<*>}
       */
      send: function send(data) {
        signal.continue = false;

        // Event emit on end response
        emitter.emit("end", {
          headers: this.headers,
          statusCode: this.statusCode,
          params: evt.params,
          query: evt.query,
          body: data
        });

        return Promise.resolve(resHandler(this.statusCode, data, this.headers));
      }
    };
  };

  /**
   * @description Create function with middlewares
   * @param f Middleware functions to execute
   * @returns {*}
   * @private
   */
  const _createPipeline = f => {
    const signal = { continue: true };
    const event = new Emitter();

    return f.length > 1 ? f.reduce((before, after, idx) =>
      e => before(e , _res(signal, event, e)(), _next(idx, f.length)).then(r => (
          signal.continue ? after(...[...r, _res(signal, event, e)(), _next(idx, f.length)]) : r
        )
      )) : e => f[0](e, _res(signal, event, e)(), _res(signal, event, e)().send).then(r => (r));
  };

  return {
    create: _createPipeline
  };
})();

module.exports = Pipeline;