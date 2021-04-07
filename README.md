# Littless

[![Build Status](https://drone-github.pr00f.media/api/badges/DPr00f/littless/status.svg)](https://drone-github.pr00f.media/DPr00f/littless)

This project is a helper for serverless services that is achieved through the usage of adapters.

Inspired by express middlewares and the idea was to be able to reuse some of them.

## Install

`npm install littless -S`

### Install an adapter

`npm install littless-adapter-netlify -S`

or

`npm install littless-adapter-vercel -S`

## Usage

### Netlify example

Create a functions/test.js

```
const littless = require('littless').default;
const adapter = require('littless-adapter-netlify').default;
const cookieParser = require('cookie-parser');
const {json} = require('body-parser');
const app = littless();

app.useAdapter(adapter);

app.use(json({
  extended: true
}));
app.use(cookieParser());
app.useAfter((req, res) => {
  if (!res.shouldOutput()) {
    res.status(500)
      .send({
        error: true,
        message: 'No body was sent up until this point'
      })
  }
});

exports.handler = app.any(async (req, res, next) => {
  console.dir(req);
  res.send({
    path: req.path,
    cookies: req.cookies,
    query: req.query,
    body: req.body
  });

  req.on('data', (chunck) => {
    console.log(chunck);
  })

  next();
});
```

### Vercel example

Create a api/test.js

```
const littless = require('littless').default;
const adapter = require('littless-adapter-vercel').default;
const cookieParser = require('cookie-parser');
const app = littless();

app.useAdapter(adapter);
app.use(cookieParser());
app.useAfter((req, res) => {
  if (!res.shouldOutput()) {
    res.status(500)
      .send({
        error: true,
        message: 'No body was sent up until this point'
      })
  }
});

module.exports = app.any(async (req, res, next) => {
  res.send({
    path: req.path,
    cookies: req.cookies,
    query: req.query,
    body: req.body
  });

  next();
});

```

Please note that vercel already parses the body so no need to use the `body-parser`

### Specify the method to use

You can use the already made middlewares to filter the allowed methods

```
app.get(/* ... */)
```

```
app.post(/* ... */)
```

```
app.put(/* ... */)
```

```
app.delete(/* ... */)
```

Or you can use `only` or `except` to construct your own

```
app.only(['POST', 'GET'], (req, res, next) => {
  /* ... */
})
```

```
app.except(['DELETE'], (req, res, next) => {
  /* ... */
})
```

## Using adapters

Adapters can be used with `.useAdapter`

## Available adapters

For now the available parsers are for `netlify` and `vercel` but you can inspect the adapters code and create your own.

If you do create a new parser please reach out to me so I can include it in the official list.

## App Available Methods

| Method          | Arguments                                                                            | Description                                                                                |
| --------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| **useAdapter**  | Adapter Class                                                                        | *(Required)* Specify which adapter to be used to parse information from serverless service |
| **use**         | Function([req](#request-api), [res](#response-api), nextMiddleware)                  | Append middleware                                                                          |
| useAfter        | Function([req](#request-api), [res](#response-api), nextMiddleware)                  | Append middleware to be used after the callback function                                   |
| useBefore       | Function([req](#request-api), [res](#response-api), nextMiddleware)                  | Preprend middleware                                                                        |
| **post**        | Function([req](#request-api), [res](#response-api), nextMiddleware)                  | Only allow POST and OPTIONS requests and calls back the first argument                     |
| **get**         | Function([req](#request-api), [res](#response-api), nextMiddleware)                  | Only allow GET and OPTIONS requests and calls back the first argument                      |
| **delete**      | Function([req](#request-api), [res](#response-api), nextMiddleware)                  | Only allow DELETE and OPTIONS requests and calls back the first argument                   |
| **put**         | Function([req](#request-api), [res](#response-api), nextMiddleware)                  | Only allow PUT and OPTIONS requests and calls back the first argument                      |
| **any**         | Function([req](#request-api), [res](#response-api), nextMiddleware)                  | Allows any requests and calls back the first argument                                      |
| only            | Methods (Array), Function([req](#request-api), [res](#response-api), nextMiddleware) | Allows user to specify methods to allow and calls back the second argument                 |
| except          | Methods (Array), Function([req](#request-api), [res](#response-api), nextMiddleware) | Allows user to specify methods to block and calls back the second argument                 |

## Request Api

| Method / Property | Type            | Description                                                                 |
| ----------------- | --------------- | --------------------------------------------------------------------------- |
| headers           | Object          | Request headers are accessible from this property                           |
| query             | Object          | Query params are accessible from this property                              |
| httpMethod        | String          | The method of the request                                                   |
| path              | String          | The url path                                                                |
| body              | String / Object | Normally a string but can be parsed depending on the service or the adapter |
| raw               | Object          | The original event sent by the service                                      |

## Response Api

| Method  | Arguments                  | Description                                                                      |
| ------- | -------------------------- | -------------------------------------------------------------------------------- |
| status  | code:Number                | Specify the response code                                                        |
| set     | key:String, value:String   | Sets a header for the response i.e `res.set('Content-Type', 'application/json')` |
| headers |  key:String, value:String  | Alias for `set`                                                                  |
| send    | body:Any                   | Sets the response body                                                           |

Note: Possibly the response should have a way of setting a cookie but this can be achieved with the headers or creating a middleware for that which might be an option for the future.
