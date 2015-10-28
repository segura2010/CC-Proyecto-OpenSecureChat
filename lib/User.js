
exports.UserController = function(colecc){

	// Coleccion de la BD Mongo
	this.coleccion = colecc;

	this.prepareIndexes = function(){
		var c = this.coleccion;

		c.index('email', { unique: true }); // unique
		c.index('username', { unique: true }); // unique
		c.index('password');
	}

	this.add = function(user,  cb){
		// Add user to DB
		// "user" is an object with -> {username, email, password, pk, privKey}
		var c = this.coleccion;
		this.getByName(username, function(err, users){
			if(users.length == 0)
			{
				c.insert({
					username: user.username,
					email: user.email,
					password: user.password,
					public_key: user.pk,
					private_key: user.privKey,
					picture: user.picture
				}, cb);
			}
			else
			{
				cb("Error: User already exists", null);
			}
		});
	};

	this.getById = function(id, cb){
		// Get user by ID
		this.coleccion.find({_id:id}, cb);
	};

	this.getByUsername = function(username, cb){
		// Get user by username
		this.coleccion.find({username:username}, cb);
	};

	this.getByEmail = function(email, cb){
		// Get user by username
		this.coleccion.find({email:email}, cb);
	};

	this.search = function(username, cb){
		// Search user by username
		this.coleccion.find({username:{"$regex":username}}, cb);
	};

	this.list = function(limit, cb){
		// list last "limit" users
		this.coleccion.find({}, {limit: limit}, cb);
	};

	this.delete = function(nombre, cb){
		// Delete user by username
		this.coleccion.remove({nombreusuario:nombre}, cb);
	};

};

