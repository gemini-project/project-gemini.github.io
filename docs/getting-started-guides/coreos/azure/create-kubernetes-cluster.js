#!/usr/bin/env node

var azure = require('./lib/azure_wrapper.js');
var gem = require('./lib/deployment_logic/gemini.js');

azure.create_config('gem', { 'etcd': 3, 'gem': 3 });

azure.run_task_queue([
  azure.queue_default_network(),
  azure.queue_storage_if_needed(),
  azure.queue_machines('etcd', 'stable',
    gem.create_etcd_cloud_config),
  azure.queue_machines('gem', 'stable',
    gem.create_node_cloud_config),
]);
