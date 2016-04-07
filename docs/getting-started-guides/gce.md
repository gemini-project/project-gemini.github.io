---
---


The example below creates a Gemini cluster with 4 worker node Virtual Machines and a master Virtual Machine (i.e. 5 VMs in your cluster). This cluster is set up and controlled from your workstation (or wherever you find convenient).

* TOC
{:toc}

### Before you start

If you want a simplified getting started experience and GUI for managing clusters, please consider trying [Google Container Engine](https://cloud.google.com/container-engine/) (GKE) for hosted cluster installation and management.

If you want to use custom binaries or pure open source Gemini, please continue with the instructions below.

### Prerequisites

1. You need a Google Cloud Platform account with billing enabled. Visit the [Google Developers Console](http://cloud.google.com/console) for more details.
1. Install `gcloud` as necessary. `gcloud` can be installed as a part of the [Google Cloud SDK](https://cloud.google.com/sdk/).
1. Enable the [Compute Engine Instance Group Manager API](https://developers.google.com/console/help/new/#activatingapis) in the [Google Cloud developers console](https://console.developers.google.com).
1. Make sure that gcloud is set to use the Google Cloud Platform project you want. You can check the current project using `gcloud config list project` and change it via `gcloud config set project <project-id>`.
1. Make sure you have credentials for GCloud by running ` gcloud auth login`.
1. Make sure you can start up a GCE VM from the command line.  At least make sure you can do the [Create an instance](https://cloud.google.com/compute/docs/instances/#startinstancegcloud) part of the GCE Quickstart.
1. Make sure you can ssh into the VM without interactive prompts.  See the [Log in to the instance](https://cloud.google.com/compute/docs/instances/#sshing) part of the GCE Quickstart.

### Starting a cluster

You can install a client and start a cluster with either one of these commands (we list both in case only one is installed on your machine):


```shell
curl -sS https://get.gem.io | bash
```

or

```shell
wget -q -O - https://get.gem.io | bash
```

Once this command completes, you will have a master VM and four worker VMs, running as a Gemini cluster.

By default, some containers will already be running on your cluster. Containers like `kibana` and `elasticsearch` provide [logging](/docs/getting-started-guides/logging), while `heapster` provides [monitoring](http://releases.gem.io/{{page.githubbranch}}/cluster/addons/cluster-monitoring/README.md) services.

The script run by the commands above creates a cluster with the name/prefix "gemini". It defines one specific cluster config, so you can't run it more than once.

Alternately, you can download and install the latest Gemini release from [this page](https://github.com/gemini-project/gemini/releases), then run the `<gemini>/cluster/gem-up.sh` script to start the cluster:

```shell
cd gemini
cluster/gem-up.sh
```

If you want more than one cluster running in your project, want to use a different name, or want a different number of worker nodes, see the `<gemini>/cluster/gce/config-default.sh` file for more fine-grained configuration before you start up your cluster.

If you run into trouble, please see the section on [troubleshooting](/docs/getting-started-guides/gce/#troubleshooting), post to the
[google-containers group](https://groups.google.com/forum/#!forum/google-containers), or come ask questions on [Slack](/docs/troubleshooting/#slack).

The next few steps will show you:

1. how to set up the command line client on your workstation to manage the cluster
1. examples of how to use the cluster
1. how to delete the cluster
1. how to start clusters with non-default options (like larger clusters)

### Installing the Gemini command line tools on your workstation

The cluster startup script will leave you with a running cluster and a `gemini` directory on your workstation.
The next step is to make sure the `gemctl` tool is in your path.

The [gemctl](/docs/user-guide/gemctl/gemctl) tool controls the Gemini cluster manager.  It lets you inspect your cluster resources, create, delete, and update components, and much more.
You will use it to look at your new cluster and bring up example apps.

Add the appropriate binary folder to your `PATH` to access gemctl:

```shell
# OS X
export PATH=<path/to/gemini-directory>/platforms/darwin/amd64:$PATH
# Linux
export PATH=<path/to/gemini-directory>/platforms/linux/amd64:$PATH
```

**Note**: gcloud also ships with `gemctl`, which by default is added to your path.
However the gcloud bundled gemctl version may be older than the one downloaded by the
get.gem.io install script. We recommend you use the downloaded binary to avoid
potential issues with client/server version skew.

#### Enabling bash completion of the Gemini command line tools

You may find it useful to enable `gemctl` bash completion:

```
$ source ./contrib/completions/bash/gemctl
```

**Note**: This will last for the duration of your bash session. If you want to make this permanent you need to add this line in your bash profile.

Alternatively, on most linux distributions you can also move the completions file to your bash_completions.d like this:

```
$ cp ./contrib/completions/bash/gemctl /etc/bash_completion.d/
```

but then you have to update it when you update gemctl.

### Getting started with your cluster

#### Inspect your cluster

Once `gemctl` is in your path, you can use it to look at your cluster. E.g., running:

```shell
$ gemctl get --all-namespaces services
```

should show a set of [services](/docs/user-guide/services) that look something like this:

```shell
NAMESPACE     NAME                  CLUSTER_IP       EXTERNAL_IP       PORT(S)       SELECTOR               AGE
default       gemini            10.0.0.1         <none>            443/TCP       <none>                 1d
gem-system   gem-dns              10.0.0.2         <none>            53/TCP,53/UDP gem-app=gem-dns       1d
gem-system   gem-ui               10.0.0.3         <none>            80/TCP        gem-app=gem-ui        1d
...
```

Similarly, you can take a look at the set of [pods](/docs/user-guide/pods) that were created during cluster startup.
You can do this via the

```shell
$ gemctl get --all-namespaces pods
```

command.

You'll see a list of pods that looks something like this (the name specifics will be different):

```shell
NAMESPACE     NAME                                           READY     STATUS    RESTARTS   AGE
gem-system   fluentd-cloud-logging-gemini-minion-63uo   1/1       Running   0          14m
gem-system   fluentd-cloud-logging-gemini-minion-c1n9   1/1       Running   0          14m
gem-system   fluentd-cloud-logging-gemini-minion-c4og   1/1       Running   0          14m
gem-system   fluentd-cloud-logging-gemini-minion-ngua   1/1       Running   0          14m
gem-system   gem-dns-v5-7ztia                              3/3       Running   0          15m
gem-system   gem-ui-v1-curt1                               1/1       Running   0          15m
gem-system   monitoring-heapster-v5-ex4u3                   1/1       Running   1          15m
gem-system   monitoring-influx-grafana-v1-piled             2/2       Running   0          15m
```

Some of the pods may take a few seconds to start up (during this time they'll show `Pending`), but check that they all show as `Running` after a short period.

#### Run some examples

Then, see [a simple nginx example](/docs/user-guide/simple-nginx) to try out your new cluster.

For more complete applications, please look in the [examples directory](https://github.com/gemini-project/gemini/tree/{{page.githubbranch}}/examples/).  The [guestbook example](https://github.com/gemini-project/gemini/tree/{{page.githubbranch}}/examples/guestbook/) is a good "getting started" walkthrough.

### Tearing down the cluster

To remove/delete/teardown the cluster, use the `gem-down.sh` script.

```shell
cd gemini
cluster/gem-down.sh
```

Likewise, the `gem-up.sh` in the same directory will bring it back up. You do not need to rerun the `curl` or `wget` command: everything needed to setup the Gemini cluster is now on your workstation.

### Customizing

The script above relies on Google Storage to stage the Gemini release. It
then will start (by default) a single master VM along with 4 worker VMs.  You
can tweak some of these parameters by editing `gemini/cluster/gce/config-default.sh`
You can view a transcript of a successful cluster creation
[here](https://gist.github.com/satnam6502/fc689d1b46db9772adea).

### Troubleshooting

#### Project settings

You need to have the Google Cloud Storage API, and the Google Cloud Storage
JSON API enabled. It is activated by default for new projects. Otherwise, it
can be done in the Google Cloud Console.  See the [Google Cloud Storage JSON
API Overview](https://cloud.google.com/storage/docs/json_api/) for more
details.

Also ensure that-- as listed in the [Prerequsites section](#prerequisites)-- you've enabled the `Compute Engine Instance Group Manager API`, and can start up a GCE VM from the command line as in the [GCE Quickstart](https://cloud.google.com/compute/docs/quickstart) instructions.

#### Cluster initialization hang

If the Gemini startup script hangs waiting for the API to be reachable, you can troubleshoot by SSHing into the master and node VMs and looking at logs such as `/var/log/startupscript.log`.

**Once you fix the issue, you should run `gem-down.sh` to cleanup** after the partial cluster creation, before running `gem-up.sh` to try again.

#### SSH

If you're having trouble SSHing into your instances, ensure the GCE firewall
isn't blocking port 22 to your VMs.  By default, this should work but if you
have edited firewall rules or created a new non-default network, you'll need to
expose it: `gcloud compute firewall-rules create default-ssh --network=<network-name>
--description "SSH allowed from anywhere" --allow tcp:22`

Additionally, your GCE SSH key must either have no passcode or you need to be
using `ssh-agent`.

#### Networking

The instances must be able to connect to each other using their private IP. The
script uses the "default" network which should have a firewall rule called
"default-allow-internal" which allows traffic on any port on the private IPs.
If this rule is missing from the default network or if you change the network
being used in `cluster/config-default.sh` create a new rule with the following
field values:

* Source Ranges: `10.0.0.0/8`
* Allowed Protocols and Port: `tcp:1-65535;udp:1-65535;icmp`