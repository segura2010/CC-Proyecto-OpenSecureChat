
var assert = require('assert');

// Librerias mongo
var mongo = require('mongodb');
var monk = require('monk');
// Inicializacion dbmongo
var dbmongo = monk('localhost:27017/opensecurechat');

// Inicializacion redis
var redis = require("redis");
var dbredis = redis.createClient();

var pruebas = dbmongo.get("test");

// Import my libraries
var UserLib = require('./../lib/User.js').UserController;
var ChatLib = require('./../lib/Chat.js').ChatController;

// Create controllers
var User = new UserLib(pruebas, dbredis);
var Chat = new ChatLib(dbredis);

// Prepare DB Indexes
User.prepareIndexes();


// test vars
var testuser = {username:"testuser", email:"testuser@opensecurechat.com", password:"12345", public_key:"public_key", private_key:"private_key"};


describe('Carga de Librerias', function() {
  describe('Mongo', function () {
    it('Load MongoDB library', function (done) {
    	assert(mongo);
      done();
    });
    it('Load Monk library', function (done) {
      assert(monk);
      done();
    });
    it('Connect to MongoDB', function (done) {
      assert(dbmongo);
      done();
    });
  });
  describe('Redis', function () {
    it('Load redis library', function (done) {
      assert(redis);
      done();
    });
  });
});


describe('User', function() {
  it('Create test user', function (done) {
  	User.add(testuser, function(err, result){
  		assert.equal(result.username, testuser.username, "Created");
      done();
  	});
  });

  it('Create duplicated test user', function (done) {
    User.add(testuser, function(err, result){
      assert.notEqual(err, null, "Not Created");
      done();
    });
  });

  it('Get user by username', function (done) {
    User.getByUsername(testuser.username, function(err, result){
      assert.equal(result.length, 1);
      done();
    });
  });

  it('Get user by email', function (done) {
    User.getByEmail(testuser.email, function(err, result){
      assert.equal(result.length, 1);
      done();
    });
  });

  it('Delete test user', function (done) {
    User.delete("testuser", function(err){
      assert.equal(err, undefined, "Deleted");
      done();
    });
  });
});
