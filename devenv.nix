{ pkgs, lib, config, inputs, ... }:

{
  packages = [ pkgs.git pkgs.nodejs_24 ];
  languages.typescript.enable = true;

  services.minio = {
    enable = true;
    buckets = [ "uploads" ];
  };

  process.manager.implementation = "process-compose";
  processes = {
    file-uploader.exec = "cd file-uploader && npm install && npm run start:dev";
    client-api.exec = "cd client-api && npm install && npm run start:dev";
    frontend-ui.exec = "cd frontend-ui && npm install && npm run dev";
  };
}
