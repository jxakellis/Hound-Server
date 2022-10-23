module.exports = {
  apps: [
    {
      name: 'Hound PM2',
      script: `sudo npm run houndServer`,
      out_file: `${__dirname}/logs/out.log`,
      error_file: `${__dirname}/logs/error.log`,
      // Process is only considered running if it stays alive for more than min_uptime
      // 15000 ms
      min_uptime: 15000,
      restart_delay: 1000,
    },
  ],
};
