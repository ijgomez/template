#!/usr/bin/env bash

set -euo pipefail

mkdir -p /var/lib/postgresql/tablespaces/template_data
mkdir -p /var/lib/postgresql/tablespaces/template_index
mkdir -p /var/lib/postgresql/tablespaces/openproject_data
mkdir -p /var/lib/postgresql/tablespaces/openproject_index

chmod 700 /var/lib/postgresql/tablespaces/template_data
chmod 700 /var/lib/postgresql/tablespaces/template_index
chmod 700 /var/lib/postgresql/tablespaces/openproject_data
chmod 700 /var/lib/postgresql/tablespaces/openproject_index
