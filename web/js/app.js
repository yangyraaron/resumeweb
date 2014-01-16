/**
 * the whole application logic
 */
$(function() {
	var require, define;

	(function() {
		var modules = [];

		function build(module) {
			var factory = module.factory;
			delete module.factory;

			module.exports = {};
			factory(require, module.exports, module);

			return module.exports;
		}

		require = function(id) {
			var module = modules[id];

			if (!modules[id]) {
				throw 'module ' + id + ' not found';
			}
			return module.factory ? build(module) : module.exports;
		};

		define = function(id, factory) {
			if (modules[id]) {
				throw 'module ' + id + 'already definded';
			}

			modules[id] = {
				id: id,
				factory: factory
			}
		};

		define.remove = function(id) {
			delete modules[id];
		};

	})();

	define('Models', function(require, exports, module) {
		var User = Backbone.Model.extend({
			idAttribute: '_id',
			defaults: {
				userName: '',
				sex: '',
				birthday: '',
				mobile: '',
				email: '',
				source: '',
				education: {
					'college': '',
					speciality: '',
					degree: ''
				},
				experiences: []
			},
			url: function() {
				return this.id ? '/users/' + this.id : 'users';
			}
		});
		User.prototype.bindData = function(user) {
			for (var key in user.attributes) {
				this.set(key, user.get(key));
			}
		}
		exports.User = User;
		exports.UserList = Backbone.Collection.extend({
			model: User,
			url: '/users'
		});
	});

	define('templates', function(require, exports, module) {
		function generateBaiscRowTemplate(map) {
			var userBasicRowTemplate = '<div class="row">';

			for (var key in map) {
				userBasicRowTemplate += '<div class="col-xs-2">' + map[key] + ':</div>';
				userBasicRowTemplate += '<div class="col-xs-4"><%=' + key + '%></div>';
			};
			userBasicRowTemplate += '</div>';
			return userBasicRowTemplate;
		}

		var userBasicTemplate = generateBaiscRowTemplate({
			sex: '性別',
			birthday: '生日',
			mobile: '手机',
			email: '邮件',
			source: '来源'
		});

		var userItemTemplate = '<a href="#" class="list-group-item">' +
			'<h4 class="list-group-item-heading"><%= userName%></h4>';

		var workExTemplate = '<tr><td><%=time%></td>' +
			'<td><%=position%></td>' +
			'<td><%=company%></td></tr>';

		var educationTemplate = '<tr><td><%= college%></td>' +
			'<td><%= speciality%></td>' +
			'<td><%= degree%></td></tr>';

		exports.UserBasicTemplate = userBasicTemplate;
		exports.UserItemTemplate = userItemTemplate;
		exports.WorkExTemplate = workExTemplate;
		exports.EducationTemplate = educationTemplate;
	});

	define('Views', function(require, exports, module) {
		templates = require('templates');

		var UserBasicView = Backbone.View.extend({
			el: $('#div_user_detail'),
			basicTemplate: _.template(templates.UserBasicTemplate),
			workExTemplate: _.template(templates.WorkExTemplate),
			educationTemplate: _.template(templates.EducationTemplate),
			initialize: function() {
				console.log('UserBasicView is initializing');

				this.basicContainer = $('#div_user_basic');
				this.workExContainer = $('#tb_user_experiences');
				this.educationContainer = $('#tb_education');

				this.listenTo(this.model, 'change', this.render);
				this.listenTo(this.model, 'destroy', this.remove);

				this.model.fetch();
			},
			render: function() {
				console.log('UserBasicView is rendering');
				this.basicContainer.html(this.basicTemplate(this.model.toJSON()));

				this.addEducation();
				this.addWorkExs();

				return this;
			},
			addEducation: function() {
				this.educationContainer.empty();
				this.educationContainer.append(this.educationTemplate(this.model.get('education')));
			},
			addWorkExs: function() {
				this.workExContainer.empty();

				var exs = this.model.get('experiences');

				for (var i = 0; i < exs.length; i++) {
					this.workExContainer.append(this.workExTemplate(exs[i]));
				};
			}
		});

		var UserItemView = Backbone.View.extend({
			template: _.template(templates.UserItemTemplate),
			events: {
				'click a': 'onSelected'
			},
			initialize: function() {
				console.log('UserItemView is initializing');

				this.listenTo(this.model, 'change', this.render);
				this.listenTo(this.model, 'destroy', this.remove);
			},
			render: function() {
				console.log('UserItemView is rendering');

				this.$el.html(this.template(this.model.toJSON()));

				return this;
			},
			onSelected: function() {
				console.log('the user ' + this.model.get('userName') + ' selected');

				this.listenTo(this.model, 'sync', function() {
					currentUser.bindData(this.model);
				})
				this.model.fetch();
			}

		});

		var UsersListView = Backbone.View.extend({
			el: $('#div_users'),
			initialize: function() {
				console.log('UsersListView is initializing');

				//this.listenTo(users,'add',this.addUser);
				this.listenTo(this.model, 'reset', this.addAll);
				//this.listenTo(users,'all',this.render);

				this.model.fetch({
					reset: true
				});
			},
			render: function() {
				console.log('UsersListView is rendering');
			},
			addUser: function(user) {
				console.log('add User');

				var view = new UserItemView({
					model: user
				});

				this.$el.append(view.render().el);
			},
			addAll: function() {
				console.log('add all users');

				this.model.each(this.addUser, this);
			}

		});

		exports.UserBasicView = UserBasicView;
		exports.UserItemView = UserItemView;
		exports.UsersListView = UsersListView;
	});

	var Models = require('Models');
	var Views = require('Views');

	var currentUser = new Models.User();

	var userBasicView = new Views.UserBasicView({
		model: currentUser
	});

	var users = new Models.UserList();

	var app = new Views.UsersListView({
		model: users
	});
});