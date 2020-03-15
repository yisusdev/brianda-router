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
     * @param q Query string params from request
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

// IMPLEMENTATION
const v3 = Brianda();
const app = Brianda();
const admin = Brianda();

app.get('/', async (req, res) => {
  console.log("one");
  return res({ foo: "bar" });
});
admin.use(async (req, res, next) => {
  console.log("admin all");
  req.caca = "shit";
  return next(req);
});

admin.get('/user/:userId/photos/:photoId', async (req, res) => {
  console.log("getPhoto", req.caca, req.query.scat);
  req.bar = "foo";

  const { bar, caca } = req;
  res.statusCode = 200;
  res.setHeader({ token: "aatstgds6625sds" });
  return res.send({ bar, caca });
});

app.use('/admin', admin);
app.get('/test/(.*)', async (req, res, next) => {
  console.log("pre");
  req.test = { pre: true };
  return next(req);
});
app.get('/test/:id/:tax', async (req, res, next) => {
  console.log("handler", req.params.id);
  req.test.handler = true;
  return next(req);
}, async (req, res) => {
  console.log("end", req.test);
  return res.send(req.test);
});

app.put('/update', async (req, res, next) => {
  console.log("update");
  res.statusCode = 204;
  return res.send({ message: "OK" });
});

v3.use('/api', app);

const handler = v3.toLambda();

const event = {
  "headers": {
    "cookie": "username-localhost-8888=\"2|1:0|10:1581467001|23:username-localhost-8888|44:ZDhlMWJiM2MzMjY3NDA1NWE1ZDNmMDc1NTk1ZTAzNWE=|a78bf00fb47be6f4a96afb575a24acd8a38f5e06232e98950aeb9190ea19ceae\"; _xsrf=2|9552bf6f|71351055ff10ce362dec96b0c1c051d1|1581467001",
    "accept-language": "si-LK,si;q=0.9,en-AU;q=0.8,en-GB;q=0.7,en-US;q=0.6,en;q=0.5",
    "accept-encoding": "gzip, deflate, br",
    "sec-fetch-site": "none",
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3",
    "dnt": "1",
    "sec-fetch-user": "?1",
    "sec-fetch-mode": "navigate",
    "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36",
    "upgrade-insecure-requests": "1",
    "connection": "close",
    "host": "localhost:8080"
  },
  "multiValueHeaders": {
    "cookie": [
      "username-localhost-8888=\"2|1:0|10:1581467001|23:username-localhost-8888|44:ZDhlMWJiM2MzMjY3NDA1NWE1ZDNmMDc1NTk1ZTAzNWE=|a78bf00fb47be6f4a96afb575a24acd8a38f5e06232e98950aeb9190ea19ceae\"; _xsrf=2|9552bf6f|71351055ff10ce362dec96b0c1c051d1|1581467001"
    ],
    "accept-language": [
      "si-LK,si;q=0.9,en-AU;q=0.8,en-GB;q=0.7,en-US;q=0.6,en;q=0.5"
    ],
    "accept-encoding": [
      "gzip, deflate, br"
    ],
    "sec-fetch-site": [
      "none"
    ],
    "accept": [
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3"
    ],
    "dnt": [
      "1"
    ],
    "sec-fetch-user": [
      "?1"
    ],
    "sec-fetch-mode": [
      "navigate"
    ],
    "user-agent": [
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36"
    ],
    "upgrade-insecure-requests": [
      "1"
    ],
    "connection": [
      "close"
    ],
    "host": [
      "localhost:8080"
    ]
  },
  "path": "/v2/api/update",
  "pathParameters": {},
  "requestContext": {
    "accountId": "offlineContext_accountId",
    "resourceId": "offlineContext_resourceId",
    "apiId": "offlineContext_apiId",
    "stage": "dev",
    "requestId": "offlineContext_requestId_8052289311877472",
    "identity": {
      "cognitoIdentityPoolId": "offlineContext_cognitoIdentityPoolId",
      "accountId": "offlineContext_accountId",
      "cognitoIdentityId": "offlineContext_cognitoIdentityId",
      "caller": "offlineContext_caller",
      "apiKey": "offlineContext_apiKey",
      "sourceIp": "127.0.0.1",
      "cognitoAuthenticationType": "offlineContext_cognitoAuthenticationType",
      "cognitoAuthenticationProvider": "offlineContext_cognitoAuthenticationProvider",
      "userArn": "offlineContext_userArn",
      "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36",
      "user": "offlineContext_user"
    },
    "authorizer": {
      "principalId": "offlineContext_authorizer_principalId"
    },
    "protocol": "HTTP/1.1",
    "resourcePath": "/v2/{proxy*}",
    "httpMethod": "PUT"
  },
  "resource": "/v2/{proxy*}",
  "httpMethod": "PUT",
  "queryStringParameters": {
    "scat": "1"
  },
  "multiValueQueryStringParameters": null,
  "stageVariables": null,
  "body": {
    "hello": "world"
  },
  "isOffline": true
};

handler(event).then(r => console.log(r));