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
				size: 20
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
				userBasicRowTemplate += '<div class="col-xs-1">' + map[key] + ':</div>';
				userBasicRowTemplate += '<div class="col-xs-3"><%=' + key + '%></div>';
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
			'<h4 class="list-group-item-heading text-center"><%= userName%></h4>';

		var workExTemplate = '<tr><td><%=time%></td>' +
			'<td><%=position%></td>' +
			'<td><%=company%></td></tr>';

		var educationTemplate = '<tr><td><%= college%></td>' +
			'<td><%= speciality%></td>' +
			'<td><%= degree%></td></tr>';

		var slidePageTemplate = '<div class="item">' +
			'<div class="list-group"></div></div>';

		exports.UserBasicTemplate = userBasicTemplate;
		exports.UserItemTemplate = userItemTemplate;
		exports.WorkExTemplate = workExTemplate;
		exports.EducationTemplate = educationTemplate;
		exports.SlidePageTemplate = slidePageTemplate;
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

				this.listenTo(this.model, 'change:_id', this.render);
				this.listenTo(this.model, 'destroy', this.remove);

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

				//if still have not sychornized with server then sync
				if (!this.model.get('mobile')) {
					this.listenTo(this.model, 'sync', function() {
						this.trigger('selected', {
							user: this.model,
							view: this
						});
					});
					this.model.fetch();
				} else {
					this.trigger('selected', {
						user: this.model,
						view: this
					});
				}
			}

		});

		var UsersListView = Backbone.View.extend({
			el: $('#div_slider'),
			events: {
				'click #a_prev': 'onPrev',
				'click #a_next': 'onNext'
			},
			activedView: null,
			internalIndex: 0,
			totalPages: 0,
			slidePageTemplate: templates.SlidePageTemplate,
			paging: {
				oper: null
			},
			initialize: function() {
				console.log('UsersListView is initializing');

				this.listenTo(this.model, 'reset', this.render);

				this.slider = $('#div_slider');
				this.container = this.slider.find('.carousel-inner');

				this.model.fetch({
					reset: true
				});
			},
			render: function() {
				console.log('UsersListView is rendering');

				if (this.model.length == 0)
					return;

				if (this.totalPages == 0) {
					this.addPage(0, {
						active: true
					});
				} else
					this.addPage(0);

				this.addPage(1);

				var pagingOper = this.paging.oper;
				if (this.paging.oper == 'next') {
					this.slider.carousel('next');
				}
				this.syncInternalIndex(this.internalIndex+1);
				this.slider.carousel('pause');
			},
			addUser: function(user, usersGroup) {
				console.log('add User');

				var view = new UserItemView({
					model: user
				});

				this.listenTo(view, 'selected', this.onSelectedChanged);

				usersGroup.append(view.render().el);

			},
			onSelectedChanged: function(arg) {
				if (this.activedView) {
					this.activedView.deactive();
				}
				this.activedView = arg.view;
				this.activedView.active();

				this.model.select(arg.user);
			},
			addPage: function(index, options) {
				console.log('add all users to Group' + index);

				options = $.extend({
					active: false
				}, options);
				var page = $(this.slidePageTemplate);
				if (options.active) {
					page.addClass('active');
				}

				var i = index * 10;
				var len = (index + 1) * 10;
				len = len < this.model.length ? len : this.model.length;

				while (i < len) {
					this.addUser(this.model.at(i), page);
					i++;
				}

				this.container.append(page);
				this.totalPages += 1;
			},
			syncInternalIndex: function(value) {
				if (value < 1)
					this.internalIndex = 1;
				else
					this.internalIndex = value;
			},
			syncData: function(count) {
				if (count % 2 != 0) {
					var count = count + 1;
				}
				this.paging.oper = 'next';

				this.model.paging.curIndex = (count / 2);
				this.model.fetch({
					reset: true
				});
			},
			onPrev: function() {
				console.log("prev");
				var count = this.internalIndex - 1;
				this.syncInternalIndex(count);
				if (count >= 1) {
					this.slider.carousel('prev');
					this.slider.carousel('pause');
				}

			},
			onNext: function() {
				console.log('next');
				var count = this.internalIndex + 1;
				if (count <= this.totalPages) {
					this.slider.carousel('next');
					this.slider.carousel('pause');
					this.syncInternalIndex(count);
				} else {
					this.syncData(count);
				}
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
		user.set({
			'_id': arg.user.get('_id'),
			userName: arg.user.get('userName'),
			sex: arg.user.get('set'),
			birthday: arg.user.get('birthday'),
			mobile: arg.user.get('mobile'),
			email: arg.user.get('email'),
			source: arg.user.get('source'),
			education: arg.user.get('education'),
			experiences: arg.user.get('experiences')
		});
	});

});