---
---

This guide will walk you through the process of getting a Gemini Fedora cluster running on Digital Ocean with networking powered by Calico networking.
It will cover the installation and configuration of the following systemd processes on the following hosts:

Gemini Master:

- `gem-apiserver`
- `gem-controller-manager`
- `gem-scheduler`
- `etcd`
- `docker`
- `calico-node`

Gemini Node:

- `gemlet`
- `gem-proxy`
- `docker`
- `calico-node`

For this demo, we will be setting up one Master and one Node with the following information:

|  Hostname   |     IP      |
|-------------|-------------|
| gem-master |10.134.251.56|
| gem-node-1 |10.134.251.55|

This guide is scalable to multiple nodes provided you [configure interface-cbr0 with its own subnet on each Node](#configure-the-virtual-interface---cbr0)
and [add an entry to /etc/hosts for each host](#setup-communication-between-hosts).

Ensure you substitute the IP Addresses and Hostnames used in this guide with ones in your own setup.

* TOC
{:toc}

## Prerequisites

You need two or more Fedora 22 droplets on Digital Ocean with [Private Networking](https://www.digitalocean.com/community/tutorials/how-to-set-up-and-use-digitalocean-private-networking) enabled.

## Setup Communication Between Hosts

Digital Ocean private networking configures a private network on eth1 for each host.  To simplify communication between the hosts, we will add an entry to /etc/hosts
so that all hosts in the cluster can hostname-resolve one another to this interface.  **It is important that the hostname resolves to this interface instead of eth0, as
all Gemini and Calico services will be running on it.**

```shell
echo "10.134.251.56 gem-master" >> /etc/hosts
echo "10.134.251.55 gem-node-1" >> /etc/hosts
```

> Make sure that communication works between gem-master and each gem-node by using a utility such as ping.

## Setup Master

### Install etcd

* Both Calico and Gemini use etcd as their datastore. We will run etcd on Master and point all Gemini and Calico services at it.

```shell
yum -y install etcd
```

* Edit `/etc/etcd/etcd.conf`

```conf
ETCD_LISTEN_CLIENT_URLS="http://gem-master:4001"

ETCD_ADVERTISE_CLIENT_URLS="http://gem-master:4001"
```

### Install Gemini

* Run the following command on Master to install the latest Gemini (as well as docker):

```shell
yum -y install gemini
```

* Edit `/etc/gemini/config `

```conf
# How the controller-manager, scheduler, and proxy find the apiserver
GEM_MASTER="--master=http://gem-master:8080"
```

* Edit `/etc/gemini/apiserver`

```conf
# The address on the local server to listen to.
GEM_API_ADDRESS="--insecure-bind-address=0.0.0.0"

GEM_ETCD_SERVERS="--etcd-servers=http://gem-master:4001"

# Remove ServiceAccount from this line to run without API Tokens
GEM_ADMISSION_CONTROL="--admission-control=NamespaceLifecycle,NamespaceExists,LimitRanger,SecurityContextDeny,ResourceQuota"
```

* Create /var/run/gemini on master:

```shell
mkdir /var/run/gemini
chown gem:gem /var/run/gemini
chmod 750 /var/run/gemini
```

* Start the appropriate services on master:

```shell
for SERVICE in etcd gem-apiserver gem-controller-manager gem-scheduler; do
    systemctl restart $SERVICE
    systemctl enable $SERVICE
    systemctl status $SERVICE
done
```

### Install Calico

Next, we'll launch Calico on Master to allow communication between Pods and any services running on the Master.
* Install calicoctl, the calico configuration tool.

```shell
wget https://github.com/Metaswitch/calico-docker/releases/download/v0.5.5/calicoctl
chmod +x ./calicoctl
sudo mv ./calicoctl /usr/bin
```

* Create `/etc/systemd/system/calico-node.service`

```conf
[Unit]
Description=calicoctl node
Requires=docker.service
After=docker.service

[Service]
User=root
Environment="ETCD_AUTHORITY=gem-master:4001"
PermissionsStartOnly=true
ExecStartPre=/usr/bin/calicoctl checksystem --fix
ExecStart=/usr/bin/calicoctl node --ip=10.134.251.56 --detach=false

[Install]
WantedBy=multi-user.target
```

>Be sure to substitute `--ip=10.134.251.56` with your Master's eth1 IP Address.

* Start Calico

```shell
systemctl enable calico-node.service
systemctl start calico-node.service
```

>Starting calico for the first time may take a few minutes as the calico-node docker image is downloaded.

## Setup Node

### Configure the Virtual Interface - cbr0

By default, docker will create and run on a virtual interface called `docker0`. This interface is automatically assigned the address range 172.17.42.1/16.
In order to set our own address range, we will create a new virtual interface called `cbr0` and then start docker on it.

* Add a virtual interface by creating `/etc/sysconfig/network-scripts/ifcfg-cbr0`:

```conf
DEVICE=cbr0
TYPE=Bridge
IPADDR=192.168.1.1
NETMASK=255.255.255.0
ONBOOT=yes
BOOTPROTO=static
```

>**Note for Multi-Node Clusters:** Each node should be assigned an IP address on a unique subnet. In this example, node-1 is using 192.168.1.1/24,
so node-2 should be assigned another pool on the 192.168.x.0/24 subnet, e.g. 192.168.2.1/24.

* Ensure that your system has bridge-utils installed. Then, restart the networking daemon to activate the new interface

```shell
systemctl restart network.service
```

### Install Docker

* Install Docker

```shell
yum -y install docker
```

* Configure docker to run on `cbr0` by editing `/etc/sysconfig/docker-network`:

```conf
DOCKER_NETWORK_OPTIONS="--bridge=cbr0 --iptables=false --ip-masq=false"
```

* Start docker

```shell
systemctl start docker
```

### Install Calico

* Install calicoctl, the calico configuration tool.

```shell
wget https://github.com/Metaswitch/calico-docker/releases/download/v0.5.5/calicoctl
chmod +x ./calicoctl
sudo mv ./calicoctl /usr/bin
```

* Create `/etc/systemd/system/calico-node.service`

```conf
[Unit]
Description=calicoctl node
Requires=docker.service
After=docker.service

[Service]
User=root
Environment="ETCD_AUTHORITY=gem-master:4001"
PermissionsStartOnly=true
ExecStartPre=/usr/bin/calicoctl checksystem --fix
ExecStart=/usr/bin/calicoctl node --ip=10.134.251.55 --detach=false --gemini

[Install]
WantedBy=multi-user.target
```

> Note: You must replace the IP address with your node's eth1 IP Address!

* Start Calico

```shell
systemctl enable calico-node.service
systemctl start calico-node.service
```

* Configure the IP Address Pool

 Most Gemini application deployments will require communication between Pods and the gem-apiserver on Master. On a  standard Digital
Ocean Private Network, requests sent from Pods to the gem-apiserver will not be returned as the networking fabric will drop response packets
destined for any 192.168.0.0/16 address. To resolve this, you can have calicoctl add a masquerade rule to all outgoing traffic on the node:

```shell
ETCD_AUTHORITY=gem-master:4001 calicoctl pool add 192.168.0.0/16 --nat-outgoing
```

### Install Gemini

* First, install Gemini.

```shell
yum -y install gemini
```

* Edit `/etc/gemini/config`

```conf
# How the controller-manager, scheduler, and proxy find the apiserver
GEM_MASTER="--master=http://gem-master:8080"
```

* Edit `/etc/gemini/gemlet`

  We'll pass in an extra parameter - `--network-plugin=calico` to tell the Gemlet to use the Calico networking plugin. Additionally, we'll add two
environment variables that will be used by the Calico networking plugin.

```shell
# The address for the info server to serve on (set to 0.0.0.0 or "" for all interfaces)
GEMLET_ADDRESS="--address=0.0.0.0"

# You may leave this blank to use the actual hostname
# GEMLET_HOSTNAME="--hostname-override=127.0.0.1"

# location of the api-server
GEMLET_API_SERVER="--api-servers=http://gem-master:8080"

# Add your own!
GEMLET_ARGS="--network-plugin=calico"

# The following are variables which the gemlet will pass to the calico-networking plugin
ETCD_AUTHORITY="gem-master:4001"
GEM_API_ROOT="http://gem-master:8080/api/v1"
```

* Start Gemini on the node.

```shell
for SERVICE in gem-proxy gemlet; do 
    systemctl restart $SERVICE
    systemctl enable $SERVICE
    systemctl status $SERVICE 
done
```

## Check Running Cluster

The cluster should be running! Check that your nodes are reporting as such:

```shell
gemctl get nodes
NAME          LABELS                               STATUS
gem-node-1   gemin.io/hostname=gem-node-1   Ready
```