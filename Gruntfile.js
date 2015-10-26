'use strict';

module.exports = function(grunt) {

  // Configuración del proyecto
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    docco: { // Documentacion
  	  debug: {
    	  src: ['*.js', './lib/*.js'], // Indicamos que genere documentacion de los ficheros JS
    	  options: {
    		  output: 'docs/'
    	  }
  	  }
    }
  });

  // Carga el plugin de grunt para hacer esto
  grunt.loadNpmTasks('grunt-docco');

  // Tarea por omisión: generar la documentación
  grunt.registerTask('default', ['docco']);
};