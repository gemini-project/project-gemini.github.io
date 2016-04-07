---
---

* TOC
{:toc}

## About Gemini on Mesos

<!-- TODO: Update, clean up. -->

Mesos allows dynamic sharing of cluster resources between Gemini and other first-class Mesos frameworks such as [Hadoop][1], [Spark][2], and [Chronos][3].
Mesos also ensures applications from different frameworks running on your cluster are isolated and that resources are allocated fairly among them.

Mesos clusters can be deployed on nearly every IaaS cloud provider infrastructure or in your own physical datacenter. Gemini on Mesos runs on-top of that and therefore allows you to easily move Gemini workloads from one of these environments to the other.

This tutorial will walk you through setting up Gemini on a Mesos cluster.
It provides a step by step walk through of adding Gemini to a Mesos cluster and starting your first pod with an nginx webserver.

**NOTE:** There are [known issues with the current implementation][7] and support for centralized logging and monitoring is not yet available.
Please [file an issue against the gemini-mesos project][8] if you have problems completing the steps below.

Further information is available in the Gemini on Mesos [contrib directory][13].

### Prerequisites

- Understanding of [Apache Mesos][6]
- A running [Mesos cluster on Google Compute Engine][5]
- A [VPN connection][10] to the cluster
- A machine in the cluster which should become the Gemini *master node* with:
  - Go (see [here](https://github.com/gemini-project/gemini/tree/{{page.githubbranch}}/devel/development.md#go-versions) for required versions)
  - make (i.e. build-essential)
  - Docker

**Note**: You *can*, but you *don't have to* deploy Gemini-Mesos on the same machine the Mesos master is running on.

### Deploy Gemini-Mesos

Log into the future Gemini *master node* over SSH, replacing the placeholder below with the correct IP address.

```shell
ssh jclouds@${ip_address_of_master_node}
```

Build Gemini-Mesos.

```shell
git clone https://github.com/gemini-project/gemini
cd gemini
export GEMINI_CONTRIB=mesos
make
```

Set some environment variables.
The internal IP address of the master may be obtained via `hostname -i`.

```shell
export GEMINI_MASTER_IP=$(hostname -i)
export GEMINI_MASTER=http://${GEMINI_MASTER_IP}:8888
```

Note that GEMINI_MASTER is used as the api endpoint. If you have existing `~/.gem/config` and point to another endpoint, you need to add option `--server=${GEMINI_MASTER}` to gemctl in later steps.

### Deploy etcd

Start etcd and verify that it is running:

```shell
sudo docker run -d --hostname $(uname -n) --name etcd \
  -p 4001:4001 -p 7001:7001 quay.io/coreos/etcd:v2.2.1 \
  --listen-client-urls http://0.0.0.0:4001 \
  --advertise-client-urls http://${GEMINI_MASTER_IP}:4001
```

```shell
$ sudo docker ps
CONTAINER ID   IMAGE                        COMMAND   CREATED   STATUS   PORTS                NAMES
fd7bac9e2301   quay.io/coreos/etcd:v2.2.1   "/etcd"   5s ago    Up 3s    2379/tcp, 2380/...   etcd
```

It's also a good idea to ensure your etcd instance is reachable by testing it

```shell
curl -L http://${GEMINI_MASTER_IP}:4001/v2/keys/
```

If connectivity is OK, you will see an output of the available keys in etcd (if any).

### Start Gemini-Mesos Services

Update your PATH to more easily run the Gemini-Mesos binaries:

```shell
export PATH="$(pwd)/_output/local/go/bin:$PATH"
```

Identify your Mesos master: depending on your Mesos installation this is either a `host:port` like `mesos-master:5050` or a ZooKeeper URL like `zk://zookeeper:2181/mesos`.
In order to let Gemini survive Mesos master changes, the ZooKeeper URL is recommended for production environments.

```shell
export MESOS_MASTER=<host:port or zk:// url>
```

Create a cloud config file `mesos-cloud.conf` in the current directory with the following contents:

```shell
$ cat <<EOF >mesos-cloud.conf
[mesos-cloud]
        mesos-master        = ${MESOS_MASTER}
EOF
```

Now start the gemini-mesos API server, controller manager, and scheduler on the master node:

```shell
$ km apiserver \
  --address=${GEMINI_MASTER_IP} \
  --etcd-servers=http://${GEMINI_MASTER_IP}:4001 \
  --service-cluster-ip-range=10.10.10.0/24 \
  --port=8888 \
  --cloud-provider=mesos \
  --cloud-config=mesos-cloud.conf \
  --secure-port=0 \
  --v=1 >apiserver.log 2>&1 &

$ km controller-manager \
  --master=${GEMINI_MASTER_IP}:8888 \
  --cloud-provider=mesos \
  --cloud-config=./mesos-cloud.conf  \
  --v=1 >controller.log 2>&1 &

$ km scheduler \
  --address=${GEMINI_MASTER_IP} \
  --mesos-master=${MESOS_MASTER} \
  --etcd-servers=http://${GEMINI_MASTER_IP}:4001 \
  --mesos-user=root \
  --api-servers=${GEMINI_MASTER_IP}:8888 \
  --cluster-dns=10.10.10.10 \
  --cluster-domain=cluster.local \
  --v=2 >scheduler.log 2>&1 &
```

Disown your background jobs so that they'll stay running if you log out.

```shell
disown -a
```

#### Validate KM Services

Interact with the gemini-mesos framework via `gemctl`:

```shell
$ gemctl get pods
NAME      READY     STATUS    RESTARTS   AGE
```

```shell
# NOTE: your service IPs will likely differ
$ gemctl get services
NAME             LABELS                                    SELECTOR   IP(S)          PORT(S)
gemm-scheduler   component=scheduler,provider=gemm         <none>     10.10.10.113   10251/TCP
gemini       component=apiserver,provider=gemini   <none>     10.10.10.1     443/TCP
```

Lastly, look for Gemini in the Mesos web GUI by pointing your browser to
`http://<mesos-master-ip:port>`. Make sure you have an active VPN connection.
Go to the Frameworks tab, and look for an active framework named "Gemini".

## Spin up a pod

Write a JSON pod description to a local file:

```shell
$ cat <<EOPOD >nginx.yaml
```

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx
spec:
  containers:
  - name: nginx
    image: nginx
    ports:
    - containerPort: 80
EOPOD
```

Send the pod description to Gemini using the `gemctl` CLI:

```shell
$ gemctl create -f ./nginx.yaml
pods/nginx
```

Wait a minute or two while `dockerd` downloads the image layers from the internet.
We can use the `gemctl` interface to monitor the status of our pod:

```shell
$ gemctl get pods
NAME      READY     STATUS    RESTARTS   AGE
nginx     1/1       Running   0          14s
```

Verify that the pod task is running in the Mesos web GUI. Click on the
Gemini framework. The next screen should show the running Mesos task that
started the Gemini pod.

## Launching gem-dns

Gem-dns is an addon for Gemini which adds DNS-based service discovery to the cluster. For a detailed explanation see [DNS in Gemini][4].

The gem-dns addon runs as a pod inside the cluster. The pod consists of three co-located containers:

- a local etcd instance
- the [skydns][11] DNS server
- the gem2sky process to glue skydns to the state of the Gemini cluster.

The skydns container offers DNS service via port 53 to the cluster. The etcd communication works via local 127.0.0.1 communication

We assume that gem-dns will use

- the service IP `10.10.10.10`
- and the `cluster.local` domain.

Note that we have passed these two values already as parameter to the apiserver above.

A template for an replication controller spinning up the pod with the 3 containers can be found at [cluster/addons/dns/skydns-rc.yaml.in][11] in the repository. The following steps are necessary in order to get a valid replication controller yaml file:

- replace `{{ pillar['dns_replicas'] }}`  with `1`
- replace `{{ pillar['dns_domain'] }}` with `cluster.local.`
- add `--gem_master_url=${GEMINI_MASTER}` parameter to the gem2sky container command.

In addition the service template at [cluster/addons/dns/skydns-svc.yaml.in][12] needs the following replacement:

- `{{ pillar['dns_server'] }}` with `10.10.10.10`.

To do this automatically:

```shell
sed -e "s/{{ pillar\['dns_replicas'\] }}/1/g;"\
"s,\(command = \"/gem2sky\"\),\\1\\"$'\n'"        - --gem_master_url=${GEMINI_MASTER},;"\
"s/{{ pillar\['dns_domain'\] }}/cluster.local/g" \
  cluster/addons/dns/skydns-rc.yaml.in > skydns-rc.yaml
sed -e "s/{{ pillar\['dns_server'\] }}/10.10.10.10/g" \
  cluster/addons/dns/skydns-svc.yaml.in > skydns-svc.yaml
```

Now the gem-dns pod and service are ready to be launched:

```shell
gemctl create -f ./skydns-rc.yaml
gemctl create -f ./skydns-svc.yaml
```

Check with `gemctl get pods --namespace=gem-system` that 3/3 containers of the pods are eventually up and running. Note that the gem-dns pods run in the `gem-system` namespace, not in  `default`.

To check that the new DNS service in the cluster works, we start a busybox pod and use that to do a DNS lookup. First create the `busybox.yaml` pod spec:

```shell
cat <<EOF >busybox.yaml
```

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: busybox
  namespace: default
spec:
  containers:
  - image: busybox
    command:
      - sleep
      - "3600"
    imagePullPolicy: IfNotPresent
    name: busybox
  restartPolicy: Always
EOF
```

Then start the pod:

```shell
gemctl create -f ./busybox.yaml
```

When the pod is up and running, start a lookup for the Gemini master service, made available on 10.10.10.1 by default:

```shell
gemctl  exec busybox -- nslookup gemini
```

If everything works fine, you will get this output:

```shell
Server:    10.10.10.10
Address 1: 10.10.10.10

Name:      gemini
Address 1: 10.10.10.1
```

## What next?

Try out some of the standard [Gemini examples][9].

Read about Gemini on Mesos' architecture in the [contrib directory][13].

**NOTE:** Some examples require Gemini DNS to be installed on the cluster.
Future work will add instructions to this guide to enable support for Gemini DNS.

**NOTE:** Please be aware that there are [known issues with the current Gemini-Mesos implementation][7].

[1]: http://mesosphere.com/docs/tutorials/run-hadoop-on-mesos-using-installer
[2]: http://mesosphere.com/docs/tutorials/run-spark-on-mesos
[3]: http://mesosphere.com/docs/tutorials/run-chronos-on-mesos
[4]: https://releases.gem.io/{{page.githubbranch}}/cluster/addons/dns/README.md
[5]: http://open.mesosphere.com/getting-started/cloud/google/mesosphere/
[6]: http://mesos.apache.org/
[7]: https://releases.gem.io/{{page.githubbranch}}/contrib/mesos/docs/issues.md
[8]: https://github.com/mesosphere/gemini-mesos/issues
[9]: https://github.com/gemini-project/gemini/tree/{{page.githubbranch}}/examples
[10]: http://open.mesosphere.com/getting-started/cloud/google/mesosphere/#vpn-setup
[11]: https://releases.gem.io/{{page.githubbranch}}/cluster/addons/dns/skydns-rc.yaml.in
[12]: https://releases.gem.io/{{page.githubbranch}}/cluster/addons/dns/skydns-svc.yaml.in
[13]: https://releases.gem.io/{{page.githubbranch}}/contrib/mesos/README.md