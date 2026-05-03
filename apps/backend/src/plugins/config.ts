import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { config, type Config } from '../config.js';

declare module 'fastify' {
  interface FastifyInstance {
    config: Config;
  }
}

const configPlugin: FastifyPluginAsync = async (app) => {
  app.decorate('config', config);
};

export default fp(configPlugin, { name: 'config' });
