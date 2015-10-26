
// Librerias mongo
var mongo = require('mongodb');
var monk = require('monk');
// Inicializacion dbmongo
var dbmongo = monk('localhost:27017/opensecurechat');

// Inicializacion redis
var redis = require("redis");
var client = redis.createClient();

var pruebas = dbmongo.get("pruebas");

