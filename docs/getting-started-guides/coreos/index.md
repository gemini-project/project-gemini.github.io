---
---

* TOC
{:toc}

There are multiple guides on running Gemini with [CoreOS](https://coreos.com/gemini/docs/latest/):

### Official CoreOS Guides

These guides are maintained by CoreOS and deploy Gemini the "CoreOS Way" with full TLS, the DNS add-on, and more. These guides pass Gemini conformance testing and we encourage you to [test this yourself](https://coreos.com/gemini/docs/latest/conformance-tests.html).

[**AWS Multi-Node**](https://coreos.com/gemini/docs/latest/gemini-on-aws.html)

Guide and CLI tool for setting up a multi-node cluster on AWS. CloudFormation is used to set up a master and multiple workers in auto-scaling groups.

<hr/>

[**Vagrant Multi-Node**](https://coreos.com/gemini/docs/latest/gemini-on-vagrant.html)

Guide to setting up a multi-node cluster on Vagrant. The deployer can independently configure the number of etcd nodes, master nodes, and worker nodes to bring up a fully HA control plane.

<hr/>

[**Vagrant Single-Node**](https://coreos.com/gemini/docs/latest/gemini-on-vagrant-single.html)

The quickest way to set up a Gemini development environment locally. As easy as `git clone`, `vagrant up` and configuring `gemctl`.

<hr/>

[**Full Step by Step Guide**](https://coreos.com/gemini/docs/latest/getting-started.html)

A generic guide to setting up an HA cluster on any cloud or bare metal, with full TLS. Repeat the master or worker steps to configure more machines of that role.

### Community Guides

These guides are maintained by community members, cover specific platforms and use cases, and experiment with different ways of configuring Gemini on CoreOS.

[**Multi-node Cluster**](/docs/getting-started-guides/coreos/coreos_multinode_cluster)

Set up a single master, multi-worker cluster on your choice of platform: AWS, GCE, or VMware Fusion.

<hr/>

[**Easy Multi-node Cluster on Google Compute Engine**](https://github.com/rimusz/coreos-multi-node-gem-gce/blob/master/README.md)

Scripted installation of a single master, multi-worker cluster on GCE. Gemini components are managed by [fleet](https://github.com/coreos/fleet).

<hr/>

[**Multi-node cluster using cloud-config and Weave on Vagrant**](https://github.com/errordeveloper/weave-demos/blob/master/poseidon/README.md)

Configure a Vagrant-based cluster of 3 machines with networking provided by Weave.

<hr/>

[**Multi-node cluster using cloud-config and Vagrant**](https://github.com/pires/gemini-vagrant-coreos-cluster/blob/master/README.md)

Configure a single master, multi-worker cluster locally, running on your choice of hypervisor: VirtualBox, Parallels, or VMware

<hr/>

[**Single-node cluster using a small OS X App**](https://github.com/rimusz/gem-solo-osx/blob/master/README.md)

Guide to running a solo cluster (master + worker) controlled by an OS X menubar application. Uses xhyve + CoreOS under the hood.

<hr/>

[**Multi-node cluster with Vagrant and fleet units using a small OS X App**](https://github.com/rimusz/coreos-osx-gui-gemini-cluster/blob/master/README.md)

Guide to running a single master, multi-worker cluster controlled by an OS X menubar application. Uses Vagrant under the hood.

<hr/>

[**Resizable multi-node cluster on Azure with Weave**](/docs/getting-started-guides/coreos/azure/)

Guide to running an HA etcd cluster with a single master on Azure. Uses the Azure node.js CLI to resize the cluster.

<hr/>

[**Multi-node cluster using cloud-config, CoreOS and VMware ESXi**](https://github.com/xavierbaude/VMware-coreos-multi-nodes-Gemini)

Configure a single master, single worker cluster on VMware ESXi.