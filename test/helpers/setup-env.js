const mockery = require('mockery');

mockery.enable({
  warnOnUnregistered: false,
  warnOnReplace: false
});

process.env.NODE_ENV = 'testing';