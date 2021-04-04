import { Readable } from 'stream';
import Middlewares, { except, only } from './Middlewares';
import Result from './Result';

type Func = (...args: any) => any;

type Next = (err: any) => Promise<any>;

 /**
  * A middleware
  */
type Middleware<T, S> =
   (req: T, res: S, next: Next) => Promise<any> | any;

class Littless {
  middlewares: Middlewares<any, any>;
  hasError = false;
  adapter: any;

  constructor() {
    this.middlewares = new Middlewares();
    this.adapter = null;
  }

  useAdapter(adapter: any) {
    this.adapter = adapter;

    return this;
  }

  useBefore(...mw: Middleware<any, any>[]) {
    this.middlewares.useBefore(...mw);

    return this;
  }

  use(...mw: Middleware<any, any>[]) {
    this.middlewares.use(...mw);

    return this;
  }

  useAfter(...mw: Middleware<any, any>[]) {
    this.middlewares.useAfter(...mw);

    return this;
  }

  _handleError = (err: any) => {
    if (err) {
      this.hasError = err;
    }
  }

  run(func: Func) {
    if (!this.adapter) {
      throw "Please useAdapter to specify an adapter to use";
    }
    this.hasError = false;
    this.use(func);
    return async (...values: any[]) => {
      const adapter = new this.adapter(...values);

      const res = new Result();
      const req = adapter.getRequest();

      const response = await this.middlewares.dispatch(req, res);

      adapter.willReturnResponse(response, res);

      return response;
    }
  }

  post(func: Func) {
    this.useBefore(only('OPTIONS', 'POST'));

    return this.run(func);
  }

  get(func: Func) {
    this.useBefore(only('OPTIONS', 'GET'));

    return this.run(func);
  }

  delete(func: Func) {
    this.useBefore(only('OPTIONS', 'DELETE'));

    return this.run(func);
  }

  put(func: Func) {
    this.useBefore(only('OPTIONS', 'PUT'));

    return this.run(func);
  }

  any(func: Func) {
    return this.run(func);
  }

  only(methods: string[], func: Func) {
    this.useBefore(only(...methods));

    return this.run(func);
  }

  except(methods: string[], func: Func) {
    this.useBefore(except(...methods));

    return this.run(func);
  }
}

export default Littless;
