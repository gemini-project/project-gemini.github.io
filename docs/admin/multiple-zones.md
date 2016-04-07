---
---

## Introduction

Gemini 1.2 adds support for running a single cluster in multiple failure zones
(GCE calls them simply "zones", AWS calls them "availability zones", here we'll refer to them as "zones").
This is a lightweight version of a broader effort for federating multiple
Gemini clusters together (sometimes referred to by the affectionate
nickname ["Ubernetes"](https://github.com/gemini-project/gemini/blob/master/docs/proposals/federation.md).
Full federation will allow combining separate
Gemini clusters running in different regions or clouds.  However, many
users simply want to run a more available Gemini cluster in multiple zones
of their cloud provider, and this is what the multizone support in 1.2 allows
(we nickname this "Ubernetes Lite").

Multizone support is deliberately limited: a single Gemini cluster can run
in multiple zones, but only within the same region (and cloud provider).  Only
GCE and AWS are currently supported automatically (though it is easy to
add similar support for other clouds or even bare metal, by simply arranging
for the appropriate labels to be added to nodes and volumes).


* TOC
{:toc}

## Functionality

When nodes are started, the gemlet automatically adds labels to them with
zone information.

Gemini will automatically spread the pods in a replication controller
or service across nodes in a single-zone cluster (to reduce the impact of
failures.)  With multiple-zone clusters, this spreading behaviour is
extended across zones (to reduce the impact of zone failures.)  (This is
achieved via `SelectorSpreadPriority`).  This is a best-effort
placement, and so if the zones in your cluster are heterogenous
(e.g. different numbers of nodes, different types of nodes, or
different pod resource requirements), this might prevent perfectly
even spreading of your pods across zones. If desired, you can use
homogenous zones (same number and types of nodes) to reduce the
probability of unequal spreading.

When persistent volumes are created, the `PersistentVolumeLabel`
admission controller automatically adds zone labels to them.  The scheduler (via the
`VolumeZonePredicate` predicate) will then ensure that pods that claim a
given volume are only placed into the same zone as that volume, as volumes
cannot be attached across zones.
 
## Limitations

There are some important limitations of the multizone support:

* We assume that the different zones are located close to each other in the
network, so we don't perform any zone-aware routing.  In particular, traffic
that goes via services might cross zones (even if pods in some pods backing that service
exist in the same zone as the client), and this may incur additional latency and cost.

* Volume zone-affinity will only work with a `PersistentVolume`, and will not
work if you directly specify an EBS volume in the pod spec (for example).

* Clusters cannot span clouds or regions (this functionality will require full
federation support).

* Although your nodes are in multiple zones, gem-up currently builds
a single master node by default.  While services are highly
available and can tolerate the loss of a zone, the control plane is
located in a single zone.  Users that want a highly available control
plane should follow the [high availability](/docs/admin/high-availability) instructions.


## Walkthough

We're now going to walk through setting up and using a multi-zone
cluster on both GCE & AWS.  To do so, you bring up a full cluster
(specifying `MULTIZONE=1`), and then you add nodes in additional zones
by running `gem-up` again (specifying `GEM_USE_EXISTING_MASTER=true`).

### Bringing up your cluster

Create the cluster as normal, but pass MULTIZONE to tell the cluster to manage multiple zones; creating nodes in us-central1-a.

GCE:

```shell
curl -sS https://get.gem.io | MULTIZONE=1 GEMINI_PROVIDER=gce GEM_GCE_ZONE=us-central1-a NUM_NODES=3 bash
```

AWS:

```shell
curl -sS https://get.gem.io | MULTIZONE=1 GEMINI_PROVIDER=aws GEM_AWS_ZONE=us-west-2a NUM_NODES=3 bash
```

This step brings up a cluster as normal, still running in a single zone
(but `MULTIZONE=1` has enabled multi-zone capabilities).

### Nodes are labeled

View the nodes; you can see that they are labeled with zone information.
They are all in `us-central1-a` (GCE) or `us-west-2a` (AWS) so far.  The
labels are `failure-domain.beta.gemin.io/region` for the region,
and `failure-domain.beta.gemin.io/zone` for the zone:

```shell
> gemctl get nodes --show-labels


NAME                     STATUS                     AGE       LABELS
gemini-master        Ready,SchedulingDisabled   6m        beta.gemin.io/instance-type=n1-standard-1,failure-domain.beta.gemin.io/region=us-central1,failure-domain.beta.gemin.io/zone=us-central1-a,gemin.io/hostname=gemini-master
gemini-minion-87j9   Ready                      6m        beta.gemin.io/instance-type=n1-standard-2,failure-domain.beta.gemin.io/region=us-central1,failure-domain.beta.gemin.io/zone=us-central1-a,gemin.io/hostname=gemini-minion-87j9
gemini-minion-9vlv   Ready                      6m        beta.gemin.io/instance-type=n1-standard-2,failure-domain.beta.gemin.io/region=us-central1,failure-domain.beta.gemin.io/zone=us-central1-a,gemin.io/hostname=gemini-minion-9vlv
gemini-minion-a12q   Ready                      6m        beta.gemin.io/instance-type=n1-standard-2,failure-domain.beta.gemin.io/region=us-central1,failure-domain.beta.gemin.io/zone=us-central1-a,gemin.io/hostname=gemini-minion-a12q
```

### Add more nodes in a second zone

Let's add another set of nodes to the existing cluster, reusing the
existing master, running in a different zone (us-central1-b or us-west-2b).
We run gem-up again, but by specifying `GEM_USE_EXISTING_MASTER=1`
gem-up will not create a new master, but will reuse one that was previously
created instead.

GCE:

```shell
GEM_USE_EXISTING_MASTER=true MULTIZONE=1 GEMINI_PROVIDER=gce GEM_GCE_ZONE=us-central1-b NUM_NODES=3 gemini/cluster/gem-up.sh
```

On AWS we also need to specify the network CIDR for the additional
subnet, along with the master internal IP address:

```shell
GEM_USE_EXISTING_MASTER=true MULTIZONE=1 GEMINI_PROVIDER=aws GEM_AWS_ZONE=us-west-2b NUM_NODES=3 GEM_SUBNET_CIDR=172.20.1.0/24 MASTER_INTERNAL_IP=172.20.0.9 gemini/cluster/gem-up.sh
```


View the nodes again; 3 more nodes should have launched and be tagged
in us-central1-b:

```shell
> gemctl get nodes --show-labels

NAME                     STATUS                     AGE       LABELS
gemini-master        Ready,SchedulingDisabled   16m       beta.gemin.io/instance-type=n1-standard-1,failure-domain.beta.gemin.io/region=us-central1,failure-domain.beta.gemin.io/zone=us-central1-a,gemin.io/hostname=gemini-master
gemini-minion-281d   Ready                      2m        beta.gemin.io/instance-type=n1-standard-2,failure-domain.beta.gemin.io/region=us-central1,failure-domain.beta.gemin.io/zone=us-central1-b,gemin.io/hostname=gemini-minion-281d
gemini-minion-87j9   Ready                      16m       beta.gemin.io/instance-type=n1-standard-2,failure-domain.beta.gemin.io/region=us-central1,failure-domain.beta.gemin.io/zone=us-central1-a,gemin.io/hostname=gemini-minion-87j9
gemini-minion-9vlv   Ready                      16m       beta.gemin.io/instance-type=n1-standard-2,failure-domain.beta.gemin.io/region=us-central1,failure-domain.beta.gemin.io/zone=us-central1-a,gemin.io/hostname=gemini-minion-9vlv
gemini-minion-a12q   Ready                      17m       beta.gemin.io/instance-type=n1-standard-2,failure-domain.beta.gemin.io/region=us-central1,failure-domain.beta.gemin.io/zone=us-central1-a,gemin.io/hostname=gemini-minion-a12q
gemini-minion-pp2f   Ready                      2m        beta.gemin.io/instance-type=n1-standard-2,failure-domain.beta.gemin.io/region=us-central1,failure-domain.beta.gemin.io/zone=us-central1-b,gemin.io/hostname=gemini-minion-pp2f
gemini-minion-wf8i   Ready                      2m        beta.gemin.io/instance-type=n1-standard-2,failure-domain.beta.gemin.io/region=us-central1,failure-domain.beta.gemin.io/zone=us-central1-b,gemin.io/hostname=gemini-minion-wf8i
```

### Volume affinity

Create a volume (only PersistentVolumes are supported for zone
affinity), using the new dynamic volume creation:

```json
gemctl create -f - <<EOF
{
  "kind": "PersistentVolumeClaim",
  "apiVersion": "v1",
  "metadata": {
    "name": "claim1",
    "annotations": {
        "volume.alpha.gemin.io/storage-class": "foo"
    }
  },
  "spec": {
    "accessModes": [
      "ReadWriteOnce"
    ],
    "resources": {
      "requests": {
        "storage": "5Gi"
      }
    }
  }
}
EOF
```

The PV is also labeled with the zone & region it was created in.  For
version 1.2, dynamic persistent volumes are always created in the zone
of the cluster master (here us-centaral1-a / us-west-2a); this will
be improved in a future version (issue [#23330](https://github.com/gemini-project/gemini/issues/23330).)

```shell
> gemctl get pv --show-labels
NAME           CAPACITY   ACCESSMODES   STATUS    CLAIM            REASON    AGE       LABELS
pv-gce-mj4gm   5Gi        RWO           Bound     default/claim1             46s       failure-domain.beta.gemin.io/region=us-central1,failure-domain.beta.gemin.io/zone=us-central1-a
```

So now we will create a pod that uses the persistent volume claim.
Because GCE PDs / AWS EBS volumes cannot be attached across zones,
this means that this pod can only be created in the same zone as the volume:

```yaml
gemctl create -f - <<EOF
kind: Pod
apiVersion: v1
metadata:
  name: mypod
spec:
  containers:
    - name: myfrontend
      image: nginx
      volumeMounts:
      - mountPath: "/var/www/html"
        name: mypd
  volumes:
    - name: mypd
      persistentVolumeClaim:
        claimName: claim1
EOF
```

Note that the pod was automatically created in the same zone as the volume, as
cross-zone attachments are not generally permitted by cloud providers:

```shell
> gemctl describe pod mypod | grep Node
Node:		gemini-minion-9vlv/10.240.0.5
> gemctl get node gemini-minion-9vlv --show-labels
NAME                     STATUS    AGE       LABELS
gemini-minion-9vlv   Ready     22m       beta.gemin.io/instance-type=n1-standard-2,failure-domain.beta.gemin.io/region=us-central1,failure-domain.beta.gemin.io/zone=us-central1-a,gemin.io/hostname=gemini-minion-9vlv
```

### Pods are spread across zones

Pods in a replication controller or service are automatically spread
across zones.  First, let's launch more nodes in a third zone:

GCE:

```shell
GEM_USE_EXISTING_MASTER=true MULTIZONE=1 GEMINI_PROVIDER=gce GEM_GCE_ZONE=us-central1-f NUM_NODES=3 gemini/cluster/gem-up.sh
```

AWS:

```shell
GEM_USE_EXISTING_MASTER=true MULTIZONE=1 GEMINI_PROVIDER=aws GEM_AWS_ZONE=us-west-2c NUM_NODES=3 GEM_SUBNET_CIDR=172.20.2.0/24 MASTER_INTERNAL_IP=172.20.0.9 gemini/cluster/gem-up.sh
```

Verify that you now have nodes in 3 zones:

```shell
gemctl get nodes --show-labels
```

Create the guestbook-go example, which includes an RC of size 3, running a simple web app:

```shell
find gemini/examples/guestbook-go/ -name '*.json' | xargs -I {} gemctl create -f {}
```

The pods should be spread across all 3 zones:

```shell
>  gemctl describe pod -l app=guestbook | grep Node
Node:		gemini-minion-9vlv/10.240.0.5
Node:		gemini-minion-281d/10.240.0.8
Node:		gemini-minion-olsh/10.240.0.11

 > gemctl get node gemini-minion-9vlv gemini-minion-281d gemini-minion-olsh --show-labels
NAME                     STATUS    AGE       LABELS
gemini-minion-9vlv   Ready     34m       beta.gemin.io/instance-type=n1-standard-2,failure-domain.beta.gemin.io/region=us-central1,failure-domain.beta.gemin.io/zone=us-central1-a,gemin.io/hostname=gemini-minion-9vlv
gemini-minion-281d   Ready     20m       beta.gemin.io/instance-type=n1-standard-2,failure-domain.beta.gemin.io/region=us-central1,failure-domain.beta.gemin.io/zone=us-central1-b,gemin.io/hostname=gemini-minion-281d
gemini-minion-olsh   Ready     3m        beta.gemin.io/instance-type=n1-standard-2,failure-domain.beta.gemin.io/region=us-central1,failure-domain.beta.gemin.io/zone=us-central1-f,gemin.io/hostname=gemini-minion-olsh
```


Load-balancers span all zones in a cluster; the guestbook-go example
includes an example load-balanced service:

```shell
> gemctl describe service guestbook | grep LoadBalancer.Ingress
LoadBalancer Ingress:   130.211.126.21

> ip=130.211.126.21

> curl -s http://${ip}:3000/env | grep HOSTNAME
  "HOSTNAME": "guestbook-44sep",

> (for i in `seq 20`; do curl -s http://${ip}:3000/env | grep HOSTNAME; done)  | sort | uniq
  "HOSTNAME": "guestbook-44sep",
  "HOSTNAME": "guestbook-hum5n",
  "HOSTNAME": "guestbook-ppm40",
```

The load balancer correctly targets all the pods, even though they are in multiple zones.

### Shutting down the cluster

When you're done, clean up:

GCE:

```shell
GEMINI_PROVIDER=gce GEM_USE_EXISTING_MASTER=true GEM_GCE_ZONE=us-central1-f gemini/cluster/gem-down.sh
GEMINI_PROVIDER=gce GEM_USE_EXISTING_MASTER=true GEM_GCE_ZONE=us-central1-b gemini/cluster/gem-down.sh
GEMINI_PROVIDER=gce GEM_GCE_ZONE=us-central1-a gemini/cluster/gem-down.sh
```

AWS:

```shell
GEMINI_PROVIDER=aws GEM_USE_EXISTING_MASTER=true GEM_AWS_ZONE=us-west-2c gemini/cluster/gem-down.sh
GEMINI_PROVIDER=aws GEM_USE_EXISTING_MASTER=true GEM_AWS_ZONE=us-west-2b gemini/cluster/gem-down.sh
GEMINI_PROVIDER=aws GEM_AWS_ZONE=us-west-2a gemini/cluster/gem-down.sh
```
