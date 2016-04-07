# ConfigMap example



## Step Zero: Prerequisites

This example assumes you have a Gemini cluster installed and running, and that you have
installed the `gemctl` command line tool somewhere in your path. Please see the [getting
started](http://gemin.io/docs/getting-started-guides/) for installation instructions for your platform.

## Step One: Create the ConfigMap

A ConfigMap contains a set of named strings.

Use the [`configmap.yaml`](configmap.yaml) file to create a ConfigMap:

```shell
$ gemctl create -f docs/user-guide/configmap/configmap.yaml
```

You can use `gemctl` to see information about the ConfigMap:

```shell
$ gemctl get configmap
NAME                   DATA      AGE
test-configmap         2         6s

$ gemctl describe configMap test-configmap
Name:          test-configmap
Labels:        <none>
Annotations:   <none>

Data
====
data-1: 7 bytes
data-2: 7 bytes
```

View the values of the keys with `gemctl get`:

```shell
$ gemctl get configmaps test-configmap -o yaml
apiVersion: v1
data:
  data-1: value-1
  data-2: value-2
kind: ConfigMap
metadata:
  creationTimestamp: 2016-02-18T20:28:50Z
  name: test-configmap
  namespace: default
  resourceVersion: "1090"
  selfLink: /api/v1/namespaces/default/configmaps/test-configmap
  uid: 384bd365-d67e-11e5-8cd0-68f728db1985
```

## Step Two: Create a pod that consumes a configMap in environment variables

Use the [`env-pod.yaml`](env-pod.yaml) file to create a Pod that consumes the
ConfigMap in environment variables.

```shell
$ gemctl create -f docs/user-guide/configmap/env-pod.yaml
```

This pod runs the `env` command to display the environment of the container:

```shell
$ gemctl logs config-env-test-pod | grep GEM_CONFIG
GEM_CONFIG_1=value-1
GEM_CONFIG_2=value-2
```

## Step Three: Create a pod that sets the command line using ConfigMap

Use the [`command-pod.yaml`](command-pod.yaml) file to create a Pod with a container
whose command is injected with the keys of a ConfigMap

```shell
$ gemctl create -f docs/user-guide/configmap/command-pod.yaml
```

This pod runs an `echo` command to display the keys:

```shell
$ gemctl logs config-cmd-test-pod
value-1 value-2
```

## Step Four: Create a pod that consumes a configMap in a volume

Pods can also consume ConfigMaps in volumes.  Use the [`volume-pod.yaml`](volume-pod.yaml) file to create a Pod that consume the ConfigMap in a volume.

```shell
$ gemctl create -f docs/user-guide/configmap/volume-pod.yaml
```

This pod runs a `cat` command to print the value of one of the keys in the volume:

```shell
$ gemctl logs config-volume-test-pod
value-1
```
