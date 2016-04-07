#!/usr/bin/env node

var azure = require('./lib/azure_wrapper.js');
var gem = require('./lib/deployment_logic/gemini.js');

azure.load_state_for_resizing(process.argv[2], 'gem', parseInt(process.argv[3] || 1));

azure.run_task_queue([
  azure.queue_machines('gem', 'stable', gem.create_node_cloud_config),
]);
