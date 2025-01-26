// @ts-nocheck

import { ConnectionOptions, Queue, QueueScheduler, Worker } from 'bullmq';

import { env } from './env';

const connection: ConnectionOptions = {
  family: 0,
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
        const response = await fetch('https://git-name.onrender.com/generate-repo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, accessToken, email, repoName }),
        });
        if(!response.ok) {
          const errorBody = await response.text();
          console.log(errorBody)
          switch (response.status) {
            case 400:
              throw new Error(`Bad request: ${errorBody}`);
            case 401:
              throw new Error(`Unauthorized: ${errorBody}`);
            case 500:
              throw new Error(`Server error: ${errorBody}`);
            default:
              throw new Error(`Failed to create repo for ${email}: ${errorBody}`);
          }
          // throw new Error(`Failed to create repo for ${email}`);
        }
        return { jobId: `Job (${job.id}) completed successfully` };
      } catch (error) {
        console.log(error);
      }

      return { jobId: `This is the return value of job (${job.id})` };
    },
    { connection }
  );
};
