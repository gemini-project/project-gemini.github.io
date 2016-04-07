---
---

## gemctl scale

Set a new size for a Replication Controller, Job, or Deployment.

### Synopsis


Set a new size for a Replication Controller, Job, or Deployment.

Scale also allows users to specify one or more preconditions for the scale action.
If --current-replicas or --resource-version is specified, it is validated before the
scale is attempted, and it is guaranteed that the precondition holds true when the
scale is sent to the server.

```
gemctl scale [--resource-version=version] [--current-replicas=count] --replicas=COUNT (-f FILENAME | TYPE NAME)
```

### Examples

```
# Scale replication controller named 'foo' to 3.
gemctl scale --replicas=3 rc/foo

# Scale a resource identified by type and name specified in "foo.yaml" to 3.
gemctl scale --replicas=3 -f foo.yaml

# If the deployment named mysql's current size is 2, scale mysql to 3.
gemctl scale --current-replicas=2 --replicas=3 deployment/mysql

# Scale multiple replication controllers.
gemctl scale --replicas=5 rc/foo rc/bar rc/baz

# Scale job named 'cron' to 3.
gemctl scale --replicas=3 job/cron
```

### Options

```
      --current-replicas=-1: Precondition for current size. Requires that the current size of the resource match this value in order to scale.
  -f, --filename=[]: Filename, directory, or URL to a file identifying the resource to set a new size
  -o, --output="": Output mode. Use "-o name" for shorter output (resource/name).
      --record[=false]: Record current gemctl command in the resource annotation.
      --replicas=-1: The new desired number of replicas. Required.
      --resource-version="": Precondition for resource version. Requires that the current resource version match this value in order to scale.
      --timeout=0: The length of time to wait before giving up on a scale operation, zero means don't wait.
```

### Options inherited from parent commands

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

* [gemctl](/docs/user-guide/gemctl/gemctl/)	 - gemctl controls the Gemini cluster manager

###### Auto generated by spf13/cobra on 2-Mar-2016
