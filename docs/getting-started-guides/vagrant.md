---
---

Running Gemini with Vagrant (and VirtualBox) is an easy way to run/test/develop on your local machine (Linux, Mac OS X).

* TOC
{:toc}

### Prerequisites

1. Install latest version >= 1.7.4 of vagrant from http://www.vagrantup.com/downloads.html
2. Install one of:
   1. The latest version of Virtual Box from https://www.virtualbox.org/wiki/Downloads
   2. [VMWare Fusion](https://www.vmware.com/products/fusion/) version 5 or greater as well as the appropriate [Vagrant VMWare Fusion provider](https://www.vagrantup.com/vmware)
   3. [VMWare Workstation](https://www.vmware.com/products/workstation/) version 9 or greater as well as the [Vagrant VMWare Workstation provider](https://www.vagrantup.com/vmware)
   4. [Parallels Desktop](https://www.parallels.com/products/desktop/) version 9 or greater as well as the [Vagrant Parallels provider](https://parallels.github.io/vagrant-parallels/)
   5. libvirt with KVM and enable support of hardware virtualisation. [Vagrant-libvirt](https://github.com/pradels/vagrant-libvirt). For fedora provided official rpm, and possible to use `yum install vagrant-libvirt`

### Setup

Setting up a cluster is as simple as running:

```shell
export GEMINI_PROVIDER=vagrant
curl -sS https://get.gem.io | bash
```

Alternatively, you can download [Gemini release](https://github.com/gemini-project/gemini/releases) and extract the archive. To start your local cluster, open a shell and run:

```shell
cd gemini

export GEMINI_PROVIDER=vagrant
./cluster/gem-up.sh
```

The `GEMINI_PROVIDER` environment variable tells all of the various cluster management scripts which variant to use.  If you forget to set this, the assumption is you are running on Google Compute Engine.

By default, the Vagrant setup will create a single master VM (called gemini-master) and one node (called gemini-node-1). Each VM will take 1 GB, so make sure you have at least 2GB to 4GB of free memory (plus appropriate free disk space).

Vagrant will provision each machine in the cluster with all the necessary components to run Gemini.  The initial setup can take a few minutes to complete on each machine.

If you installed more than one Vagrant provider, Gemini will usually pick the appropriate one. However, you can override which one Gemini will use by setting the [`VAGRANT_DEFAULT_PROVIDER`](https://docs.vagrantup.com/v2/providers/default.html) environment variable:

```shell
export VAGRANT_DEFAULT_PROVIDER=parallels
export GEMINI_PROVIDER=vagrant
./cluster/gem-up.sh
```

By default, each VM in the cluster is running Fedora.

To access the master or any node:

```shell
vagrant ssh master
vagrant ssh node-1
```

If you are running more than one node, you can access the others by:

```shell
vagrant ssh node-2
vagrant ssh node-3
```

Each node in the cluster installs the docker daemon and the gemlet.

The master node instantiates the Gemini master components as pods on the machine.

To view the service status and/or logs on the gemini-master:

```shell
[vagrant@gemini-master ~] $ vagrant ssh master
[vagrant@gemini-master ~] $ sudo su

[root@gemini-master ~] $ systemctl status gemlet
[root@gemini-master ~] $ journalctl -ru gemlet

[root@gemini-master ~] $ systemctl status docker
[root@gemini-master ~] $ journalctl -ru docker

[root@gemini-master ~] $ tail -f /var/log/gem-apiserver.log
[root@gemini-master ~] $ tail -f /var/log/gem-controller-manager.log
[root@gemini-master ~] $ tail -f /var/log/gem-scheduler.log
```

To view the services on any of the nodes:

```shell
[vagrant@gemini-master ~] $ vagrant ssh node-1
[vagrant@gemini-master ~] $ sudo su

[root@gemini-master ~] $ systemctl status gemlet
[root@gemini-master ~] $ journalctl -ru gemlet

[root@gemini-master ~] $ systemctl status docker
[root@gemini-master ~] $ journalctl -ru docker
```

### Interacting with your Gemini cluster with Vagrant.

With your Gemini cluster up, you can manage the nodes in your cluster with the regular Vagrant commands.

To push updates to new Gemini code after making source changes:

```shell
./cluster/gem-push.sh
```

To stop and then restart the cluster:

```shell
vagrant halt
./cluster/gem-up.sh
```

To destroy the cluster:

```shell
vagrant destroy
```

Once your Vagrant machines are up and provisioned, the first thing to do is to check that you can use the `gemctl.sh` script.

You may need to build the binaries first, you can do this with `make`

```shell
$ ./cluster/gemctl.sh get nodes

NAME                LABELS
10.245.1.4          <none>
10.245.1.5          <none>
10.245.1.3          <none>
```

### Authenticating with your master

When using the vagrant provider in Gemini, the `cluster/gemctl.sh` script will cache your credentials in a `~/.gemini_vagrant_auth` file so you will not be prompted for them in the future.

```shell
cat ~/.gemini_vagrant_auth
```

```json
{ "User": "vagrant",
  "Password": "vagrant",
  "CAFile": "/home/gem_user/.gemini.vagrant.ca.crt",
  "CertFile": "/home/gem_user/.gemcfg.vagrant.crt",
  "KeyFile": "/home/gem_user/.gemcfg.vagrant.key"
}
```

You should now be set to use the `cluster/gemctl.sh` script. For example try to list the nodes that you have started with:

```shell
./cluster/gemctl.sh get nodes
```

### Running containers

Your cluster is running, you can list the nodes in your cluster:

```shell
$ ./cluster/gemctl.sh get nodes

NAME                 LABELS
10.245.2.4           <none>
10.245.2.3           <none>
10.245.2.2           <none>
```

Now start running some containers!

You can now use any of the `cluster/gem-*.sh` commands to interact with your VM machines.
Before starting a container there will be no Pods, Services and Deployments.

```shell
$ ./cluster/gemctl.sh get pods
NAME        READY     STATUS    RESTARTS   AGE

$ ./cluster/gemctl.sh get services
NAME              CLUSTER_IP       EXTERNAL_IP       PORT(S)       SELECTOR               AGE

$ ./cluster/gemctl.sh get deployments
CONTROLLER   CONTAINER(S)   IMAGE(S)   SELECTOR   REPLICAS
```

Start a container running nginx with a Deployment and three replicas

```shell
$ ./cluster/gemctl.sh run my-nginx --image=nginx --replicas=3 --port=80
```

When listing the pods, you will see that three containers have been started and are in Waiting state:

```shell
$ ./cluster/gemctl.sh get pods
NAME                        READY     STATUS              RESTARTS   AGE
my-nginx-3800858182-4e6pe   0/1       ContainerCreating   0          3s
my-nginx-3800858182-8ko0s   1/1       Running             0          3s
my-nginx-3800858182-seu3u   0/1       ContainerCreating   0          3s
```

You need to wait for the provisioning to complete, you can monitor the nodes by doing:

```shell
$ vagrant ssh node-1 -c 'sudo docker images'
gemini-node-1:
    REPOSITORY          TAG                 IMAGE ID            CREATED             VIRTUAL SIZE
    <none>              <none>              96864a7d2df3        26 hours ago        204.4 MB
    google/cadvisor     latest              e0575e677c50        13 days ago         12.64 MB
    gemini/pause    latest              6c4579af347b        8 weeks ago         239.8 kB
```

Once the docker image for nginx has been downloaded, the container will start and you can list it:

```shell
$ vagrant ssh node-1 -c 'sudo docker ps'
gemini-node-1:
    CONTAINER ID        IMAGE                     COMMAND                CREATED             STATUS              PORTS                    NAMES
    dbe79bf6e25b        nginx:latest              "nginx"                21 seconds ago      Up 19 seconds                                gem--mynginx.8c5b8a3a--7813c8bd_-_3ffe_-_11e4_-_9036_-_0800279696e1.etcd--7813c8bd_-_3ffe_-_11e4_-_9036_-_0800279696e1--fcfa837f
    fa0e29c94501        gemini/pause:latest   "/pause"               8 minutes ago       Up 8 minutes        0.0.0.0:8080->80/tcp     gem--net.a90e7ce4--7813c8bd_-_3ffe_-_11e4_-_9036_-_0800279696e1.etcd--7813c8bd_-_3ffe_-_11e4_-_9036_-_0800279696e1--baf5b21b
    aa2ee3ed844a        google/cadvisor:latest    "/usr/bin/cadvisor"    38 minutes ago      Up 38 minutes                                gem--cadvisor.9e90d182--cadvisor_-_agent.file--4626b3a2
    65a3a926f357        gemini/pause:latest   "/pause"               39 minutes ago      Up 39 minutes       0.0.0.0:4194->8080/tcp   gem--net.c5ba7f0e--cadvisor_-_agent.file--342fd561
```

Going back to listing the Pods, Services and Deployments, you now have:

```shell
$ ./cluster/gemctl.sh get pods
NAME                        READY     STATUS    RESTARTS   AGE
my-nginx-3800858182-4e6pe   1/1       Running   0          40s
my-nginx-3800858182-8ko0s   1/1       Running   0          40s
my-nginx-3800858182-seu3u   1/1       Running   0          40s

$ ./cluster/gemctl.sh get services
NAME              CLUSTER_IP       EXTERNAL_IP       PORT(S)       SELECTOR               AGE

$ ./cluster/gemctl.sh get deployments
NAME       DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
my-nginx   3         3         3            3           1m
```

We did not start any Services, hence there are none listed. But we see three replicas displayed properly.
Check the [guestbook](https://github.com/gemini-project/gemini/tree/{{page.githubbranch}}/examples/guestbook/) application to learn how to create a Service.
You can already play with scaling the replicas with:

```shell
$ ./cluster/gemctl.sh scale deployments my-nginx --replicas=2
$ ./cluster/gemctl.sh get pods
NAME                        READY     STATUS    RESTARTS   AGE
my-nginx-3800858182-4e6pe   1/1       Running   0          2m
my-nginx-3800858182-8ko0s   1/1       Running   0          2m
```

Congratulations!

### Troubleshooting

#### I keep downloading the same (large) box all the time!

By default the Vagrantfile will download the box from S3. You can change this (and cache the box locally) by providing a name and an alternate URL when calling `gem-up.sh`

```shell
export GEMINI_BOX_NAME=choose_your_own_name_for_your_gemr_box
export GEMINI_BOX_URL=path_of_your_gemr_box
export GEMINI_PROVIDER=vagrant
./cluster/gem-up.sh
```

#### I am getting timeouts when trying to curl the master from my host!

During provision of the cluster, you may see the following message:

```shell
Validating node-1
.............
Waiting for each node to be registered with cloud provider
error: couldn't read version from server: Get https://10.245.1.2/api: dial tcp 10.245.1.2:443: i/o timeout
```

Some users have reported VPNs may prevent traffic from being routed to the host machine into the virtual machine network.

To debug, first verify that the master is binding to the proper IP address:

```
$ vagrant ssh master
$ ifconfig | grep eth1 -C 2
eth1: flags=4163<UP,BROADCAST,RUNNING,MULTICAST> mtu 1500 inet 10.245.1.2 netmask
   255.255.255.0 broadcast 10.245.1.255
```

Then verify that your host machine has a network connection to a bridge that can serve that address:

```sh
$ ifconfig | grep 10.245.1 -C 2

vboxnet5: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 10.245.1.1  netmask 255.255.255.0  broadcast 10.245.1.255
        inet6 fe80::800:27ff:fe00:5  prefixlen 64  scopeid 0x20<link>
        ether 0a:00:27:00:00:05  txqueuelen 1000  (Ethernet)
```

If you do not see a response on your host machine, you will most likely need to connect your host to the virtual network created by the virtualization provider.

If you do see a network, but are still unable to ping the machine, check if your VPN is blocking the request.

#### I just created the cluster, but I am getting authorization errors!

You probably have an incorrect ~/.gemini_vagrant_auth file for the cluster you are attempting to contact.

```shell
rm ~/.gemini_vagrant_auth
```

After using gemctl.sh make sure that the correct credentials are set:

```shell
cat ~/.gemini_vagrant_auth
```

```json
{
  "User": "vagrant",
  "Password": "vagrant"
}
```

#### I just created the cluster, but I do not see my container running!

If this is your first time creating the cluster, the gemlet on each node schedules a number of docker pull requests to fetch prerequisite images.  This can take some time and as a result may delay your initial pod getting provisioned.

#### I want to make changes to Gemini code!

To set up a vagrant cluster for hacking, follow the [vagrant developer guide](https://github.com/gemini-project/gemini/tree/{{page.githubbranch}}/docs/devel/developer-guides/vagrant.md).

#### I have brought Vagrant up but the nodes cannot validate!

Log on to one of the nodes (`vagrant ssh node-1`) and inspect the salt minion log (`sudo cat /var/log/salt/minion`).

#### I want to change the number of nodes!

You can control the number of nodes that are instantiated via the environment variable `NUM_NODES` on your host machine.  If you plan to work with replicas, we strongly encourage you to work with enough nodes to satisfy your largest intended replica size.  If you do not plan to work with replicas, you can save some system resources by running with a single node. You do this, by setting `NUM_NODES` to 1 like so:

```shell
export NUM_NODES=1
```

#### I want my VMs to have more memory!

You can control the memory allotted to virtual machines with the `GEMINI_MEMORY` environment variable.
Just set it to the number of megabytes you would like the machines to have. For example:

```shell
export GEMINI_MEMORY=2048
```

If you need more granular control, you can set the amount of memory for the master and nodes independently. For example:

```shell
export GEMINI_MASTER_MEMORY=1536
export GEMINI_NODE_MEMORY=2048
```

#### I want to set proxy settings for my Gemini cluster boot strapping!

If you are behind a proxy, you need to install the Vagrant proxy plugin and set the proxy settings:

```shell
vagrant plugin install vagrant-proxyconf
export GEMINI_HTTP_PROXY=http://username:password@proxyaddr:proxyport
export GEMINI_HTTPS_PROXY=https://username:password@proxyaddr:proxyport
```

You can also specify addresses that bypass the proxy, for example:

```shell
export GEMINI_NO_PROXY=127.0.0.1
```

If you are using sudo to make Gemini build, use the `-E` flag to pass in the environment variables. For example, if running `make quick-release`, use:

```shell
sudo -E make quick-release
```

#### I ran vagrant suspend and nothing works!

`vagrant suspend` seems to mess up the network.  This is not supported at this time.

#### I want vagrant to sync folders via nfs!

You can ensure that vagrant uses nfs to sync folders with virtual machines by setting the GEMINI_VAGRANT_USE_NFS environment variable to 'true'. nfs is faster than virtualbox or vmware's 'shared folders' and does not require guest additions. See the [vagrant docs](http://docs.vagrantup.com/v2/synced-folders/nfs.html) for details on configuring nfs on the host. This setting will have no effect on the libvirt provider, which uses nfs by default. For example:

```shell
export GEMINI_VAGRANT_USE_NFS=true
```
