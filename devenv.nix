{ pkgs, lib, config, inputs, ... }:

{
  packages = [ pkgs.git pkgs.nodejs_24 pkgs.grafana ];
  languages.typescript.enable = true;

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

  process.manager.implementation = "process-compose";
  processes = {
    ms_file-uploader.exec = "cd file-uploader && npm install && npm run start:dev";
    ms_client-api.exec = "cd client-api && npm install && npm run start:dev";
    ui_frontend-ui.exec = "cd frontend-ui && npm install && npm run dev";
    ms_internal-statistics.exec = "cd internal-statistics && npm install && npm run start:dev";
    ms_file-analyzer.exec = "cd file-analyzer && npm install && npm run start:dev";
    ze_grafana.exec = "./start-grafana.sh";
  };
}
