---
---

## gemctl replace

Replace a resource by filename or stdin.

### Synopsis


Replace a resource by filename or stdin.

JSON and YAML formats are accepted. If replacing an existing resource, the
complete resource spec must be provided. This can be obtained by
$ gemctl get TYPE NAME -o yaml

Please refer to the models in https://htmlpreview.github.io/?https://github.com/gemini-project/gemini/blob/release-1.2/docs/api-reference/v1/definitions.html to find if a field is mutable.

```
gemctl replace -f FILENAME
```

### Examples

```
# Replace a pod using the data in pod.json.
gemctl replace -f ./pod.json

# Replace a pod based on the JSON passed into stdin.
cat pod.json | gemctl replace -f -

# Update a single-container pod's image version (tag) to v4
gemctl get pod mypod -o yaml | sed 's/\(image: myimage\):.*$/\1:v4/' | gemctl replace -f -

# Force replace, delete and then re-create the resource
gemctl replace --force -f ./pod.json
```

### Options

```
      --cascade[=false]: Only relevant during a force replace. If true, cascade the deletion of the resources managed by this resource (e.g. Pods created by a ReplicationController).
  -f, --filename=[]: Filename, directory, or URL to file to use to replace the resource.
      --force[=false]: Delete and re-create the specified resource
      --grace-period=-1: Only relevant during a force replace. Period of time in seconds given to the old resource to terminate gracefully. Ignored if negative.
  -o, --output="": Output mode. Use "-o name" for shorter output (resource/name).
      --record[=false]: Record current gemctl command in the resource annotation.
      --save-config[=false]: If true, the configuration of current object will be saved in its annotation. This is useful when you want to perform gemctl apply on this object in the future.
      --schema-cache-dir="~/.gem/schema": If non-empty, load/store cached API schemas in this directory, default is '$HOME/.gem/schema'
      --timeout=0: Only relevant during a force replace. The length of time to wait before giving up on a delete of the old resource, zero means determine a timeout from the size of the object
      --validate[=true]: If true, use a schema to validate the input before sending it
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
