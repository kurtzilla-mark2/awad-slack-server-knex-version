import knex from '../../config/db/knex';

import { formatErrors } from '../../utils/formatErrors';
import { requiresAuth } from '../permissions';

export default {
  Mutation: {
    createChannel: requiresAuth.createResolver(
      async (parent, args, { user }) => {
        try {
          // verify the ownership of the team
          const member = await knex('members')
            .where({ teamId: args.teamId, userId: user.id })
            .first();
          if (!member.admin) {
            return {
              ok: false,
              errors: [
                {
                  path: 'name',
                  message: 'Only Team owners can create channels'
                }
              ]
            };
          }

          console.log('CREATE CHANNEL', args.teamId, args.name);
          const channel = await knex('channels').insert({
            name: args.name,
            team_id: args.teamId,
            public: true
          });
          return {
            ok: true,
            channel
          };
        } catch (err) {
          console.log(err);
          return {
            ok: false,
            error: formatErrors(err)
          };
        }
      }
    )
  }
};
