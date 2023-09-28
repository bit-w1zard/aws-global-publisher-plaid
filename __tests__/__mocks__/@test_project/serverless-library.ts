const request = jest.fn().mockResolvedValue({ data: true });
const repo = jest.fn().mockImplementation(() => ({
  find: jest.fn(),
  save: jest.fn(),
}));
const databaseAdapter = jest.fn();
const eventbus = jest.fn().mockImplementation(() => ({
  publish: jest.fn(),
}));
const factory = eventbus;

abstract class Handler<T> {
  abstract handlerCore(param): any;
  handler(param) {
    return this.handlerCore(param.event);
  }
}

export {
  request,
  repo,
  databaseAdapter,
  Handler,
  factory,
  eventbus,
};
