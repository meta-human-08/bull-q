// @ts-nocheck

import { ConnectionOptions, Queue, QueueScheduler, Worker } from 'bullmq';

import { env } from './env';

const connection: ConnectionOptions = {
  host: env.REDISHOST,
  port: env.REDISPORT,
  username: env.REDISUSER,
  password: env.REDISPASSWORD,
};

export const createQueue = (name: string) => new Queue(name, { connection });

export const setupQueueProcessor = async (queueName: string) => {
  const queueScheduler = new QueueScheduler(queueName, {
    connection,
  });
  await queueScheduler.waitUntilReady();

  new Worker(
    queueName,
    async (job) => {
      try {
        const { name, email, accessToken, repoName } = job.data;
        await fetch('https://git-name.onrender.com/generate-repo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, accessToken, email, repoName }),
        });
        return { jobId: `Job (${job.id}) completed successfully` };
      } catch (error) {
        console.log(error);
      }

      return { jobId: `This is the return value of job (${job.id})` };
    },
    { connection }
  );
};
