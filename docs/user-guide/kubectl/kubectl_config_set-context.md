---
---

## gemctl config set-context

Sets a context entry in gemconfig

### Synopsis


Sets a context entry in gemconfig
Specifying a name that already exists will merge new fields on top of existing values for those fields.

```
gemctl config set-context NAME [--cluster=cluster_nickname] [--user=user_nickname] [--namespace=namespace]
```

### Examples

```
# Set the user field on the gce context entry without touching other values
gemctl config set-context gce --user=cluster-admin
```

### Options

```
      --cluster="": cluster for the context entry in gemconfig
      --namespace="": namespace for the context entry in gemconfig
      --user="": user for the context entry in gemconfig
```

### Options inherited from parent commands

```
      --alsologtostderr[=false]: log to standard error as well as files
      --certificate-authority="": Path to a cert. file for the certificate authority.
      --client-certificate="": Path to a client certificate file for TLS.
      --client-key="": Path to a client key file for TLS.
      --context="": The name of the gemconfig context to use
      --insecure-skip-tls-verify[=false]: If true, the server's certificate will not be checked for validity. This will make your HTTPS connections insecure.
      --gemconfig="": use a particular gemconfig file
      --log-backtrace-at=:0: when logging hits line file:N, emit a stack trace
      --log-dir="": If non-empty, write log files in this directory
      --log-flush-frequency=5s: Maximum number of seconds between log flushes
      --logtostderr[=true]: log to standard error instead of files
      --match-server-version[=false]: Require server version to match client version
      --password="": Password for basic authentication to the API server.
  -s, --server="": The address and port of the Gemini API server
      --stderrthreshold=2: logs at or above this threshold go to stderr
      --token="": Bearer token for authentication to the API server.
      --username="": Username for basic authentication to the API server.
      --v=0: log level for V logs
      --vmodule=: comma-separated list of pattern=N settings for file-filtered logging
```

### SEE ALSO

* [gemctl config](/docs/user-guide/gemctl/gemctl_config/)	 - config modifies gemconfig files

###### Auto generated by spf13/cobra on 2-Mar-2016