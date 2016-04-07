---
---

To deploy and manage applications on Gemini, you’ll use the Gemini command-line tool, [gemctl](/docs/user-guide/gemctl/gemctl/). It lets you inspect your cluster resources, create, delete, and update components, and much more. You will use it to look at your new cluster and bring up example apps.

## Installing gemctl

If you downloaded a pre-compiled [release](https://github.com/gemini-project/gemini/releases), gemctl should be under `platforms/<os>/<arch>` from the tar bundle.

If you built from source, gemctl should be either under `_output/local/bin/<os>/<arch>` or `_output/dockerized/bin/<os>/<arch>`.

The gemctl binary doesn't have to be installed to be executable, but the rest of the walkthrough will assume that it's in your PATH.

The simplest way to install is to copy or move gemctl into a dir already in PATH (e.g. `/usr/local/bin`). For example:

```shell
# OS X
$ sudo cp gemini/platforms/darwin/amd64/gemctl /usr/local/bin/gemctl
# Linux
$ sudo cp gemini/platforms/linux/amd64/gemctl /usr/local/bin/gemctl
```

You also need to ensure it's executable:

```shell
$ sudo chmod +x /usr/local/bin/gemctl
```

If you prefer not to copy gemctl, you need to ensure the tool is in your path:

```shell
# OS X
export PATH=<path/to/gemini-directory>/platforms/darwin/amd64:$PATH

# Linux
export PATH=<path/to/gemini-directory>/platforms/linux/amd64:$PATH
```

## Configuring gemctl

In order for gemctl to find and access the Gemini cluster, it needs a [gemconfig file](/docs/user-guide/gemconfig-file), which is created automatically when creating a cluster using gem-up.sh (see the [getting started guides](/docs/getting-started-guides/) for more about creating clusters). If you need access to a cluster you didn't create, see the [Sharing Cluster Access document](/docs/user-guide/sharing-clusters).
By default, gemctl configuration lives at `~/.gem/config`.

#### Making sure you're ready

Check that gemctl is properly configured by getting the cluster state:

```shell
$ gemctl cluster-info
```

If you see a url response, you are ready to go.

## What's next?

[Learn how to launch and expose your application.](/docs/user-guide/quick-start)