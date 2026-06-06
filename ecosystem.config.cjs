// PM2 process configuration used by `pm2-runtime` inside the production container.
module.exports = {
  apps: [
    {
      name: 'event-inviter',
      script: 'bin/server.js',

      // Number of instances to run. Set PM2_INSTANCES=max to use all CPU cores.
      instances: process.env.PM2_INSTANCES || 1,
      exec_mode: 'cluster',

      // The app reads configuration from the process environment.
      env: {
        NODE_ENV: 'production',
      },

      // Restart behaviour.
      autorestart: true,
      max_restarts: 10,
      max_memory_restart: '512M',
    },
  ],
}
