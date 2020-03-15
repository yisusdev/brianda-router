const Brianda = require("../index");

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

app.put('/update', async (req, res) => {
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