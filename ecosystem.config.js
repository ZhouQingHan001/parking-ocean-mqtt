module.exports = {
  apps: [
    {
      name: 'parking ocean mqtt',
      script: './app.js',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
