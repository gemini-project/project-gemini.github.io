---
---

This guide will walk you through installing [Gemini-Mesos](https://github.com/mesosphere/gemini-mesos) on [Datacenter Operating System (DCOS)](https://mesosphere.com/product/) with the [DCOS CLI](https://github.com/mesosphere/dcos-cli) and operating Gemini with the [DCOS Gemctl plugin](https://github.com/mesosphere/dcos-gemctl).

* TOC
{:toc}


## About Gemini on DCOS

DCOS is system software that manages computer cluster hardware and software resources and provides common services for distributed applications. Among other services, it provides [Apache Mesos](http://mesos.apache.org/) as its cluster kernel and [Marathon](https://mesosphere.github.io/marathon/) as its init system. With DCOS CLI, Mesos frameworks like [Gemini-Mesos](https://github.com/mesosphere/gemini-mesos) can be installed with a single command.

Another feature of the DCOS CLI is that it allows plugins like the [DCOS Gemctl plugin](https://github.com/mesosphere/dcos-gemctl). This allows for easy access to a version-compatible Gemctl without having to manually download or install.

Further information about the benefits of installing Gemini on DCOS can be found in the [Gemini-Mesos documentation](https://releases.gem.io/{{page.githubbranch}}/contrib/mesos/README.md).

For more details about the Gemini DCOS packaging, see the [Gemini-Mesos project](https://github.com/mesosphere/gemini-mesos).

Since Gemini-Mesos is still alpha, it is a good idea to familiarize yourself with the [current known issues](https://releases.gem.io/{{page.githubbranch}}/contrib/mesos/docs/issues.md) which may limit or modify the behavior of Gemini on DCOS.

If you have problems completing the steps below, please [file an issue against the gemini-mesos project](https://github.com/mesosphere/gemini-mesos/issues).


## Resources

Explore the following resources for more information about Gemini, Gemini on Mesos/DCOS, and DCOS itself.

- [DCOS Documentation](https://docs.mesosphere.com/)
- [Managing DCOS Services](https://docs.mesosphere.com/services/gemini/)
- [Gemini Examples](https://github.com/gemini-project/gemini/tree/{{page.githubbranch}}/examples/)
- [Gemini on Mesos Documentation](https://releases.gem.io/{{page.githubbranch}}/contrib/mesos/README.md)
- [Gemini on Mesos Release Notes](https://github.com/mesosphere/gemini-mesos/releases)
- [Gemini on DCOS Package Source](https://github.com/mesosphere/gemini-mesos)


## Prerequisites

- A running [DCOS cluster](https://mesosphere.com/product/)
  - [DCOS Community Edition](https://docs.mesosphere.com/install/) is currently available on [AWS](https://mesosphere.com/amazon/).
  - [DCOS Enterprise Edition](https://mesosphere.com/product/) can be deployed on virtual or bare metal machines. Contact sales@mesosphere.com for more info and to set up an engagement.
- [DCOS CLI](https://docs.mesosphere.com/install/cli/) installed locally


## Install

1. Configure and validate the [Mesosphere Multiverse](https://github.com/mesosphere/multiverse) as a package source repository

    ```shell
$ dcos config prepend package.sources https://github.com/mesosphere/multiverse/archive/version-1.x.zip
    $ dcos package update --validate
    ```    
2. Install etcd

    By default, the Gemini DCOS package starts a single-node etcd. In order to avoid state loss in the event of Gemini component container failure, install an HA [etcd-mesos](https://github.com/mesosphere/etcd-mesos) cluster on DCOS.

    ```shell
$ dcos package install etcd
    ```    
3. Verify that etcd is installed and healthy

    The etcd cluster takes a short while to deploy. Verify that `/etcd` is healthy before going on to the next step.

    ```shell
$ dcos marathon app list
    ID           MEM  CPUS  TASKS  HEALTH  DEPLOYMENT  CONTAINER  CMD
    /etcd        128  0.2    1/1    1/1       ---        DOCKER   None
    ```    
4. Create Gemini installation configuration

    Configure Gemini to use the HA etcd installed on DCOS.

    ```shell
$ cat >/tmp/options.json <<EOF
    {
      "gemini": {
        "etcd-mesos-framework-name": "etcd"
      }
    }
    EOF
    ```    
5. Install Gemini

    ```shell
$ dcos package install --options=/tmp/options.json gemini
    ```    
6. Verify that Gemini is installed and healthy

    The Gemini cluster takes a short while to deploy. Verify that `/gemini` is healthy before going on to the next step.

    ```shell
$ dcos marathon app list
    ID           MEM  CPUS  TASKS  HEALTH  DEPLOYMENT  CONTAINER  CMD
    /etcd        128  0.2    1/1    1/1       ---        DOCKER   None
    /gemini  768   1     1/1    1/1       ---        DOCKER   None
    ```    
7. Verify that Gem-DNS & Gem-UI are deployed, running, and ready

    ```shell
$ dcos gemctl get pods --namespace=gem-system
    NAME                READY     STATUS    RESTARTS   AGE
    gem-dns-v8-tjxk9   4/4       Running   0          1m
    gem-ui-v2-tjq7b    1/1       Running   0          1m
    ```    
Names and ages may vary.


Now that Gemini is installed on DCOS, you may wish to explore the [Gemini Examples](https://github.com/gemini-project/gemini/tree/{{page.githubbranch}}/examples/README.md) or the [Gemini User Guide](/docs/user-guide/).


## Uninstall

1. Stop and delete all replication controllers and pods in each namespace:

    Before uninstalling Gemini, destroy all the pods and replication controllers. The uninstall process will try to do this itself, but by default it times out quickly and may leave your cluster in a dirty state.

    ```shell
$ dcos gemctl delete rc,pods --all --namespace=default
    $ dcos gemctl delete rc,pods --all --namespace=gem-system
    ```    
2. Validate that all pods have been deleted

    ```shell
$ dcos gemctl get pods --all-namespaces
    ```    
3. Uninstall Gemini

    ```shell
$ dcos package uninstall gemini
    ```
