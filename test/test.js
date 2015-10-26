
var assert = require('assert');

// Librerias mongo
var mongo = require('mongodb');
var monk = require('monk');
// Inicializacion dbmongo
var dbmongo = monk('localhost:27017/opensecurechat');

// Inicializacion redis
var redis = require("redis");
var client = null; //redis.createClient();

var pruebas = dbmongo.get("pruebas");


describe('Carga de Librerias', function() {
  describe('Mongo', function () {
    it('Debe cargar la libreria de mongoDB correctamente', function () {
    	assert(mongo);
    });
    it('Debe cargar la libreria monk correctamente', function () {
      assert(monk);
    });
    it('Debe conectarse a la base de datos mongo correctamente', function () {
      assert(dbmongo);
    });
  });
  describe('Redis', function () {
    it('Debe cargar la libreria de redis correctamente', function () {
      assert(redis);
    });
    it('Debe crear el cliente redis correctamente', function () {
      assert(client);
    });
  });
});

/*
describe('Usuario', function() {
  describe('Crea', function () {
    it('Debe crear al usuario correctamente', function () {
    	Usuario.add("usuariotest", function(err, result){
    		assert.equal(result.nombreusuario, "usuariotest", "Creado");
    	});
    });
  });

  describe('Elimina', function () {
    it('Debe eliminar al usuario correctamente', function () {
    	Usuario.delete("usuariotest", function(err){
    		assert.equal(err, undefined, "Eliminado");
    	});
    });
  });
});
*/