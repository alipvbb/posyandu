import { PrismaClient } from '@prisma/client';

let prismaClient;

const createClient = () =>
  new PrismaClient({
    log: ['warn', 'error'],
  });

const getClient = () => {
  if (!prismaClient) {
    prismaClient = createClient();
  }
  return prismaClient;
};

export const prisma = new Proxy(
  {},
  {
    get(_target, prop) {
      const client = getClient();
      const value = client[prop];
      return typeof value === 'function' ? value.bind(client) : value;
    },
  },
);
