'use strict';

module.exports = function(grunt) {

  // Configuración del proyecto
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    docco: { // Documentation!
  	  debug: {
    	  src: ['*.js', './lib/*.js'], // Indicamos que genere documentacion de los ficheros JS
    	  options: {
    		  output: 'docs/'
    	  }
  	  }
    },
    uglify: { // Minify/Compress client JavaScript
      dev:{ // Do not compress JS, we want to see errors while we develop
        options:{
          compress: false,
          wrap: false,
          mangle:false,
          beautify:true
        },
        files: {  // My JS files and other libraries
          'public_html/js/osc.min.js': ['public_html/js/own_components/*.js']
        }
      },
      dist:{  // well compressed JS for distribution
        options:{
          compress: true,
          wrap: false,
          mangle:true
        },
        files: {  // My JS files and other libraries
          'public_html/js/osc.min.js': ['public_html/js/bower_components/*/*.js', 'public_html/js/bower_components/*.js', 'public_html/js/own_components/*.js']
        }
      }
    },
    bower: { // Install client libraries
      install: {
          options: {
              targetDir: './public_html/js/bower_components',
              layout: 'byComponent',
              install: true,
              verbose: true,
              cleanBowerDir: true
          }
      }
    },
    cssmin: {
      target: {
        files: [{
          expand: true,
          cwd: 'public_html/css/my_css',
          src: ['*.css', '!*.min.css'],
          dest: 'public_html/css',
          ext: 'osc.min.css'
        }]
      }
    }
  });

  // Carga el plugin de grunt para hacer esto
  grunt.loadNpmTasks('grunt-docco');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-bower-task');
  grunt.loadNpmTasks('grunt-contrib-cssmin');

  // Tarea por omisión: generar la documentación
  grunt.registerTask('default', ['docco', 'bower', 'uglify:dist', 'cssmin']); // Generate all
  grunt.registerTask('setup', ['bower', 'uglify:dist', 'cssmin']); // Install JS client packages with bower and then, compress and minify ALL (bower JS and my own JS, and CSS)
  grunt.registerTask('dev', ['bower', 'uglify:dev', 'cssmin']); // dev mode
  grunt.registerTask('min', ['uglify:dist', 'cssmin']);
  grunt.registerTask('heroku', ['bower', 'uglify:dist', 'cssmin']); // heroku task
};