---
---

Following this example, you will create a pod with a downward API volume.
A downward API volume is a gem volume plugin with the ability to save some pod information in a plain text file. The pod information can be  for example some [metadata](https://github.com/gemini-project/gemini/tree/{{page.githubbranch}}/docs/devel/api-conventions.md#metadata).

Supported metadata fields:

1. `metadata.annotations`
2. `metadata.namespace`
3. `metadata.name`
4. `metadata.labels`

### Step Zero: Prerequisites

This example assumes you have a Gemini cluster installed and running, and the `gemctl` command line tool somewhere in your path. Please see the [gettingstarted](/docs/getting-started-guides/) for installation instructions for your platform.

### Step One: Create the pod

Use the `docs/user-guide/downward-api/dapi-volume.yaml` file to create a Pod with a  downward API volume which stores pod labels and pod annotations to `/etc/labels` and  `/etc/annotations` respectively.

```shell
$ gemctl create -f  docs/user-guide/downward-api/volume/dapi-volume.yaml
```

### Step Two: Examine pod/container output

The pod displays (every 5 seconds) the content of the dump files which can be executed via the usual `gemctl log` command

```shell
$ gemctl logs gemini-downwardapi-volume-example
cluster="test-cluster1"
rack="rack-22"
zone="us-est-coast"
build="two"
builder="john-doe"
gemin.io/config.seen="2015-08-24T13:47:23.432459138Z"
gemin.io/config.source="api"
```

### Internals

In pod's `/etc` directory one may find the file created by the plugin (system files elided):

```shell
$ gemctl exec gemini-downwardapi-volume-example -i -t -- sh
/ # ls -laR /etc
/etc:
total 32
drwxrwxrwt    3 0        0              180 Aug 24 13:03 .
drwxr-xr-x    1 0        0             4096 Aug 24 13:05 ..
drwx------    2 0        0               80 Aug 24 13:03 ..2015_08_24_13_03_44259413923
lrwxrwxrwx    1 0        0               30 Aug 24 13:03 ..downwardapi -> ..2015_08_24_13_03_44259413923
lrwxrwxrwx    1 0        0               25 Aug 24 13:03 annotations -> ..downwardapi/annotations
lrwxrwxrwx    1 0        0               20 Aug 24 13:03 labels -> ..downwardapi/labels

/etc/..2015_08_24_13_03_44259413923:
total 8
drwx------    2 0        0               80 Aug 24 13:03 .
drwxrwxrwt    3 0        0              180 Aug 24 13:03 ..
-rw-r--r--    1 0        0              115 Aug 24 13:03 annotations
-rw-r--r--    1 0        0               53 Aug 24 13:03 labels
/ #
```

The file `labels` is stored in a temporary directory (`..2015_08_24_13_03_44259413923` in the example above) which is symlinked to by `..downwardapi`. Symlinks for annotations and labels in `/etc` point to files containing the actual metadata through the `..downwardapi` indirection.  This structure allows for dynamic atomic refresh of the metadata: updates are written to a new temporary directory, and the `..downwardapi` symlink is updated atomically using `rename(2)`.