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
			paging: {
				curIndex: 1,
				size: 10
			},
			url: function() {
				var url = "users?pageIndex=" + this.paging.curIndex + "&pageSize=" + this.paging.size;
				return url;
			},
			selectedUser: null,
			select: function(user) {
				//if the selected user is the same one,then do nothing
				if (this.selectedUser && user && this.selectedUser.id == user.id) {
					return;
				}

				this.selectedUser = user;
				this.trigger('selectedUserChanged', {
					user: this.selectedUser
				});
			}
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
			userName: '姓名',
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

				this.listenTo(this.model, 'sync', this.render);
				//this.listenTo(this.model, 'change', this.update);
				this.listenTo(this.model, 'change:_id', this.update);
				this.listenTo(this.model, 'destroy', this.remove);


			},
			update: function() {
				console.log('model is updating');
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
				this.ael = this.$el.find('a');
				return this;
			},
			active: function() {
				this.ael.addClass('active');
			},
			deactive: function() {
				this.ael.removeClass('active');
			},
			onSelected: function(e) {
				console.log('the user ' + this.model.get('userName') + ' selected');

				this.trigger('selected', {
					user: this.model,
					view: this
				});
			}

		});

		var UsersListView = Backbone.View.extend({
			el: $('#div_nav'),
			events: {
				'click #a_prev': 'onPrev',
				'click #a_next': 'onNext'
			},
			activedView: null,
			initialize: function() {
				console.log('UsersListView is initializing');

				this.listenTo(this.model, 'reset', this.render);
				//this.listenTo(this.model,'selectedUserChanged',onSelectedChanged);

				this.usersGroup = $('#div_users');

				this.model.fetch({
					reset: true
				});
			},
			render: function() {
				console.log('UsersListView is rendering');
				this.addAll();

				this.activedView.onSelected();
			},
			addUser: function(user) {
				console.log('add User');

				var view = new UserItemView({
					model: user
				});

				this.listenTo(view, 'selected', this.onSelectedChanged);

				this.usersGroup.append(view.render().el);

				if (!this.activedView) {
					this.activedView = view;
				}
			},
			onSelectedChanged: function(arg) {
				if (this.activedView) {
					this.activedView.deactive();
				}
				this.activedView = arg.view;
				this.activedView.active();

				this.model.select(arg.user);
			},
			clear: function() {
				this.activedView = null;
				this.usersGroup.empty();
			},
			addAll: function() {
				console.log('add all users');

				this.usersGroup.empty();
				this.model.each(this.addUser, this);
			},
			onPrev: function() {
				console.log("prev");

				this.model.paging.curIndex -= 1
				this.model.fetch({
					reset: true
				});
			},
			onNext: function() {
				console.log('next');

				this.model.paging.curIndex += 1
				this.model.fetch({
					reset: true
				});
			}

		});

		exports.UserBasicView = UserBasicView;
		exports.UserItemView = UserItemView;
		exports.UsersListView = UsersListView;
	});

	var Models = require('Models');
	var Views = require('Views');

	var users = new Models.UserList();

	var app = new Views.UsersListView({
		model: users
	});

	var user = new Models.User();
	var detailView = new Views.UserBasicView({
		model: user
	});

	users.on('selectedUserChanged', function(arg) {
		user.set({'_id':arg.user.get('_id')});
	});

});