export const only = (...allowedRequests: string[]) => (req: any, res: any) => {
  allowedRequests = allowedRequests.map((v) => v.toUpperCase());

  if (!allowedRequests.includes(req.httpMethod)) {
    res
      .status(405)
      .send({
        error: true,
        message: 'Method not allowed'
      });
  }
}

export const except = (...allowedRequests: string[]) => (req: any, res: any) => {
  allowedRequests = allowedRequests.map((v) => v.toUpperCase());

  if (allowedRequests.includes(req.httpMethod)) {
    res
      .status(405)
      .send({
        error: true,
        message: 'Method not allowed'
      });
  }
}

const err = (error: any) => {
  const body = {
    error: true,
    message: error.message
  } as any;
  if (error.type) {
    body.type = error.type;
  }
  if (error.body) {
    body.body = error.body;
  }
  return {
    statusCode: error.status || error.statusCode || 500,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  }
};

/**
 * 'next' function, passed to a middleware
 */
type Next = (err: any) => Promise<any>;

 /**
  * A middleware
  */
type Middleware<T, S> =
   (req: T, res: S, next: Next) => Promise<any> | any;

interface Response {
  shouldOutput: () => boolean,
  setResponse: (a: any) => void,
  output: () => any
}

export default class MwDispatcher<T, S extends Response> {

  middlewares: Middleware<T, S>[];
  afterMiddlewares: Middleware<T, S>[];
  hasError = false;
  nextValue: any;

  constructor() {
    this.middlewares = [];
    this.afterMiddlewares = [];
  }
  useBefore(...mw: Middleware<T, S>[]) {
    this.middlewares.unshift(...mw);
  }

  use(...mw: Middleware<T, S>[]): void {
    this.middlewares.push(...mw);
  }

  useAfter(...mw: Middleware<T, S>[]): void {
    this.afterMiddlewares.push(...mw);
  }

  /**
   * Execute the chain of middlewares, in the order they were added on a
   * given Context.
   */
  dispatch(req: T, res: S): Promise<any> {
    this.use(...this.afterMiddlewares);
    this.afterMiddlewares = [];
     return this.invokeMiddlewares(req, res);
  }

  async invokeMiddlewares(req: T, res: S): Promise<any> {
    if (!this.middlewares.length) { return; }
    let response;
    const mw = this.middlewares.shift();

    if (!mw) {
      return;
    }
    const next = async (err: any) => {
      if (err) {
        this.hasError = err;
        return;
      }

      const result = await this.invokeMiddlewares(req, res);
      return result;
    }

    try {
      response = await mw(req, res, next);
    } catch (ex) {
      // console.trace();
      response = err(ex);
    }

    if (this.hasError) {
      response = err(this.hasError);
    }

    if (response) {
      res.setResponse(response);
    }

    if (res.shouldOutput()) {
      return res.output();
    }
  }

}
