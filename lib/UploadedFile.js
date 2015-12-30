
exports.UploadedFileController = function(colecc){

	// Coleccion de la BD Mongo
	this.coleccion = colecc;

	this.prepareIndexes = function(){
		var c = this.coleccion;
	}

	this.add = function(file, cb){
		// Add file to DB
		var c = this.coleccion;
		var r = this.redisdb;
		c.insert({
			name: file.name,
			content: file.content,
			keys: file.keys
		}, function(err, newfile){
			if(err || !newfile)
			{
				return cb(err, newfile);
			}

			cb(null, newfile);
		});
	};

	this.update = function(id, data, cb){
		var c = this.coleccion;
		c.update({_id:id}, { $set:data }, cb);
	};

	this.getById = function(id, cb){
		// Get file by ID
		this.coleccion.find({_id:id}, cb);
	};

	this.isOwner = function(uid, fid, cb){
		// Get if an user is owner of a file
		// all users with access to the file are owners
		this.coleccion.find({_id:fid}, function(err, f){
			f = f[0];
			if(err || !f)
			{
				return cb("Error obtaining file", null);
			}

			var isOwner = uid in f.keys;
			cb(null, isOwner);
		});
	};

	this.getByName = function(name, cb){
		// Get file by name
		this.coleccion.find({name:name}, cb);
	};

	this.search = function(name, cb){
		// Search file by name
		this.coleccion.find({name:{"$regex":name}}, cb);
	};

	this.delete = function(id, cb){
		// Delete user by username
		this.coleccion.remove({_id:id}, cb);
	};

};

