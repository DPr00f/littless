type Header = {
  [key: string]: string
};

export default class Result {
  _headers: Header = {};
  _status = 200;
  _sendCalled = false;
  _body = '';

  status(value: number) {
    this._status = value;

    return this;
  }

  set(key: string, value: string) {
    this._headers[key] = value;

    return this;
  }

  headers(key: string, value: string) {
    return this.set(key, value);
  }

  send(body: any) {
    if (typeof body === 'object') {
      body = JSON.stringify(body);
      this.headers('Content-Type', 'application/json');
    }

    this._body = body;
    this._sendCalled = true;

    return this;
  }

  shouldOutput() {
    return this._sendCalled;
  }

  output() {
    return {
      statusCode: this._status,
      headers: this._headers,
      body: this._body
    };
  }

  setResponse(response: any) {
    this._headers = response.headers;
    this.status(response.statusCode)
    this.send(response.body);
  }
}
