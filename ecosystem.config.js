// PM2 Ecosystem Configuration
// Usage:
//   pm2 start ecosystem.config.js --only api-inovex-prod
//   pm2 start ecosystem.config.js --only api-inovex-preprod
//
// Installation service Windows:
//   npm install -g pm2 pm2-windows-service
//   pm2-service-install
//   pm2 start ecosystem.config.js
//   pm2 save

export const apps = [
    {
        name: 'api-inovex-prod',
        script: 'dist/main.js',
        // eslint-disable-next-line no-undef
        cwd: __dirname,
        instances: 1,
        exec_mode: 'fork',
        env: {
            NODE_ENV: 'prod',
        },
        env_file: '.env.prod',
        node_args: '--max-old-space-size=512',
        max_memory_restart: '512M',
        watch: false,
        autorestart: true,
        max_restarts: 10,
        restart_delay: 5000,
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        error_file: './logs/pm2-prod-error.log',
        out_file: './logs/pm2-prod-out.log',
        merge_logs: true,
    },
    {
        name: 'api-inovex-preprod',
        script: 'dist/main.js',
        // eslint-disable-next-line no-undef
        cwd: __dirname,
        instances: 1,
        exec_mode: 'fork',
        env: {
            NODE_ENV: 'preprod',
        },
        env_file: '.env.preprod',
        node_args: '--max-old-space-size=512',
        max_memory_restart: '512M',
        watch: false,
        autorestart: true,
        max_restarts: 10,
        restart_delay: 5000,
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        error_file: './logs/pm2-preprod-error.log',
        out_file: './logs/pm2-preprod-out.log',
        merge_logs: true,
    },
];
