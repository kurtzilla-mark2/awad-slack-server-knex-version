import knex from '../config/db/knex';

const createResolver = resolver => {
  const baseResolver = resolver;
  baseResolver.createResolver = childResolver => {
    const newResolver = async (parent, args, context, info) => {
      await resolver(parent, args, context, info);
      return childResolver(parent, args, context, info);
    };
    return createResolver(newResolver);
  };
  return baseResolver;
};

export const requiresAuth = createResolver((parent, args, { user }) => {
  if (!user || !user.id) {
    throw new Error('Authentication is required');
  }
});

export const requiresAdmin = requiresAuth.createResolver(
  (parent, args, context) => {
    if (!context.user.isAdmin) {
      throw new Error('Requires Admin access');
    }
  }
);

export const requiresTeamAccess = requiresAuth.createResolver(
  async (parent, { channelId }, { user }) => {
    const channel = await knex('channels')
      .where({ id: channelId })
      .first();

    // console.log('REQ TEAM ACCESS', channelId, channel.team_id, user.id);

    const member = await knex('members').where({
      team_id: channel.team_id,
      user_id: user.id
    });

    // console.log('REQ TEAM ACC', member);
    if (!member) {
      throw new Error(
        "You must be a member of the team to subscribe to it's messages"
      );
    }
  }
);

// TODO not sure why we(Ben) aren't stacking resolvers
export const directMessageSubscription = createResolver(
  async (parent, { teamId, userId }, { user }) => {
    if (!user || !user.id) {
      throw new Error('Authentication is required');
    }

    console.log('DIR MSG SUB', teamId, userId);
    const members = await knex('members')
      .where(
        knex.raw('team_id = :teamId or user_id = :userId', {
          teamId,
          userId
        })
      )
      .returning('id');

    if (!members.length === 2) {
      throw new Error('Something went wrong');
    }
  }
);

// an example of how we could keep going down this route of chaining resolvers
// export const bannedUsernameCheck = requiresAdmin.createResolver((parent, args, context) => {
//   if (indexOf(['bob', 'name', 'list'], context.user.username) > -1) {
//     throw new Error('That user is not allowed');
//   }
// });
