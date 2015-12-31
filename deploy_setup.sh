# Si no habias iniciado sesion ya, necesitaras hacerlos
heroku login;

# Crea la app en Heroku, debes  tener el cliente instalado y configurado
heroku create;

# Valores para variables de entorno necesarias (local)
export KEY_SIZE=2048;
export MONGODB_URL="URL_BASE_DATOS_MONGO";
export REDIS_URL="URL_BASE_DATOS_REDIS";
export PORT=3000;

# Valores para variables de entorno necesarias (Heroku), a partir de las locales
heroku config:set KEY_SIZE=$KEY_SIZE;
heroku config:set MONGODB_URL=$MONGODB_URL;
heroku config:set REDIS_URL=$REDIS_URL;

heroku config:set PUSH_CLIENT_ID="";
heroku config:set PUSH_CLIENT_SECRET="";
heroku config:set PUSH_REDIRECT_URL="";

# Estas variables tambien se puede ver el valor que contienen con comandos como:
heroku config:get KEY_SIZE;