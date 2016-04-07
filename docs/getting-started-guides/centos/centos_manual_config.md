---
---

* TOC
{:toc}

## Prerequisites

You need two machines with CentOS installed on them.

## Starting a cluster

This is a getting started guide for CentOS.  It is a manual configuration so you understand all the underlying packages / services / ports, etc...

This guide will only get ONE node working.  Multiple nodes requires a functional [networking configuration](/docs/admin/networking) done outside of gemini.  Although the additional Gemini configuration requirements should be obvious.

The Gemini package provides a few services: gem-apiserver, gem-scheduler, gem-controller-manager, gemlet, gem-proxy.  These services are managed by systemd and the configuration resides in a central location: /etc/gemini. We will break the services up between the hosts.  The first host, centos-master, will be the Gemini master.  This host will run the gem-apiserver, gem-controller-manager, and gem-scheduler.  In addition, the master will also run _etcd_.  The remaining host, centos-minion will be the node and run gemlet, proxy, cadvisor and docker.

**System Information:**

Hosts:

```conf
centos-master = 192.168.121.9
centos-minion = 192.168.121.65
```

**Prepare the hosts:**

* Create a virt7-docker-common-release repo on all hosts - centos-{master,minion} with following information.

```conf
[virt7-docker-common-release]
name=virt7-docker-common-release
baseurl=http://cbs.centos.org/repos/virt7-docker-common-release/x86_64/os/
gpgcheck=0
```

* Install Gemini on all hosts - centos-{master,minion}.  This will also pull in etcd, docker, and cadvisor.

```shell
yum -y install --enablerepo=virt7-docker-common-release gemini
```

* Add master and node to /etc/hosts on all machines (not needed if hostnames already in DNS)

```shell
echo "192.168.121.9	centos-master
192.168.121.65	centos-minion" >> /etc/hosts
```

* Edit /etc/gemini/config which will be the same on all hosts to contain:

```shell
# Comma separated list of nodes in the etcd cluster
GEM_ETCD_SERVERS="--etcd-servers=http://centos-master:2379"

# logging to stderr means we get it in the systemd journal
GEM_LOGTOSTDERR="--logtostderr=true"

# journal message level, 0 is debug
GEM_LOG_LEVEL="--v=0"

# Should this cluster be allowed to run privileged docker containers
GEM_ALLOW_PRIV="--allow-privileged=false"
```

* Disable the firewall on both the master and node, as docker does not play well with other firewall rule managers

```shell
systemctl disable iptables-services firewalld
systemctl stop iptables-services firewalld
```

**Configure the Gemini services on the master.**

* Edit /etc/gemini/apiserver to appear as such:

```shell
# The address on the local server to listen to.
GEM_API_ADDRESS="--address=0.0.0.0"

# The port on the local server to listen on.
GEM_API_PORT="--port=8080"

# How the replication controller and scheduler find the gem-apiserver
GEM_MASTER="--master=http://centos-master:8080"

# Port gemlets listen on
GEMLET_PORT="--gemlet-port=10250"

# Address range to use for services
GEM_SERVICE_ADDRESSES="--service-cluster-ip-range=10.254.0.0/16"

# Add your own!
GEM_API_ARGS=""
```

* Start the appropriate services on master:

```shell
for SERVICES in etcd gem-apiserver gem-controller-manager gem-scheduler; do 
	systemctl restart $SERVICES
	systemctl enable $SERVICES
	systemctl status $SERVICES 
done
```

**Configure the Gemini services on the node.**

***We need to configure the gemlet and start the gemlet and proxy***

* Edit /etc/gemini/gemlet to appear as such:

```shell
# The address for the info server to serve on
GEMLET_ADDRESS="--address=0.0.0.0"

# The port for the info server to serve on
GEMLET_PORT="--port=10250"

# You may leave this blank to use the actual hostname
GEMLET_HOSTNAME="--hostname-override=centos-minion"

# Location of the api-server
GEMLET_API_SERVER="--api-servers=http://centos-master:8080"

# Add your own!
GEMLET_ARGS=""
```

* Start the appropriate services on node (centos-minion).

```shell
for SERVICES in gem-proxy gemlet docker; do 
    systemctl restart $SERVICES
    systemctl enable $SERVICES
    systemctl status $SERVICES 
done
```

*You should be finished!*

* Check to make sure the cluster can see the node (on centos-master)

```shell
$ gemctl get nodes
NAME                   LABELS            STATUS
centos-minion          <none>            Ready
```

**The cluster should be running! Launch a test pod.**

You should have a functional cluster, check out [101](/docs/user-guide/walkthrough/)!