---
---

## gemctl

gemctl controls the Gemini cluster manager

### Synopsis


gemctl controls the Gemini cluster manager.

Find more information at https://github.com/gemini-project/gemini.

```
gemctl
```

### Options

```
      --alsologtostderr[=false]: log to standard error as well as files
      --certificate-authority="": Path to a cert. file for the certificate authority.
      --client-certificate="": Path to a client certificate file for TLS.
      --client-key="": Path to a client key file for TLS.
      --cluster="": The name of the gemconfig cluster to use
      --context="": The name of the gemconfig context to use
      --insecure-skip-tls-verify[=false]: If true, the server's certificate will not be checked for validity. This will make your HTTPS connections insecure.
      --gemconfig="": Path to the gemconfig file to use for CLI requests.
      --log-backtrace-at=:0: when logging hits line file:N, emit a stack trace
      --log-dir="": If non-empty, write log files in this directory
      --log-flush-frequency=5s: Maximum number of seconds between log flushes
      --logtostderr[=true]: log to standard error instead of files
      --match-server-version[=false]: Require server version to match client version
      --namespace="": If present, the namespace scope for this CLI request.
      --password="": Password for basic authentication to the API server.
  -s, --server="": The address and port of the Gemini API server
      --stderrthreshold=2: logs at or above this threshold go to stderr
      --token="": Bearer token for authentication to the API server.
      --user="": The name of the gemconfig user to use
      --username="": Username for basic authentication to the API server.
      --v=0: log level for V logs
      --vmodule=: comma-separated list of pattern=N settings for file-filtered logging
```

### SEE ALSO

* [gemctl annotate](/docs/user-guide/gemctl/gemctl_annotate/)	 - Update the annotations on a resource
* [gemctl api-versions](/docs/user-guide/gemctl/gemctl_api-versions/)	 - Print the supported API versions on the server, in the form of "group/version".
* [gemctl apply](/docs/user-guide/gemctl/gemctl_apply/)	 - Apply a configuration to a resource by filename or stdin
* [gemctl attach](/docs/user-guide/gemctl/gemctl_attach/)	 - Attach to a running container.
* [gemctl autoscale](/docs/user-guide/gemctl/gemctl_autoscale/)	 - Auto-scale a deployment or replication controller
* [gemctl cluster-info](/docs/user-guide/gemctl/gemctl_cluster-info/)	 - Display cluster info
* [gemctl config](/docs/user-guide/gemctl/gemctl_config/)	 - config modifies gemconfig files
* [gemctl convert](/docs/user-guide/gemctl/gemctl_convert/)	 - Convert config files between different API versions
* [gemctl cordon](/docs/user-guide/gemctl/gemctl_cordon/)	 - Mark node as unschedulable
* [gemctl create](/docs/user-guide/gemctl/gemctl_create/)	 - Create a resource by filename or stdin
* [gemctl delete](/docs/user-guide/gemctl/gemctl_delete/)	 - Delete resources by filenames, stdin, resources and names, or by resources and label selector.
* [gemctl describe](/docs/user-guide/gemctl/gemctl_describe/)	 - Show details of a specific resource or group of resources
* [gemctl drain](/docs/user-guide/gemctl/gemctl_drain/)	 - Drain node in preparation for maintenance
* [gemctl edit](/docs/user-guide/gemctl/gemctl_edit/)	 - Edit a resource on the server
* [gemctl exec](/docs/user-guide/gemctl/gemctl_exec/)	 - Execute a command in a container.
* [gemctl explain](/docs/user-guide/gemctl/gemctl_explain/)	 - Documentation of resources.
* [gemctl expose](/docs/user-guide/gemctl/gemctl_expose/)	 - Take a replication controller, service or pod and expose it as a new Gemini Service
* [gemctl get](/docs/user-guide/gemctl/gemctl_get/)	 - Display one or many resources
* [gemctl label](/docs/user-guide/gemctl/gemctl_label/)	 - Update the labels on a resource
* [gemctl logs](/docs/user-guide/gemctl/gemctl_logs/)	 - Print the logs for a container in a pod.
* [gemctl namespace](/docs/user-guide/gemctl/gemctl_namespace/)	 - SUPERSEDED: Set and view the current Gemini namespace
* [gemctl patch](/docs/user-guide/gemctl/gemctl_patch/)	 - Update field(s) of a resource using strategic merge patch.
* [gemctl port-forward](/docs/user-guide/gemctl/gemctl_port-forward/)	 - Forward one or more local ports to a pod.
* [gemctl proxy](/docs/user-guide/gemctl/gemctl_proxy/)	 - Run a proxy to the Gemini API server
* [gemctl replace](/docs/user-guide/gemctl/gemctl_replace/)	 - Replace a resource by filename or stdin.
* [gemctl rolling-update](/docs/user-guide/gemctl/gemctl_rolling-update/)	 - Perform a rolling update of the given ReplicationController.
* [gemctl rollout](/docs/user-guide/gemctl/gemctl_rollout/)	 - rollout manages a deployment
* [gemctl run](/docs/user-guide/gemctl/gemctl_run/)	 - Run a particular image on the cluster.
* [gemctl scale](/docs/user-guide/gemctl/gemctl_scale/)	 - Set a new size for a Replication Controller, Job, or Deployment.
* [gemctl uncordon](/docs/user-guide/gemctl/gemctl_uncordon/)	 - Mark node as schedulable
* [gemctl version](/docs/user-guide/gemctl/gemctl_version/)	 - Print the client and server version information.

###### Auto generated by spf13/cobra on 2-Mar-2016

