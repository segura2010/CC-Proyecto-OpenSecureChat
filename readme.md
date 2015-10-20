# Sistema de Mensajería Instantanea (Chat)
___

Se realizará un sistema de chat seguro. Se utilizarán algoritmos de cifrado extremo a extremo que permitan que la comunicación entre usuarios sea segura y privada.

Se desarrollará una aplicación web. El sistema hará uso de bases de datos para alojar la información de usuarios y los mensajes.

Los usuarios deberán registrarse en el sistema para poder iniciar conversaciones con el otros usuarios. Las conversaciones de los usuarios, los mensajes, se cifrarán y se enviarán al servidor para guardarlos en la base de datos. De este modo, los usuarios podrán recuperar las conversaciones en cualquier dispositivo que usen para acceder a la web. 

Se usarán algoritmos de cifrado asimétrico, por tanto cada usuario tendrá dos claves, una pública y otra privada. De forma que, cuando un usuario desee enviar un mensaje a otro, solicitará al servidor la clave pública del otro usuario para poder cifrar los mensajes y enviarlos de forma segura.

# Desarrollo

Se desarrollará una plataforma web, por lo que el lenguaje elegido para desarrollar el sistema es NodeJS para la parte de "backend", y HTML y JavaScript para la parte "frontend". Para las bases de datos se utilizará, en principio MongoDB, aunque se intentarán usar dos bases de datos distintas. Por un lado MongoDB para alojar la información de los usuarios, y por otro lado Redis para alojar los mensajes. La idea de usar Redis para los mensajes es que es bastante más rápida en lectura y escritura que MongoDB, por lo que es mucho más interesante para que los mensajes se guarden y se envíen lo antes posible a los usuarios. Además Redis permite tener muchas conexiones simaltaneas, por lo que es mas interesante para nuestro sistema por si llegase el caso de que tuviese mucho usuarios al mismo tiempo. Además, la la librería de Redis para NodeJS (node_redis) incluye una API de "publish/suscribe", lo que puede usarse para que los cliente se suscriban a un canal (cada usuario tendría su propio canal) y reciban las novedades de este canal (para recibir los mensajes), o publiquen en ese canal (para enviar un mensaje a un usuario).

Para conectar el servidor con la interfaz web se usarán WebSockets, usando Socket.IO. De esta forma, una vez que el usuario inicia sesión, abrirá un websocket al servidor y a través de el enviará y recibirá los mensajes desde el servidor.

Se seguirá la metodología de desarrollo continuo DevOps, por lo que se realizarán pruebas unitarias y se utilizará un sistema de integración continua, lo que permitirá comprobar que todo funcione correctamente y que se despligue el sistema lo antes posible. Para la realización de pruebas unitarias en NodeJS se utilizará Mocha, y para aplicar la integración continua se utilizará TravisCI.

# Motivación

Los motivos por los que he decidido realizar este proyecto son, principalmente, que siempre he tenido curiosidad sobre como se desarrolla un sistema de chat. Además, que sea un chat lo más seguro posible utilizando algoritmos de cifrado. Después de salir Telegram, he tenido curiosidad por como podría estar desarrollado, y como el código que se ejecuta en el servidor no es libre, me parecía interesante que el código de un servicio que trata de ser lo más seguro posible fue libre y cualquiera pueda comprobar que es lo que realmente esta haciendo y si realmente es tan seguro como se supone.

# Licencia

Este software esta publicado bajo la licencia GNU GENERAL PUBLIC LICENSE Version 2.
