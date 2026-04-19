{ pkgs, lib, config, inputs, ... }:

{
  packages = [ pkgs.git pkgs.nodejs_24 pkgs.grafana ];
  languages.typescript.enable = true;
  languages.php.enable = true; # Do not judge me...

  services.minio = {
    enable = true;
    buckets = [ "uploads" ];
  };

  services.prometheus = {
    enable = true;
    scrapeConfigs = [
      {
        job_name = "internal-statistics";
        static_configs = [
          {
            targets = [ "127.0.0.1:8081" ];
          }
        ];
      }
    ];
  };

  services.redis = {
    enable = true;
  };

  services.rabbitmq = {
    enable = true;
    managementPlugin = {
      enable = true;
    };
  };

  process.manager.implementation = "process-compose";
  processes = {
    a-file-uploader.exec = "cd file-uploader && npm install && npm run start:dev";
    a-client-api.exec = "cd client-api && npm install && npm run start:dev";
    a-internal-statistics.exec = "cd internal-statistics && npm install && npm run start:dev";
    a-file-analyzer.exec = "cd file-analyzer && npm install && npm run start:dev";
    a-user-tracker.exec = "cd user-tracker && npm install && npm run start:dev";
    frontend-ui.exec = "cd frontend-ui && npm install && npm run dev";
    grafana.exec = "./start-grafana.sh";
  };
}
