
# Sistema de Mensajería Instantanea (Chat)
___

[![Build Status](https://travis-ci.org/segura2010/CC-Proyecto-OpenSecureChat.svg?branch=master)](https://travis-ci.org/segura2010/CC-Proyecto-OpenSecureChat) [![Dependencies Status](https://david-dm.org/segura2010/CC-Proyecto-OpenSecureChat.svg)](https://david-dm.org) [![Code Climate](https://codeclimate.com/github/segura2010/CC-Proyecto-OpenSecureChat/badges/gpa.svg)](https://codeclimate.com/github/segura2010/CC-Proyecto-OpenSecureChat)


Se realizará un sistema de chat seguro. Se utilizarán algoritmos de cifrado extremo a extremo que permitan que la comunicación entre usuarios sea segura y privada.

Se desarrollará una aplicación web. El sistema hará uso de bases de datos para alojar la información de usuarios y los mensajes.

Los usuarios deberán registrarse en el sistema para poder iniciar conversaciones con el otros usuarios. Las conversaciones de los usuarios, los mensajes, se cifrarán y se enviarán al servidor para guardarlos en la base de datos. De este modo, los usuarios podrán recuperar las conversaciones en cualquier dispositivo que usen para acceder a la web. 

Se usarán algoritmos de cifrado asimétrico, por tanto cada usuario tendrá dos claves, una pública y otra privada. De forma que, cuando un usuario desee enviar un mensaje a otro, solicitará al servidor la clave pública del otro usuario para poder cifrar los mensajes y enviarlos de forma segura.

# Desarrollo

Se desarrollará una plataforma web, por lo que el lenguaje elegido para desarrollar el sistema es NodeJS para la parte de "backend", y HTML y JavaScript para la parte "frontend". Para las bases de datos se utilizará, en principio MongoDB, aunque se intentarán usar dos bases de datos distintas. Por un lado MongoDB para alojar la información de los usuarios, y por otro lado Redis para alojar los mensajes. La idea de usar Redis para los mensajes es que es bastante más rápida en lectura y escritura que MongoDB, por lo que es mucho más interesante para que los mensajes se guarden y se envíen lo antes posible a los usuarios. Además Redis permite tener muchas conexiones simaltaneas, por lo que es mas interesante para nuestro sistema por si llegase el caso de que tuviese mucho usuarios al mismo tiempo. Además, la la librería de Redis para NodeJS ([node_redis](https://github.com/NodeRedis/node_redis)) incluye una API de "publish/suscribe", lo que puede usarse para que los cliente se suscriban a un canal (cada usuario tendría su propio canal) y reciban las novedades de este canal (para recibir los mensajes), o publiquen en ese canal (para enviar un mensaje a un usuario).

Para conectar el servidor con la interfaz web se usarán WebSockets, usando ([Socket.IO](http://socket.io)). De esta forma, una vez que el usuario inicia sesión, abrirá un websocket al servidor y a través de el enviará y recibirá los mensajes desde el servidor.

Se seguirá la metodología de desarrollo continuo DevOps, por lo que se realizarán pruebas unitarias y se utilizará un sistema de integración continua, lo que permitirá comprobar que todo funcione correctamente y que se despligue el sistema lo antes posible. Para la realización de pruebas unitarias en NodeJS se utilizará Mocha, y para aplicar la integración continua se utilizará TravisCI.

# Motivación

Los motivos por los que he decidido realizar este proyecto son, principalmente, que siempre he tenido curiosidad sobre como se desarrolla un sistema de chat. Además, que sea un chat lo más seguro posible utilizando algoritmos de cifrado. Después de salir Telegram, he tenido curiosidad por como podría estar desarrollado, y como el código que se ejecuta en el servidor no es libre, me parecía interesante que el código de un servicio que trata de ser lo más seguro posible fue libre y cualquiera pueda comprobar que es lo que realmente esta haciendo y si realmente es tan seguro como se supone.

# Licencia

Este software esta publicado bajo la licencia GNU GENERAL PUBLIC LICENSE Version 2.

# Hitos del proyecto

## Hito 2

Se utiliza Travic-CI como sistema de integración continua, ya que parece ser el más usado para proyectos NodeJS.

Como se puede ver en los "badges" al principio de este readme, pasa los test definidos. Además del badge de integración continua de Travis, se han añadido otros que indican el estado de las dependencias del proyecto (indicadas en el package.json) y otro de CodeClimate, que analiza la calidad, la seguridad y el estilo del código.

Para la integración continua, se ha configurado Tavis a través del fichero [.travis.yml](https://github.com/segura2010/CC-Proyecto-OpenSecureChat/blob/master/.travis.yml). En el podemos ver que se indica que se pasen los tests en diferentes versiones de NodeJS y que use como servicios una base de datos Mongo y una Redis (para los test de usuario).

Por otro lado, se han añadido varias tareas, usando Grunt. En [Gruntfile.js](https://github.com/segura2010/CC-Proyecto-OpenSecureChat/blob/master/.travis.yml) podemos ver las diferentes tareas que se han configurado. Entre ellas, varias para comprimir y unir los ficheros JavaScript de la parte de cliente. Hay una tarea para comprimir si se usa en producción (para uso normal), y otra que se puede usar durante el desarrollo, de forma que no se comprime el código (solamente se une en un fichero) y se pueden ver facilmente los errores. Para archivos de estilos CSS también se ha añadido una tarea para comprimir el fichero. Y finalmente, se ha añadido una tarea para descargar e instalar las dependencias del cliente con Bower. Todas las tareas pueden ejecutarse por separado, o juntas, usando por ejemplo: 'dev', 'setup' o 'min'.

Por último, se pueden pasar los tests de la forma habitual en NodeJS ejecutando `npm test`.
