// @ts-nocheck

import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { FastifyAdapter } from '@bull-board/fastify';
import fastify, { FastifyInstance, FastifyRequest } from 'fastify';
import basicAuth from 'fastify-basic-auth';
import { Server, IncomingMessage, ServerResponse } from 'http';
import { env } from './env';

import { createQueue, setupQueueProcessor } from './queue';

interface AddJobQueryString {
  name: string;
  email: string;
  accessToken: string;
  repoName: string;
  text: string;
}

const run = async () => {
  const welcomeEmailQueue = createQueue('WelcomeEmailQueue');
  await setupQueueProcessor(welcomeEmailQueue.name);

  const server: FastifyInstance<Server, IncomingMessage, ServerResponse> =
    fastify();

  const serverAdapter = new FastifyAdapter();
  createBullBoard({
    queues: [new BullMQAdapter(welcomeEmailQueue)],
    serverAdapter,
  });
  // if (env.NODE_ENV !== 'development') {
  //   console.log('Bull Board UI is disabled in production.');
  // } else {
  //   serverAdapter.setBasePath('/');
  //   server.register(serverAdapter.registerPlugin(), {
  //     prefix: '/',
  //     basePath: '/',
  //   });
  // }
  // serverAdapter.setBasePath('/');
  // server.register(serverAdapter.registerPlugin(), {
  //   prefix: '/',
  //   basePath: '/',
  // });

  // name, email, accessToken, repoName, text, startDate
  // @ts-ignore
  server.get(
    '/v9XUXr4MogPjNPWyDEM5hbypUX8ReABMqjc0so',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string' },
            accessToken: { type: 'string' },
            repoName: { type: 'string' },
            text: { type: 'string' },
          },
        },
      },
    },
    (req: FastifyRequest<{ Querystring: AddJobQueryString }>, reply) => {
      if (
        req.query == null ||
        req.query.email == null ||
        req.query.name == null ||
        req.query.accessToken == null ||
        req.query.repoName == null||
        req.query.text == null
      ) {
        reply
          .status(400)
          .send({ error: 'Requests must contain both an id and a email' });

        return;
      }

      const { email, name, accessToken, repoName, text } = req.query;
      welcomeEmailQueue.add(`WelcomeEmail-${email}`, {
        email,
        name,
        accessToken,
        repoName,
        text
      });

      reply.send({
        ok: true,
      });
    }
  );

  await server.listen({ port: env.PORT, host: '0.0.0.0' });
  console.log(
    `To populate the queue and demo the UI, run: curl https:///add-job?id=1&email=hello%40world.com`
  );
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
