const ResponseHandler = require("./utils/response-handler");
const Pipeline = require("./utils/pipeline");
const { response: resHandler } = ResponseHandler;

/**
 * @description Library Brianda Router for Lambdas functions
 * @author Bruno Pineda (https://github.com/yisusdev)
 */
const Brianda = (() => {

  // PROTOTYPE
  const _proto = {
    _routes: [],

    /**
     * @description Router exists validator
     * @param fn Function to validate
     * @returns {Array}
     * @private
     */
    _routerValidator(fn) {
      return fn._routes;
    },

    /**
     * @description Add new route to list
     * @param method HTTP method from request
     * @param path Route path to add
     * @param middlewares Middlewares functions to add
     * @private
     */
    _addRoutes(method, path, middlewares) {
      this._routes = [ ...this._routes, { path, method, middlewares }];
    },

    /**
     * @description Get path parameters by router route
     * @param routePath Path from route
     * @param requestPath Path from request
     * @returns {{params: {}, base: *}}
     * @private
     */
    _getPathParams(routePath, requestPath) {
      const { match } = require("path-to-regexp");
      const _match = match(routePath, {decode: decodeURIComponent});

      return _match(requestPath);
    },

    /**
     * @description Find predicate to get the current route
     * @param m Method from request
     * @param p Path from request
     * @returns {function(*)}
     * @private
     */
    _findAndComposeRoute(m, p) {
      return route => {

        // PARAMS
        const { method: _method, path: _path } = route;
        const isHome = _path.lastIndexOf("/") === _path.length - 1;
        const methodValidation = _method === m;
        const _params = this._getPathParams(_path, isHome ? `${p}/`: p);
        const _matchKeys = Object.keys(_params);
        const matchValidation = _matchKeys.length > 0;
        const selected = _method !== "*" ? methodValidation && matchValidation :
          matchValidation;

        if (selected) {
          route.params = _params.params ? {..._params.params} : {};
        }

        return selected;
      };
    },

    /**
     * @description Aggregation function to set middlewares
     * @param path Route path to set
     * @param middleware Middleware function to set
     */
    use(path, middleware) {
      const p = typeof path === "function" ? "(.*)" : path;
      const m = typeof path === "function" ? path : middleware;

      if (this._routerValidator(m)) {
        m._routes.forEach(i => {
          const fullPath = `${p}${i.path}`;
          this._addRoutes(i.method, fullPath, i.middlewares);
        });
      } else {
        this._addRoutes("*", p, [m]);
      }
    },

    /**
     * @description Get method function
     * @param path Path to set
     * @param middlewares Middlewares to set
     */
    get(path, ...middlewares) {
      const m = middlewares.filter(mid => !this._routerValidator(mid));

      this._addRoutes("get", path, m);
    },

    /**
     * @description Post method function
     * @param path Path to set
     * @param middlewares Middlewares to set
     */
    post(path, ...middlewares) {
      const m = middlewares.filter(mid => !this._routerValidator(mid));

      this._addRoutes("post", path, m);
    },

    /**t
     * @description Put method function
     * @param path Path to set
     * @param middlewares Middlewares to set
     */
    put(path, ...middlewares) {
      const m = middlewares.filter(mid => !this._routerValidator(mid));

      this._addRoutes("put", path, m);
    },

    /**
     * @description Delete method function
     * @param path Path to set
     * @param middlewares Middlewares to set
     */
    delete(path, ...middlewares) {
      const m = middlewares.filter(mid => !this._routerValidator(mid));

      this._addRoutes("delete", path, m);
    },

    /**
     * @description Function to generate handler for lambda
     * @returns {function(*)}
     */
    toLambda() {
      return async event => {
        // FUNCTIONS HELPERS
        /**
         * @description Get a flat array
         * @param arr Array to flat
         * @private
         */
        const _toFlat = arr => [].concat(...arr);

        // PARAMS
        const { resource, path, httpMethod: method, queryStringParameters, body } = event;
        const [ awsPath ] = resource.split('/{proxy*}');
        const [, routerPath] = path.split(awsPath);
        const findPredicate = this._findAndComposeRoute(method.toLowerCase(), routerPath);
        const routesFound = this._routes.filter(findPredicate);

        // ROUTES FOUND VALIDATION
        if (routesFound.length === 0) {
          return resHandler(404, { message: "Oops route not found on router" });
        }

        // GET MIDDLEWARES FUNCTIONS
        const functions = routesFound.map(i => ([...i.middlewares]));
        const lastRoute = [...routesFound].pop();
        const pathParams = lastRoute.params;
        const fns = _toFlat(functions);

        // ADD PARAMS AND BODY TO NATIVE EVENT
        event.params = pathParams;
        event.query = queryStringParameters || {};
        event.body = body && method.toLowerCase() !== "get" ? body : {};

        return Pipeline.create(fns)(event);
      };
    }
  };

  return () => {
    return Object.create(_proto);
  };
})();

module.exports = Brianda;