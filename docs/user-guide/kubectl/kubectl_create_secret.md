---
---

## gemctl create secret

Create a secret using specified subcommand.

### Synopsis


Create a secret using specified subcommand.

```
gemctl create secret
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

* [gemctl create](/docs/user-guide/gemctl/gemctl_create/)	 - Create a resource by filename or stdin
* [gemctl create secret docker-registry](/docs/user-guide/gemctl/gemctl_create_secret_docker-registry/)	 - Create a secret for use with a Docker registry.
* [gemctl create secret generic](/docs/user-guide/gemctl/gemctl_create_secret_generic/)	 - Create a secret from a local file, directory or literal value.

###### Auto generated by spf13/cobra on 2-Mar-2016