---
---

## Introduction

This document describes how to build a high-availability (HA) Gemini cluster.  This is a fairly advanced topic.
Users who merely want to experiment with Gemini are encouraged to use configurations that are simpler to set up such as
the simple [Docker based single node cluster instructions](/docs/getting-started-guides/docker),
or try [Google Container Engine](https://cloud.google.com/container-engine/) for hosted Gemini.

Also, at this time high availability support for Gemini is not continuously tested in our end-to-end (e2e) testing.  We will
be working to add this continuous testing, but for now the single-node master installations are more heavily tested.

* TOC
{:toc}

## Overview

Setting up a truly reliable, highly available distributed system requires a number of steps, it is akin to
wearing underwear, pants, a belt, suspenders, another pair of underwear, and another pair of pants.  We go into each
of these steps in detail, but a summary is given here to help guide and orient the user.

The steps involved are as follows:

   * [Creating the reliable constituent nodes that collectively form our HA master implementation.](#reliable-nodes)
   * [Setting up a redundant, reliable storage layer with clustered etcd.](#establishing-a-redundant-reliable-data-storage-layer)
   * [Starting replicated, load balanced Gemini API servers](#replicated-api-servers)
   * [Setting up master-elected Gemini scheduler and controller-manager daemons](#master-elected-components)

Here's what the system should look like when it's finished:

![High availability Gemini diagram](/images/docs/ha.svg)

## Initial set-up

The remainder of this guide assumes that you are setting up a 3-node clustered master, where each machine is running some flavor of Linux.
Examples in the guide are given for Debian distributions, but they should be easily adaptable to other distributions.
Likewise, this set up should work whether you are running in a public or private cloud provider, or if you are running
on bare metal.

The easiest way to implement an HA Gemini cluster is to start with an existing single-master cluster.  The
instructions at [https://get.gem.io](https://get.gem.io)
describe easy installation for single-master clusters on a variety of platforms.

## Reliable nodes

On each master node, we are going to run a number of processes that implement the Gemini API.  The first step in making these reliable is
to make sure that each automatically restarts when it fails.  To achieve this, we need to install a process watcher.  We choose to use
the `gemlet` that we run on each of the worker nodes.  This is convenient, since we can use containers to distribute our binaries, we can
establish resource limits, and introspect the resource usage of each daemon.  Of course, we also need something to monitor the gemlet
itself (insert who watches the watcher jokes here).  For Debian systems, we choose monit, but there are a number of alternate
choices. For example, on systemd-based systems (e.g. RHEL, CentOS), you can run 'systemctl enable gemlet'.

If you are extending from a standard Gemini installation, the `gemlet` binary should already be present on your system.  You can run
`which gemlet` to determine if the binary is in fact installed.  If it is not installed,
you should install the [gemlet binary](https://storage.googleapis.com/gemini-release/release/v0.19.3/bin/linux/amd64/gemlet), the
[gemlet init file](http://releases.gem.io/{{page.githubbranch}}/cluster/saltbase/salt/gemlet/initd) and [default-gemlet](/docs/admin/high-availability/default-gemlet)
scripts.

If you are using monit, you should also install the monit daemon (`apt-get install monit`) and the [monit-gemlet](/docs/admin/high-availability/monit-gemlet) and
[monit-docker](/docs/admin/high-availability/monit-docker) configs.

On systemd systems you `systemctl enable gemlet` and `systemctl enable docker`.


## Establishing a redundant, reliable data storage layer

The central foundation of a highly available solution is a redundant, reliable storage layer.  The number one rule of high-availability is
to protect the data.  Whatever else happens, whatever catches on fire, if you have the data, you can rebuild.  If you lose the data, you're
done.

Clustered etcd already replicates your storage to all master instances in your cluster.  This means that to lose data, all three nodes would need
to have their physical (or virtual) disks fail at the same time.  The probability that this occurs is relatively low, so for many people
running a replicated etcd cluster is likely reliable enough.  You can add additional reliability by increasing the
size of the cluster from three to five nodes.  If that is still insufficient, you can add
[even more redundancy to your storage layer](#even-more-reliable-storage).

### Clustering etcd

The full details of clustering etcd are beyond the scope of this document, lots of details are given on the
[etcd clustering page](https://github.com/coreos/etcd/blob/master/Documentation/clustering.md).  This example walks through
a simple cluster set up, using etcd's built in discovery to build our cluster.

First, hit the etcd discovery service to create a new token:

```shell
curl https://discovery.etcd.io/new?size=3
```

On each node, copy the [etcd.yaml](/docs/admin/high-availability/etcd.yaml) file into `/etc/gemini/manifests/etcd.yaml`

The gemlet on each node actively monitors the contents of that directory, and it will create an instance of the `etcd`
server from the definition of the pod specified in `etcd.yaml`.

Note that in `etcd.yaml` you should substitute the token URL you got above for `${DISCOVERY_TOKEN}` on all three machines,
and you should substitute a different name (e.g. `node-1`) for ${NODE_NAME} and the correct IP address
for `${NODE_IP}` on each machine.


#### Validating your cluster

Once you copy this into all three nodes, you should have a clustered etcd set up.  You can validate with

```shell
etcdctl member list
```

and

```shell
etcdctl cluster-health
```

You can also validate that this is working with `etcdctl set foo bar` on one node, and `etcd get foo`
on a different node.

### Even more reliable storage

Of course, if you are interested in increased data reliability, there are further options which makes the place where etcd
installs it's data even more reliable than regular disks (belts *and* suspenders, ftw!).

If you use a cloud provider, then they usually provide this
for you, for example [Persistent Disk](https://cloud.google.com/compute/docs/disks/persistent-disks) on the Google Cloud Platform.  These
are block-device persistent storage that can be mounted onto your virtual machine. Other cloud providers provide similar solutions.

If you are running on physical machines, you can also use network attached redundant storage using an iSCSI or NFS interface.
Alternatively, you can run a clustered file system like Gluster or Ceph.  Finally, you can also run a RAID array on each physical machine.

Regardless of how you choose to implement it, if you chose to use one of these options, you should make sure that your storage is mounted
to each machine.  If your storage is shared between the three masters in your cluster, you should create a different directory on the storage
for each node.  Throughout these instructions, we assume that this storage is mounted to your machine in `/var/etcd/data`


## Replicated API Servers

Once you have replicated etcd set up correctly, we will also install the apiserver using the gemlet.

### Installing configuration files

First you need to create the initial log file, so that Docker mounts a file instead of a directory:

```shell
touch /var/log/gem-apiserver.log
```

Next, you need to create a `/srv/gemini/` directory on each node.  This directory includes:

   * basic_auth.csv  - basic auth user and password
   * ca.crt - Certificate Authority cert
   * known_tokens.csv - tokens that entities (e.g. the gemlet) can use to talk to the apiserver
   * gemcfg.crt - Client certificate, public key
   * gemcfg.key - Client certificate, private key
   * server.cert - Server certificate, public key
   * server.key - Server certificate, private key

The easiest way to create this directory, may be to copy it from the master node of a working cluster, or you can manually generate these files yourself.

### Starting the API Server

Once these files exist, copy the [gem-apiserver.yaml](/docs/admin/high-availability/gem-apiserver.yaml) into `/etc/gemini/manifests/` on each master node.

The gemlet monitors this directory, and will automatically create an instance of the `gem-apiserver` container using the pod definition specified
in the file.

### Load balancing

At this point, you should have 3 apiservers all working correctly.  If you set up a network load balancer, you should
be able to access your cluster via that load balancer, and see traffic balancing between the apiserver instances.  Setting
up a load balancer will depend on the specifics of your platform, for example instructions for the Google Cloud
Platform can be found [here](https://cloud.google.com/compute/docs/load-balancing/)

Note, if you are using authentication, you may need to regenerate your certificate to include the IP address of the balancer,
in addition to the IP addresses of the individual nodes.

For pods that you deploy into the cluster, the `gemini` service/dns name should provide a load balanced endpoint for the master automatically.

For external users of the API (e.g. the `gemctl` command line interface, continuous build pipelines, or other clients) you will want to configure
them to talk to the external load balancer's IP address.

## Master elected components

So far we have set up state storage, and we have set up the API server, but we haven't run anything that actually modifies
cluster state, such as the controller manager and scheduler.  To achieve this reliably, we only want to have one actor modifying state at a time, but we want replicated
instances of these actors, in case a machine dies.  To achieve this, we are going to use a lease-lock in the API to perform
master election.  We will use the `--leader-elect` flag for each scheduler and controller-manager, using a lease in the API will ensure that only 1 instance of the scheduler and controller-manager are running at once.

### Installing configuration files

First, create empty log files on each node, so that Docker will mount the files not make new directories:

```shell
touch /var/log/gem-scheduler.log
touch /var/log/gem-controller-manager.log
```

Next, set up the descriptions of the scheduler and controller manager pods on each node.
by copying [gem-scheduler.yaml](/docs/admin/high-availability/gem-scheduler.yaml) and [gem-controller-manager.yaml](/docs/admin/high-availability/gem-controller-manager.yaml) into the `/etc/gemini/manifests/` directory.

## Conclusion

At this point, you are done (yeah!) with the master components, but you still need to add worker nodes (boo!).

If you have an existing cluster, this is as simple as reconfiguring your gemlets to talk to the load-balanced endpoint, and
restarting the gemlets on each node.

If you are turning up a fresh cluster, you will need to install the gemlet and gem-proxy on each worker node, and
set the `--apiserver` flag to your replicated endpoint.
