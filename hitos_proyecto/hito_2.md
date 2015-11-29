## Hito 2

Se utiliza Travic-CI como sistema de integración continua, ya que parece ser el más usado para proyectos NodeJS.

Como se puede ver en los "badges" al principio de este readme, pasa los test definidos. Además del badge de integración continua de Travis, se han añadido otros que indican el estado de las dependencias del proyecto (indicadas en el package.json) y otro de CodeClimate, que analiza la calidad, la seguridad y el estilo del código.

Para la integración continua, se ha configurado Tavis a través del fichero [.travis.yml](https://github.com/segura2010/CC-Proyecto-OpenSecureChat/blob/master/.travis.yml). En el podemos ver que se indica que se pasen los tests en diferentes versiones de NodeJS y que use como servicios una base de datos Mongo y una Redis (para los test de usuario).

Por otro lado, se han añadido varias tareas, usando Grunt. En [Gruntfile.js](https://github.com/segura2010/CC-Proyecto-OpenSecureChat/blob/master/.travis.yml) podemos ver las diferentes tareas que se han configurado. Entre ellas, varias para comprimir y unir los ficheros JavaScript de la parte de cliente. Hay una tarea para comprimir si se usa en producción (para uso normal), y otra que se puede usar durante el desarrollo, de forma que no se comprime el código (solamente se une en un fichero) y se pueden ver facilmente los errores. Para archivos de estilos CSS también se ha añadido una tarea para comprimir el fichero. Y finalmente, se ha añadido una tarea para descargar e instalar las dependencias del cliente con Bower. Todas las tareas pueden ejecutarse por separado, o juntas, usando por ejemplo: 'dev', 'setup' o 'min'.

Por último, se pueden pasar los tests de la forma habitual en NodeJS ejecutando `npm test`.