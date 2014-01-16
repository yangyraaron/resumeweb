var mongoose = require('mongoose');
var Schema = mongoose.Schema;

function Db(host, port, database) {
	this._url = 'mongodb://' + host + ':' + port + '/' + database;
	this._conn = null;
}

Db.prototype = {
	isConnected:function () {
		return mongoose.connection && (mongoose.connection.readyState == 1 ||
			mongoose.connection.readyState==2);	
	},
	open: function(option,callback) {
		if(this.isConnected()){
			this._conn = mongoose.connection;
			if(callback) callback(null);
			console.log('the connection is still opened');
			return;
		}

		var that = this;
		
		if (!this._url) {
			var err = 'the host and port doesn\'t provide'
			console.error(err);
			callback(err);
			return;
		}

		mongoose.connect(this._url, option);
		this._conn = mongoose.connection;

		this._conn.on('err', function(e) {
			console.error('connect to mongodb faild');
			console.error('the error :' + e);

			if (onerr) onerr(e);
		})

		this._conn.on('disconnected', function() {
			console.log('the connection closed');
		})

		this._conn.once('open', function() {
			console.log('the connection to ' + that._url + ' is opened');

			if(callback) callback();
		});


	},
	model: function(name, schema, option) {
		console.log('getting ' + name + ' model');

		if(!this.isConnected())
			return null;

		try {
			return mongoose.model(name, new Schema(schema, option));
		} catch (e) {
			console.error('getting ' + name + ' model error');
			console.error('exception:' + e);
			return null;
		}

	},
	close: function() {
		try {
			this._conn.close();
		} catch (e) {
			console.error('close model error');
			console.error('exception:' + e);
		}
	}
};

exports.instance = Db;