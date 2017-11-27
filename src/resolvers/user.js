import knex from '../../config/db/knex';
import bcrypt from 'bcrypt';

import { formatErrors } from '../../utils/formatErrors';
import { tryLogin } from '../auth';
import { requiresAuth } from '../permissions';

export default {
  User: {
    teams: async (parent, args, { user }) => {
      // console.log('USER TEAMS', channel.team_id, user.id)
      const tms = await knex.raw(
        'select * from teams t join members m on t.id = m.team_id where m.user_id = :userId',
        {
          userId: user.id
        }
      );
      return tms.rows;
    }
  },
  Query: {
    allUsers: (parent, args) => knex('users').select('*'),
    getUser: (parent, { userId }) =>
      knex('users')
        .where({ id: userId })
        .first(),
    me: requiresAuth.createResolver(async (parent, args, { user }) => {
      const me = await knex('users')
        .where({ id: user.id })
        .first();
      return me;
    }),
    allTeams: requiresAuth.createResolver(async (parent, args, { user }) =>
      knex('teams').where({ owner: user.id })
    ),

    // id is from teams, team_id from members
    // this may need to change if you specify a primary key of id in
    // the join table
    inviteTeams: requiresAuth.createResolver(async (parent, args, { user }) => {
      const q = await knex.raw(
        'select * from teams t join members m on t.id = m.team_id where m.user_id = :userId',
        {
          userId: user.id
        }
      );
      return q;
    })
  },
  Mutation: {
    login: (parent, { email, password }, { SECRET, SECRET2 }) =>
      tryLogin(email, password, SECRET, SECRET2),

    register: async (parent, args) => {
      try {
        const hashedPassword = await bcrypt.hash(args.password, 12);
        const [user] = await knex('users')
          .insert({
            username: args.username,
            email: args.email,
            password: hashedPassword
          })
          .returning('*');

        return {
          ok: true,
          user
        };
      } catch (err) {
        console.log(err);
        return {
          ok: false,
          errors: formatErrors(err)
        };
      }
    }
  }
};
