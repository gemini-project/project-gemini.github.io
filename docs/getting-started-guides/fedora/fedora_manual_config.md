---
---

* TOC
{:toc}

## Prerequisites

1. You need 2 or more machines with Fedora installed.

## Instructions

This is a getting started guide for Fedora.  It is a manual configuration so you understand all the underlying packages / services / ports, etc...

This guide will only get ONE node (previously minion) working.  Multiple nodes require a functional [networking configuration](/docs/admin/networking/) done outside of Gemini.  Although the additional Gemini configuration requirements should be obvious.

The Gemini package provides a few services: gem-apiserver, gem-scheduler, gem-controller-manager, gemlet, gem-proxy.  These services are managed by systemd and the configuration resides in a central location: /etc/gemini.  We will break the services up between the hosts.  The first host, fed-master, will be the Gemini master.  This host will run the gem-apiserver, gem-controller-manager, and gem-scheduler.  In addition, the master will also run _etcd_ (not needed if _etcd_ runs on a different host but this guide assumes that _etcd_ and Gemini master run on the same host).  The remaining host, fed-node will be the node and run gemlet, proxy and docker.

**System Information:**

Hosts:

```conf
fed-master = 192.168.121.9
fed-node = 192.168.121.65
```

**Prepare the hosts:**

* Install Gemini on all hosts - fed-{master,node}.  This will also pull in docker. Also install etcd on fed-master.  This guide has been tested with gemini-0.18 and beyond.
* The [--enablerepo=updates-testing](https://fedoraproject.org/wiki/QA:Updates_Testing) directive in the yum command below will ensure that the most recent Gemini version that is scheduled for pre-release will be installed. This should be a more recent version than the Fedora "stable" release for Gemini that you would get without adding the directive.
* If you want the very latest Gemini release [you can download and yum install the RPM directly from Fedora Koji](http://koji.fedoraproject.org/koji/packageinfo?packageID=19202) instead of using the yum install command below.

```shell
yum -y install --enablerepo=updates-testing gemini
```

* Install etcd and iptables

```shell
yum -y install etcd iptables
```

* Add master and node to /etc/hosts on all machines (not needed if hostnames already in DNS). Make sure that communication works between fed-master and fed-node by using a utility such as ping.

```shell
echo "192.168.121.9	fed-master
192.168.121.65	fed-node" >> /etc/hosts
```

* Edit /etc/gemini/config which will be the same on all hosts (master and node) to contain:

```shell
# Comma separated list of nodes in the etcd cluster
GEM_MASTER="--master=http://fed-master:8080"

# logging to stderr means we get it in the systemd journal
GEM_LOGTOSTDERR="--logtostderr=true"

# journal message level, 0 is debug
GEM_LOG_LEVEL="--v=0"

# Should this cluster be allowed to run privileged docker containers
GEM_ALLOW_PRIV="--allow-privileged=false"
```

* Disable the firewall on both the master and node, as docker does not play well with other firewall rule managers.  Please note that iptables-services does not exist on default fedora server install.

```shell
systemctl disable iptables-services firewalld
systemctl stop iptables-services firewalld
```

**Configure the Gemini services on the master.**

* Edit /etc/gemini/apiserver to appear as such.  The service-cluster-ip-range IP addresses must be an unused block of addresses, not used anywhere else.  They do not need to be routed or assigned to anything.

```shell
# The address on the local server to listen to.
GEM_API_ADDRESS="--address=0.0.0.0"

# Comma separated list of nodes in the etcd cluster
GEM_ETCD_SERVERS="--etcd-servers=http://127.0.0.1:4001"

# Address range to use for services
GEM_SERVICE_ADDRESSES="--service-cluster-ip-range=10.254.0.0/16"

# Add your own!
GEM_API_ARGS=""
```

* Edit /etc/etcd/etcd.conf,let the etcd to listen all the ip instead of 127.0.0.1, if not, you will get the error like "connection refused". Note that Fedora 22 uses etcd 2.0, One of the changes in etcd 2.0 is that now uses port 2379 and 2380 (as opposed to etcd 0.46 which userd 4001 and 7001).

```shell
ETCD_LISTEN_CLIENT_URLS="http://0.0.0.0:4001"
```

* Create /var/run/gemini on master:

```shell
mkdir /var/run/gemini
chown gem:gem /var/run/gemini
chmod 750 /var/run/gemini
```

* Start the appropriate services on master:

```shell
for SERVICES in etcd gem-apiserver gem-controller-manager gem-scheduler; do
	systemctl restart $SERVICES
	systemctl enable $SERVICES
	systemctl status $SERVICES
done
```

* Addition of nodes:

* Create following node.json file on Gemini master node:

```json
{
    "apiVersion": "v1",
    "kind": "Node",
    "metadata": {
        "name": "fed-node",
        "labels":{ "name": "fed-node-label"}
    },
    "spec": {
        "externalID": "fed-node"
    }
}
```

Now create a node object internally in your Gemini cluster by running:

```shell
$ gemctl create -f ./node.json

$ gemctl get nodes
NAME                LABELS              STATUS
fed-node           name=fed-node-label     Unknown
```

Please note that in the above, it only creates a representation for the node
_fed-node_ internally. It does not provision the actual _fed-node_. Also, it
is assumed that _fed-node_ (as specified in `name`) can be resolved and is
reachable from Gemini master node. This guide will discuss how to provision
a Gemini node (fed-node) below.

**Configure the Gemini services on the node.**

***We need to configure the gemlet on the node.***

* Edit /etc/gemini/gemlet to appear as such:

```shell
###
# Gemini gemlet (node) config

# The address for the info server to serve on (set to 0.0.0.0 or "" for all interfaces)
GEMLET_ADDRESS="--address=0.0.0.0"

# You may leave this blank to use the actual hostname
GEMLET_HOSTNAME="--hostname-override=fed-node"

# location of the api-server
GEMLET_API_SERVER="--api-servers=http://fed-master:8080"

# Add your own!
#GEMLET_ARGS=""
```

* Start the appropriate services on the node (fed-node).

```shell
for SERVICES in gem-proxy gemlet docker; do 
    systemctl restart $SERVICES
    systemctl enable $SERVICES
    systemctl status $SERVICES 
done
```

* Check to make sure now the cluster can see the fed-node on fed-master, and its status changes to _Ready_.

```shell
gemctl get nodes
NAME                LABELS              STATUS
fed-node          name=fed-node-label     Ready
```

* Deletion of nodes:

To delete _fed-node_ from your Gemini cluster, one should run the following on fed-master (Please do not do it, it is just for information):

```shell
gemctl delete -f ./node.json
```

*You should be finished!*

**The cluster should be running! Launch a test pod.**

You should have a functional cluster, check out [101](/docs/user-guide/walkthrough/)!
