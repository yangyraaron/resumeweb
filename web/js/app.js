/**
 * the whole application logic
 */
$(function() {
	var User = Backbone.Model.extend({
		idAttribute: '_id',
		defaults: {
			'userName': '',
			'sex': '',
			'birthday': '',
			'mobile': '',
			'email': '',
			'source': '',
			'education': {},
			'experiences': []
		},
		url: '/users/[:id]'
	});

	User.prototype.bindData = function(user) {
		for(var key in user.attributes){
			this.set(key,user.get(key));
		}
	}

	var UserList = Backbone.Collection.extend({
		model: User,
		url: '/users'
	});

	var currentUser = new User();

	function generateBaiscRowTemplate(map) {
		var userBasicRowTemplate = '<div class="row">';

		for (var key in map) {
			userBasicRowTemplate += '<div class="col-xs-2">' + map[key] + ':</div>';
			userBasicRowTemplate += '<div class="col-xs-4"><%=' + key + '%></div>';
		};
		userBasicRowTemplate += '</div>';
		return userBasicRowTemplate;
	}

	var userBasicTempalte = generateBaiscRowTemplate({
		sex: '性別',
		birthday: '生日',
		mobile: '手机',
		email: '邮件',
		source: '来源'
	});

	var UserBasicView = Backbone.View.extend({
		el: $('#div_user_basic'),
		template: _.template(userBasicTempalte),
		initialize: function() {
			console.log('UserBasicView is initializing');

			this.listenTo(this.model, 'change', this.render);
			this.listenTo(this.model, 'destroy', this.remove);

			this.model.fetch();
		},
		render: function() {
			console.log('UserBasicView is rendering');

			this.$el.html(this.template(this.model.toJSON()));

			return this;
		}
	});

	var userBasicView = new UserBasicView({
		model: currentUser
	});

	var userItemTemplate = '<a href="#" class="list-group-item">' +
		'<h4 class="list-group-item-heading"><%= userName%></h4>' +
		'<span class="list-group-item-text">性別:&nbsp;<%= sex%></span><br/>' +
		'<span class="list-group-item-text">手机:&nbsp;<%= mobile%></span></a>';

	var UserItemView = Backbone.View.extend({
		template: _.template(userItemTemplate),
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

			this.model.fetch();
			currentUser.bindData(this.model);
		}
	});

	var users = new UserList();

	var UsersListView = Backbone.View.extend({
		el: $('#div_users'),
		initialize: function() {
			console.log('UsersListView is initializing');

			//this.listenTo(users,'add',this.addUser);
			this.listenTo(users, 'reset', this.addAll);
			//this.listenTo(users,'all',this.render);

			users.fetch({
				reset: true
			});
		},
		render: function() {
			console.log('usersListView is rendering');
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

			users.each(this.addUser, this);
		}

	});

	var app = new UsersListView();
});