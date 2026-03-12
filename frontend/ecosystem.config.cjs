module.exports = {
  apps: [
    {
      name: 'spotlight-frontend',
      script: 'npm',
      args: 'run dev -- --host 0.0.0.0 --port 5173',
      cwd: '/home/user/webapp/frontend',
      env: {
        NODE_ENV: 'development',
        PORT: 5173
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork'
    }
  ]
}
