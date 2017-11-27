import { withFilter } from 'graphql-subscriptions';
import knex from '../../config/db/knex';

import { requiresAuth, requiresTeamAccess } from '../permissions';
import pubsub from '../../pubsub';

const NEW_CHANNEL_MESSAGE = 'NEW_CHANNEL_MESSAGE';

export default {
  Subscription: {
    newChannelMessage: {
      subscribe: requiresTeamAccess.createResolver(
        withFilter(
          () => pubsub.asyncIterator(NEW_CHANNEL_MESSAGE),
          (payload, args) => payload.channelId === args.channelId
        )
      )
    }
  },
  Message: {
    user: ({ user, user_id }, args) => {
      if (user) {
        return user;
      }
      return knex('users')
        .where({ id: user_id })
        .first();
    }
  },
  Query: {
    messages: requiresAuth.createResolver(
      async (parent, { channelId }, context) => {
        // messages: async (parent, { channelId }) =>
        const msgs = await knex('messages')
          .column('*', { createdAt: 'created_at' })
          .where({ channel_id: channelId })
          .orderBy('created_at', 'ASC');

        // console.log('MSGSG', msgs);
        return msgs;
      }
    )
  },
  Mutation: {
    createMessage: requiresAuth.createResolver(
      async (parent, args, { user }) => {
        try {
          //.column('*', { createdAt: 'created_at' })
          const [message] = await knex('messages')
            .insert({
              text: args.text,
              channel_id: args.channelId,
              user_id: user.id
            })
            .returning('*');
          // TODO hacky - find knex way to do this?
          message.createdAt = message.created_at;

          const asyncFunc = async () => {
            const currentUser = await knex('users')
              .where({ id: user.id })
              .first();

            pubsub.publish(NEW_CHANNEL_MESSAGE, {
              channelId: args.channelId,
              newChannelMessage: {
                ...message,
                user: currentUser
              }
            });
          };

          console.log('preasync');
          asyncFunc();
          console.log('POSTasync');

          return true;
        } catch (err) {
          console.log('CREATE MSG ERROR', err);
          return false;
        }
      }
    )
  }
};
