#!/bin/sh

cp -r $INTERNAL_GRAFANA_DEVENV_DIR/share/grafana/public/ grafana/public

grafana server --homepath ${DEVENV_ROOT}/grafana