module.exports = {
  apps: [
    {
      name: `frontend`,
      script: "serve",
      env: {
        PM2_SERVE_PATH: "./dist",
        PM2_SERVE_PORT: 3210,
        PM2_SERVE_SPA: "true",
        NODE_ENV: "production",
      },
    },
  ],
};
