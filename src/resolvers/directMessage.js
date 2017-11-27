import { withFilter } from 'graphql-subscriptions';
import knex from '../../config/db/knex';

import { requiresAuth, directMessageSubscription } from '../permissions';
import pubsub from '../../pubsub';

const NEW_DIRECT_MESSAGE = 'NEW_DIRECT_MESSAGE';

export default {
  Subscription: {
    newDirectMessage: {
      subscribe: directMessageSubscription.createResolver(
        withFilter(
          () => pubsub.asyncIterator(NEW_DIRECT_MESSAGE),
          (payload, args, { user }) =>
            payload.teamId === args.teamId &&
            ((payload.senderId === user.id &&
              payload.receiverId === args.userId) ||
              (payload.senderId === args.userId &&
                payload.receiverId === user.id))
        )
      )
    }
  },
  DirectMessage: {
    sender: ({ sender, senderId }, args) => {
      if (sender) {
        return sender;
      }

      return knex('users')
        .where({ id: senderId })
        .first();
    }
  },
  Query: {
    directMessages: requiresAuth.createResolver(
      async (parent, { teamId, otherUserId }, { user }) => {
        console.log('DIRECT MSGS', teamId);
        return knex('direct_messages')
          .where(
            knex.raw(
              'team_id = :teamId and ((receiver_id = :otherUserId and sender_id = :userId) or (sender_id = :otherUserId and receiver_id = :userId)',
              {
                teamId,
                otherUserId,
                userId
              }
            )
          )
          .orderBy('created_at', 'ASC');
      }
    )
  },
  Mutation: {
    createDirectMessage: requiresAuth.createResolver(
      async (parent, args, { user }) => {
        try {
          const [directMessage] = await knex('direct_messages')
            .insert({
              text: args.text,
              teamId: args.teamId,
              receiverId: args.otherUserId,
              senderId: user.id
            })
            .returning('*');
          // TODO hacky - find knex way to do this?
          directMessage.createdAt = directMessage.created_at;

          pubsub.publish(NEW_DIRECT_MESSAGE, {
            teamId: args.teamId,
            senderId: user.id,
            receiverId: args.receiverId,
            newDirectMessage: {
              ...directMessage,
              sender: {
                username: user.username
              }
            }
          });

          return true;
        } catch (err) {
          console.log(err);
          return false;
        }
      }
    )
  }
};
