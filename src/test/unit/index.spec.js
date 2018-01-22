var helpers = require('../helpers');
var main = require('../../js/main');

describe('main', function () {
  it('returns hello world', function () {
    helpers.expect(main()).to.eql('hello world');
  });
});
