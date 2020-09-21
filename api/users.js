'use strict';

const querystring = require('querystring');

// http://127.0.0.1:8080/users?role=admin&status=active
const search
	= query => {
		const queryObject = querystring.parse(query.substring(1));
		console.log('[api | users | search]', [queryObject]);
		return [
			{
				'name': 'Mr. Arch',
				'role': 'admin',
				'email': 'arttolstykh@gmail.com',
				'isActive': true
			}
		];
	};

// http://127.0.0.1:8080/users
const users = async (body) => {
	console.log('[api | users | body]', [body]);
	let query;
	if (body.location) {
		query = body.location.search;
	} else {
		query = null
	}
	return query
		? search(query)
		: [
			{
				'name': 'Mr. Arch',
				'role': 'admin',
				'email': 'arttolstykh@gmail.com',
				'isActive': true
			},
			{
				'name': 'Guest',
				'role': 'guest',
				'email': 'guest@example.com',
				'isActive': false
			}
		];
}

module.exports = users;
