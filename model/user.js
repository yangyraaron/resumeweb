var db = require('./db');

dbInstance = new db.instance('localhost', '27017', 'resume');
model = null;

function getModel(user) {
	if (!model) {
		model = dbInstance.model(user.name, user.schema, {
			collection: user.collection
		});
	}

	return model;
}

function User() {
	this.collection = 'users';
	this.name = 'User';
}

User.prototype = {
	schema: {

		userName: String,
		source: String,
		sex: String,
		birthday: String,
		mobile: String,
		email: String,
		education: {
			college: {
				type: String,
				default: ''
			},
			speciality: {
				type: String,
				default: ''
			},
			degree: {
				type: String,
				default: ''
			}
		},
		experiences: [{
			company: String,
			position: String,
			time: String
		}]
	},
	list: function(pageIndex, pageSize, callback) {
		var that = this;
		dbInstance.open({}, function(err) {
			var UserModel = getModel(that);

			console.log('finding users with pageIndex : %,page size:%', pageIndex, pageSize);

			var query = UserModel.find({}, '_id userName');
			query.sort({
				userName: 1
			});
			query.skip((pageIndex - 1) * pageSize);
			query.limit(pageSize);
			query.exec(function(err, users) {
				if (err) {
					console.error('call user.list error');
				}
				if (callback) callback(err, users);
			});
		});
	},
	info: function(id, callback) {
		console.log('the call user.info with id:' + id);
		var that = this;
		dbInstance.open({}, function(err) {
			var UserModel = getModel(that);

			UserModel.findById(id, function(err, user) {
				if (err) {
					console.error('call user.info error:' + err);
				}
				if (callback) callback(err, user);
			});
		});
	}
};

exports.instance = User