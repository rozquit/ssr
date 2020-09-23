'use strict'

// const querystring = require('querystring');
// const {Pool} = require('pg');
// const {PG_USER, PG_PASSWORD, PG_NAME} = require('../config');
// const {QueryBuilder} = require('../utils/query-builder');

// const pgConfig = {
// 	max: 1,
// 	user: PG_USER,
// 	password: PG_PASSWORD,
// 	database: PG_NAME,
// };

// let pgPool;

// const crud
// 	= async (pgPool, queryObject) => {
// 	switch (true) {
// 		case queryObject.hasOwnProperty('getMany'):
// 			return;
// 		case queryObject.hasOwnProperty('getOne'):
// 			return;
// 		case queryObject.hasOwnProperty('createOne'):
// 			return;
// 		case queryObject.hasOwnProperty('createMany'):
// 			return;
// 		case queryObject.hasOwnProperty('updateOne'):
// 			return;
// 		case queryObject.hasOwnProperty('replaceOne'):
// 			return;
// 		case queryObject.hasOwnProperty('deleteOne'):
// 			return;
// 	}
// }

const randomInt =
	(min, max) =>
	  Math.floor(min + Math.random() * (max + 1 - min))

const list = [
  {
    name: 'Mr. Arch',
    role: 'admin',
    email: 'arttolstykh@gmail.com',
    isActive: true
  },
  {
    name: 'Manager',
    role: 'manager',
    email: 'arttolstykh@gmail.com',
    isActive: false
  },
  {
    name: 'Guest',
    role: 'guest',
    email: 'guest@example.com',
    isActive: true
  }
]

const item =
	() => {
	  const { name, role, email, isActive } = list[randomInt(0, 2)]
	  return ({
	    name: `${name}`,
	    role: `${role}`,
	    email: `${email}`,
	    isActive: `${isActive}`
	  })
	}

const search =
	async (pgPool, query) => {
	  // const queryObject = typeof query === 'string' ? {...querystring.parse(query.substring(1))} : query;
	  // const sqlQuery = await crud(pgPool, queryObject);
	  return [
	    {
	      name: 'Mr. Arch',
	      role: 'admin',
	      email: 'arttolstykh@gmail.com',
	      isActive: true
	    }
	  ]
	}

const users =
	async body => {
	  // if (!pgPool) pgPool = new Pool(pgConfig);
	  let query = null
	  if (body.location) query = body.location.search
	  return query
	    ? await search()
	    : Array.from({ length: 1000 }, () => item())
	}

module.exports = users
