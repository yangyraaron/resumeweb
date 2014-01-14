var express = require('express'),
	app = express(),
	ejs = require('ejs'),
	homeController = require('./controllers/homeController')
	domain = require('domain');

var viewDir = __dirname + '/web',
	globalDomain = domain.create();

globalDomain.on('error', function(err) {
	if (err instanceof error.HttpError) {
		console.log('global error:' + err.message)
	} else {
		console.log('global error:' + err)
	}

});

globalDomain.run(function() {
	app.configure(function() {
		app.use(express.bodyParser());
		app.use(express.methodOverride());

		app.engine('.html', ejs.__express);
		app.set('views', viewDir);
		app.set('view engine','html')
		app.use(express.static(viewDir));
		app.use(express.favicon());

		app.use(express.cookieParser('security'));
		app.use(express.session());

	});
	
	app.use('/users/:id',homeController.info);
	app.use('/users',homeController.list);
	app.use('/',homeController.home);

	app.listen(3000);

	console.log('listening to 3000');
})
