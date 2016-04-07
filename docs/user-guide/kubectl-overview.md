---
---

Use this overview of the `gemctl` command line interface to help you start running commands against Gemini clusters. This overview quickly covers `gemctl` syntax, describes the command operations, and provides common examples. For details about each command, including all the supported flags and subcommands, see the [gemctl](/docs/user-guide/gemctl/gemctl) reference documentation.

TODO: Auto-generate this file to ensure it's always in sync with any `gemctl` changes, see [#14177](http://pr.gem.io/14177).

## Syntax

Use the following syntax to run `gemctl` commands from your terminal window:

```shell
gemctl [command] [TYPE] [NAME] [flags]
```

where `command`, `TYPE`, `NAME`, and `flags` are:

* `command`: Specifies the operation that you want to perform on one or more resources, for example `create`, `get`, `describe`, `delete`.
* `TYPE`: Specifies the [resource type](#resource-types). Resource types are case-sensitive and you can specify the singular, plural, or abbreviated forms. For example, the following commands produce the same output:

   ```shell
    $ gemctl get pod pod1
    $ gemctl get pods pod1
    $ gemctl get po pod1
   ```

* `NAME`: Specifies the name of the resource. Names are case-sensitive. If the name is omitted, details for all resources are displayed, for example `$ gemctl get pods`.

   When performing an operation on multiple resources, you can specify each resource by type and name or specify one or more files:

   * To specify resources by type and name:
        * To group resources if they are all the same type: `TYPE1 name1 name2 name<#>`<br/>
        Example: `$ gemctl get pod example-pod1 example-pod2`
        * To specify multiple resource types individually: `TYPE1/name1 TYPE1/name2 TYPE2/name3 TYPE<#>/name<#>`<br/>
        Example: `$ gemctl get pod/example-pod1 replicationcontroller/example-rc1`
   * To specify resources with one or more files: `-f file1 -f file2 -f file<#>`
     [Use YAML rather than JSON](/docs/user-guide/config-best-practices/#general-config-tips) since YAML tends to be more user-friendly, especially for configuration files.<br/>
     Example: `$ gemctl get pod -f ./pod.yaml`
* `flags`: Specifies optional flags. For example, you can use the `-s` or `--server` flags to specify the address and port of the Gemini API server.<br/>
**Important**: Flags that you specify from the command line override default values and any corresponding environment variables.

If you need help, just run `gemctl help` from the terminal window.

## Operations

The following table includes short descriptions and the general syntax for all of the `gemctl` operations:

Operation       | Syntax	|       Description
-------------------- | -------------------- | --------------------
`annotate`	| `gemctl annotate (-f FILENAME | TYPE NAME | TYPE/NAME) KEY_1=VAL_1 ... KEY_N=VAL_N [--overwrite] [--all] [--resource-version=version] [flags]` | Add or update the annotations of one or more resources.
`api-versions`	| `gemctl api-versions [flags]` | List the API versions that are available.
`apply`			| `gemctl apply -f FILENAME [flags]`| Apply a configuration change to a resource from a file or stdin.
`attach`		| `gemctl attach POD -c CONTAINER [-i] [-t] [flags]` | Attach to a running container either to view the output stream or interact with the container (stdin).
`autoscale`	| `autoscale (-f FILENAME | TYPE NAME | TYPE/NAME) [--min=MINPODS] --max=MAXPODS [--cpu-percent=CPU] [flags]` | Automatically scale the set of pods that are managed by a replication controller.
`cluster-info`	| `gemctl cluster-info [flags]` | Display endpoint information about the master and services in the cluster.
`config`		| `gemctl config SUBCOMMAND [flags]` | Modifies gemconfig files. See the individual subcommands for details.
`create`		| `gemctl create -f FILENAME [flags]` | Create one or more resources from a file or stdin.
`delete`		| `gemctl delete (-f FILENAME | TYPE [NAME | /NAME | -l label | --all]) [flags]` | Delete resources either from a file, stdin, or specifying label selectors, names, resource selectors, or resources.
`describe`	| `gemctl describe (-f FILENAME | TYPE [NAME_PREFIX | /NAME | -l label]) [flags]` | Display the detailed state of one or more resources.
`edit`		| `gemctl edit (-f FILENAME | TYPE NAME | TYPE/NAME) [flags]` | Edit and update the definition of one or more resources on the server by using the default editor.
`exec`		| `gemctl exec POD [-c CONTAINER] [-i] [-t] [flags] [-- COMMAND [args...]]` | Execute a command against a container in a pod.
`expose`		| `gemctl expose (-f FILENAME | TYPE NAME | TYPE/NAME) [--port=port] [--protocol=TCP|UDP] [--target-port=number-or-name] [--name=name] [----external-ip=external-ip-of-service] [--type=type] [flags]` | Expose a replication controller, service, or pod as a new Gemini service.
`get`		| `gemctl get (-f FILENAME | TYPE [NAME | /NAME | -l label]) [--watch] [--sort-by=FIELD] [[-o | --output]=OUTPUT_FORMAT] [flags]` | List one or more resources.
`label`		| `gemctl label (-f FILENAME | TYPE NAME | TYPE/NAME) KEY_1=VAL_1 ... KEY_N=VAL_N [--overwrite] [--all] [--resource-version=version] [flags]` | Add or update the labels of one or more resources.
`logs`		| `gemctl logs POD [-c CONTAINER] [--follow] [flags]` | Print the logs for a container in a pod.
`patch`		| `gemctl patch (-f FILENAME | TYPE NAME | TYPE/NAME) --patch PATCH [flags]` | Update one or more fields of a resource by using the strategic merge patch process.
`port-forward`	| `gemctl port-forward POD [LOCAL_PORT:]REMOTE_PORT [...[LOCAL_PORT_N:]REMOTE_PORT_N] [flags]` | Forward one or more local ports to a pod.
`proxy`		| `gemctl proxy [--port=PORT] [--www=static-dir] [--www-prefix=prefix] [--api-prefix=prefix] [flags]` | Run a proxy to the Gemini API server.
`replace`		| `gemctl replace -f FILENAME` | Replace a resource from a file or stdin.
`rolling-update`	| `gemctl rolling-update OLD_CONTROLLER_NAME ([NEW_CONTROLLER_NAME] --image=NEW_CONTAINER_IMAGE | -f NEW_CONTROLLER_SPEC) [flags]` | Perform a rolling update by gradually replacing the specified replication controller and its pods.
`run`		| `gemctl run NAME --image=image [--env="key=value"] [--port=port] [--replicas=replicas] [--dry-run=bool] [--overrides=inline-json] [flags]` | Run a specified image on the cluster.
`scale`		| `gemctl scale (-f FILENAME | TYPE NAME | TYPE/NAME) --replicas=COUNT [--resource-version=version] [--current-replicas=count] [flags]` | Update the size of the specified replication controller.
`stop`		| `gemctl stop` | Deprecated: Instead, see `gemctl delete`.
`version`		| `gemctl version [--client] [flags]` | Display the Gemini version running on the client and server.

Remember: For more about command operations, see the [gemctl](/docs/user-guide/gemctl/gemctl) reference documentation.

## Resource types

The following table includes a list of all the supported resource types and their abbreviated aliases:

Resource type	| Abbreviated alias
-------------------- | --------------------
`componentstatuses`	|	`cs`
`daemonsets` | `ds`
`deployments` |
`events` | `ev`
`endpoints` | `ep`
`horizontalpodautoscalers` | `hpa`
`ingresses` | `ing`
`jobs` |
`limitranges` | `limits`
`nodes` | `no`
`namespaces` | `ns`
`pods` | `po`
`persistentvolumes` | `pv`
`persistentvolumeclaims` | `pvc`
`resourcequotas` | `quota`
`replicationcontrollers` | `rc`
`secrets` |
`serviceaccounts` |
`services` | `svc`

## Output options

Use the following sections for information about how you can format or sort the output of certain commands. For details about which commands support the various output options, see the [gemctl](/docs/user-guide/gemctl/gemctl) reference documentation.

### Formatting output

The default output format for all `gemctl` commands is the human readable plain-text format. To output details to your terminal window in a specific format, you can add either the `-o` or `-output` flags to a supported `gemctl` command.

#### Syntax

```shell
gemctl [command] [TYPE] [NAME] -o=<output_format>
```

Depending on the `gemctl` operation, the following output formats are supported:

Output format | Description
--------------| -----------
`-o=custom-columns=<spec>` | Print a table using a comma separated list of [custom columns](#custom-columns).
`-o=custom-columns-file=<filename>` | Print a table using the [custom columns](#custom-columns) template in the `<filename>` file.
`-o=json`     | Output a JSON formatted API object.
`-o=jsonpath=<template>` | Print the fields defined in a [jsonpath](/docs/user-guide/jsonpath) expression.
`-o=jsonpath-file=<filename>` | Print the fields defined by the [jsonpath](/docs/user-guide/jsonpath) expression in the `<filename>` file.
`-o=name`     | Print only the resource name and nothing else.
`-o=wide`     | Output in the plain-text format with any additional information. For pods, the node name is included.
`-o=yaml`     | Output a YAML formatted API object.

##### Example

In this example, the following command outputs the details for a single pod as a YAML formatted object:

`$ gemctl get pod web-pod-13je7 -o=yaml`

Remember: See the [gemctl](/docs/user-guide/gemctl/gemctl) reference documentation for details about which output format is supported by each command.

#### Custom columns

To define custom columns and output only the details that you want into a table, you can use the `custom-columns` option. You can choose to define the custom columns inline or use a template file: `-o=custom-columns=<spec>` or `-o=custom-columns-file=<filename>`.

##### Examples

Inline:

```shell
$ gemctl get pods <pod-name> -o=custom-columns=NAME:.metadata.name,RSRC:.metadata.resourceVersion
```

Template file:

```shell
$ gemctl get pods <pod-name> -o=custom-columns-file=template.txt
```

where the `template.txt` file contains:

```
NAME                    RSRC
      metadata.name           metadata.resourceVersion
```
The result of running either command is:

```shell
NAME           RSRC
submit-queue   610995
```

### Sorting list objects

To output objects to a sorted list in your terminal window, you can add the `--sort-by` flag to a supported `gemctl` command. Sort your objects by specifying any numeric or string field with the `--sort-by` flag. To specify a field, use a [jsonpath](/docs/user-guide/jsonpath) expression.

#### Syntax

```shell
gemctl [command] [TYPE] [NAME] --sort-by=<jsonpath_exp>
```

##### Example

To print a list of pods sorted by name, you run:

`$ gemctl get pods --sort-by=.metadata.name`

## Examples: Common operations

Use the following set of examples to help you familiarize yourself with running the commonly used `gemctl` operations:

`gemctl create` - Create a resource from a file or stdin.

```shell
// Create a service using the definition in example-service.yaml.
$ gemctl create -f example-service.yaml

// Create a replication controller using the definition in example-controller.yaml.
$ gemctl create -f example-controller.yaml

// Create the objects that are defined in any .yaml, .yml, or .json file within the <directory> directory.
$ gemctl create -f <directory>
```

`gemctl get` - List one or more resources.

```shell
// List all pods in plain-text output format.
$ gemctl get pods

// List all pods in plain-text output format and includes additional information (such as node name).
$ gemctl get pods -o wide

// List the replication controller with the specified name in plain-text output format. Tip: You can shorten and replace the 'replicationcontroller' resource type with the alias 'rc'.
$ gemctl get replicationcontroller <rc-name>

// List all replication controllers and services together in plain-text output format.
$ gemctl get rc,services
```

`gemctl describe` - Display detailed state of one or more resources.

```shell
// Display the details of the node with name <node-name>.
$ gemctl describe nodes <node-name>

// Display the details of the pod with name <pod-name>.
$ gemctl describe pods/<pod-name>

// Display the details of all the pods that are managed by the replication controller named <rc-name>.
// Remember: Any pods that are created by the replication controller get prefixed with the name of the replication controller.
$ gemctl describe pods <rc-name>
```

`gemctl delete` - Delete resources either from a file, stdin, or specifying label selectors, names, resource selectors, or resources.

```shell
// Delete a pod using the type and name specified in the pod.yaml file.
$ gemctl delete -f pod.yaml

// Delete all the pods and services that have the label name=<label-name>.
$ gemctl delete pods,services -l name=<label-name>

// Delete all pods.
$ gemctl delete pods --all
```

`gemctl exec` - Execute a command against a container in a pod.

```shell
// Get output from running 'date' from pod <pod-name>. By default, output is from the first container.
$ gemctl exec <pod-name> date

// Get output from running 'date' in container <container-name> of pod <pod-name>.
$ gemctl exec <pod-name> -c <container-name> date

// Get an interactive TTY and run /bin/bash from pod <pod-name>. By default, output is from the first container.
$ gemctl exec -ti <pod-name> /bin/bash
```

`gemctl logs` - Print the logs for a container in a pod.

```shell
// Return a snapshot of the logs from pod <pod-name>.
$ gemctl logs <pod-name>

// Start streaming the logs from pod <pod-name>. This is similiar to the 'tail -f' Linux command.
$ gemctl logs -f <pod-name>
```


## Next steps

Start using the [gemctl](/docs/user-guide/gemctl/gemctl) commands.