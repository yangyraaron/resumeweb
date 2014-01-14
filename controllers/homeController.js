var user = require('../model/user'),
	exec = require('child_process').exec,
	child;

function home(req, res) {
	console.log('handling home request');

	res.render('home');
}

function list(req, res) {
	console.log('handling list request')

	var pageIndex = req.param('pageIndex') || 1;
	var pageSize = req.param('pageSize') || 10;
	var userModel = new user.instance();

	userModel.list(pageIndex, pageSize, function(err, users) {
		if (err)
			console.error('get users error');
		else
			console.log('response to list request with users ');
		res.json(users);
	});
}

function info(req, res) {
	console.log('handling info request');

	var userId = req.param('id');
	if (!userId) {
		console.warn('the userid is null');
		res.json({});
	} else {
		var userModel = new user.instance();

		userModel.info(userId, function(err, user) {
			if (err) {
				console.error('get users error')
			} else
				console.log('response to to info request with user');

			res.json(user);
		})
	}

}

exports.home = home;
exports.list = list;
exports.info = info;