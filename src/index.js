import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import dotenv from 'dotenv/config';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import { makeExecutableSchema } from 'graphql-tools';
import { fileLoader, mergeTypes, mergeResolvers } from 'merge-graphql-schemas';
import { createServer } from 'http';
import { execute, subscribe } from 'graphql';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import knex from '../config/db/knex';

import { refreshTokens } from './auth';

const typeDefs = mergeTypes(fileLoader(path.join(__dirname, './schema')));
const resolvers = mergeResolvers(
  fileLoader(path.join(__dirname, './resolvers'))
);

const schema = makeExecutableSchema({
  typeDefs,
  resolvers
});

const PORT = process.env.PORT;
const graphqlEndpoint = '/graphql';
const app = express();
app.use(cors('*'));

app.use('/static', express.static(path.join(__dirname, 'static')));
app.use(bodyParser.json());

// console.log(process.env.SECRET, process.env.SECRET2);
const addUser = async (req, res, next) => {
  const token = req.headers['x-token'];
  if (token) {
    try {
      const { user } = jwt.verify(token, process.env.SECRET);
      req.user = user;
    } catch (err) {
      const refreshToken = req.headers['x-refresh-token'];
      const newTokens = await refreshTokens(
        token,
        refreshToken,
        process.env.SECRET,
        process.env.SECRET2
      );
      if (newTokens.token && newTokens.refreshToken) {
        res.set('Access-Control-Expose-Headers', 'x-token, x-refresh-token');
        res.set('x-token', newTokens.token);
        res.set('x-refresh-token', newTokens.refreshToken);
      }
      req.user = newTokens.user;
    }
  }
  next();
};

app.use(addUser);

app.use(
  graphqlEndpoint,
  bodyParser.json(),
  graphqlExpress(req => ({
    schema,
    context: {
      user: req.user,
      SECRET: process.env.SECRET,
      SECRET2: process.env.SECRET2
    }
  }))
);

app.use(
  '/graphiql',
  graphiqlExpress({
    endpointURL: graphqlEndpoint,
    subscriptionsEndpoint: `ws://localhost:${PORT}`
  })
);

const server = createServer(app);

server.listen(PORT, () => {
  // eslint-disable-next-line no-new
  new SubscriptionServer(
    {
      execute,
      subscribe,
      schema,
      onConnect: async ({ token, refreshToken }, webSocket) => {
        if (token && refreshToken) {
          try {
            const { user } = jwt.verify(token, process.env.SECRET);
            return { user };
          } catch (err) {
            const newTokens = await refreshTokens(
              token,
              refreshToken,
              process.env.SECRET,
              process.env.SECRET2
            );
            return { user: newTokens.user };
          }
        }

        return {};
      }
    },
    {
      server,
      path: '/subscriptions'
    }
  );

  console.log('listening on port ', PORT);
});
