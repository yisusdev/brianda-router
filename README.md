# brianda-router
API router like express for lambda functions.

## Overview
Brianda router is a API router for AWS Lambda functions with serverless framework, this library extract the express basics, to create a router for Lambda functions.

## When is necessary use a router?
Well, often we create many functions handlers for many resources in our ```serveless.yml``` like:

```yaml
  users-service
      handler: v2/handlers/users-service.main
      events:
        - http:
            path: v2/users
            method: get
            cors: true
            authorizer: aws_iam
  orders-service:
      handler: v2/handlers/orders-service.main
      events:
        - http:
            path: v2/orders
            method: get
            cors: true
            authorizer: aws_iam
  reports-service:
    handler: v2/handlers/reports-service.main
    events:
      - http:
          path: v2/reports
          method: get
          cors: true
          authorizer: aws_iam
  ...
```
For each function, AWS cloudFormation, create more than one resource, like:

```
    AWS:Lambda:Function
    AWS:Lambda:Version
    AWS:Lambda:LogGroup
    AWS:Lambda:Permission
    AWS:ApiGateway:Method
    etc...
```
So, When we have many functions in one stack, we could get the 200 resource limitation error.

Note: For more information, please check this [article](https://serverless.com/blog/serverless-workaround-cloudformation-200-resource-limit/)

## Installation
```text
npm install brianda-router
```

## Using

### First required step.
We need first, modify our ```serverless.yml```
```yaml
    v2-app:
        handler: handlers/app.main
        events:
          - http:
              path: v2/{proxy+}
              method: ANY
              cors: true
              authorizer: aws_iam
```

Here is an inplementation example:

**Note: Brianda router is ever async based functions.**
```js
    const Brianda = require("brianda-router");
    
    // Very similar to express
    const app = Brianda();
    
    app.get("/users", async (req, res) => {
      // ... Do anything with req
      return res.send("Hello Brianda!");
    });
```

When we use the next middleware execution, we have to return the next function with event to pass to the next middleware function like this:
```js
    app.use(async (req, res, next) => {
      // This apply for all methods in app router
      return next(req);
    });
```

### Using multiples routers in a router.
```js
    const app = Brianda();
    const admin = Brianda();
    
    admin.use(async (req, res, next) => {
      // Protected route
      if (req.headers.authorization) {
        // Token verification
        return next(req);
      }
      
      res.statusCode = 401;
      return res({ message: "No authorized"});
    });
    
    admin.get("/secrets", async (req, res) => {
      return res("top secret!");
    });
    
    app.use('/admin', admin);
```

### Working with path parameters
Often we need transport data in a idiomatic way to client like ```/api/user/bpinedah```, well:
```js
    app.get("/user/:username", async (req, res) => {
      // Do anything with params like this:
      const username = req.params.username;
      
      return res.send(username);
    });
```

### Query string parameters
Query string params is available too, example: ```/api/user?usermane=bpinedah```
```js
    app.get("/user", async (req, res) => {
      // Do anything with params like this:
      const username = req.query.username;
      
      return res.send(username);
    });
```

### Wildcard on route
Sometimes we need to apply one function to anything after specific route slash sequence, like ```api/users/*```
```js
    app.use("/users/(.*)", async (req, res, next) => {
      // This apply to anything after this route
     return  next(req);
    })
```

### Multiple middlewares
When we want to do anything with request data, before or after of handler controller, we need to apply middlewares functions like this:
```js
    app.post("/users/create", async (req, res, next) => {
      // Do anything with req before pass to handler function
      req.body.hello = "Brianda";
      return next(req);
    }, async (req, res, next) => {
      // Handler function... do anything with req.body
      const data = { message: `Hello from ${req.body.hello}`};
      
      return next(data);
    }, async (req, res) => {
      // Last middleware function
      console.log(req); // { message: "Hello from Brianda" }
      
      return res.send(req);
    })
```

## Notes

 - The entire native event request from Lambda API Gateway is present ever in each request, thus always will can access to the object.
 - We will work in a new features like no async inclusion and avoid ```return``` statement in each function to return the response.
 - By now we decided leave out to the context object, however we 'll work to include in the request.
 
 # Contributions
 
 For any contrbution, please contact me.
 - Bruno Pineda - [bpinedah](https://github.com/bpinedah)
 