import knex from '../../config/db/knex';
import Promise from 'bluebird';

import { formatErrors } from '../../utils/formatErrors';
import { promisify } from '../../utils/knexHelpers';
import { requiresAuth } from '../permissions';

export default {
  Query: {
    getTeamMembers: requiresAuth.createResolver(async (parent, { teamId }) => {
      const members = await knex.raw(
        `
        select distinct u.*, m.admin 
        from users u 
        join members m on m.user_id = u.id 
        where m.team_id = :teamId
        `,
        {
          teamId
        }
      );
      return members.rows;
    })
  },
  Mutation: {
    // requires ownership of the team
    addTeamMember: requiresAuth.createResolver(
      async (parent, { email, teamId }, { user }) => {
        console.log('ADD TEAM MEMBER');
        try {
          const memberPromise = knex('members')
            .where({ team_id: teamId, user_id: user.id })
            .first();
          const userToAddPromise = knex('users')
            .where({ email })
            .first();
          // run db calls in parallel
          const [member, userToAdd] = await Promise.all([
            memberPromise,
            userToAddPromise
          ]);

          if (!member.admin) {
            return {
              ok: false,
              errors: [
                {
                  path: 'email',
                  message: 'You cannot add members to this team'
                }
              ]
            };
          }

          if (!userToAdd) {
            return {
              ok: false,
              errors: [
                {
                  path: 'email',
                  message: 'Could not find user with specified email'
                }
              ]
            };
          }

          await knex('members').insert({
            user_id: userToAdd.id,
            team_id: teamId
          });
          return {
            ok: true
          };
        } catch (err) {
          console.log(err);
          return {
            ok: false,
            errors: formatErrors(err)
          };
        }
      }
    ),
    createTeam: requiresAuth.createResolver(
      async (parent, { name }, { user }) => {
        // TODO  bluebird !!!
        // const trans = knex.transaction;
        // console.log('ORIGINAL', trans);
        const trx = await promisify(knex.transaction);
        // const trax = Promise.promisify(knex.transaction);
        // console.log('ptfy', trx);
        // console.log('bluebird', trax);
        //

        try {
          const [team] = await trx('teams')
            .insert({ name, owner_id: user.id })
            .returning('*');

          const channels = await knex('channels')
            .insert([
              { name: 'general', public: true, team_id: team.id },
              { name: 'random', public: true, team_id: team.id }
            ])
            .transacting(trx);

          const member = await knex('members')
            .insert({
              team_id: team.id,
              user_id: user.id,
              admin: true
            })
            .transacting(trx);

          await trx.commit();

          return {
            ok: true,
            team: team
          };
        } catch (err) {
          await trx.rollback();
          console.log('CREATE TEAM ERROR', err, formatErrors(err));
          return {
            ok: false,
            errors: formatErrors(err)
          };
        }
      }
    )
  },
  Team: {
    channels: async ({ id }, args) => {
      // console.log('TEAM CHANNELS', id);
      const rows = await knex('channels').where({ team_id: id });
      return rows;
    },
    directMessageMembers: async ({ id }, args, { user }) => {
      // console.log('DIR MSG MEMS', id);
      const rows = await knex.raw(
        'select distinct on (u.id) u.* from users u join direct_messages dm on (u.id = dm.sender_id) or (u.id = dm.receiver_id) where (:currentUserId = dm.sender_id or :currentUserId = dm.receiver_id) and dm.team_id = :teamId',
        {
          currentUserId: user.id,
          teamId: id
        }
      );
      return rows.rows;
    }
  }
};
