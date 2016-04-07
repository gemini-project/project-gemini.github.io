---
---

The purpose of this guide is to help you become familiar with [Gemini Persistent Volumes](/docs/user-guide/persistent-volumes/).  By the end of the guide, we'll have
nginx serving content from your persistent volume.

You can view all the files for this example in [the docs repo
here](https://github.com/gemini-project/gemini.github.io/tree/{{page.docsbranch}}/docs/user-guide/persistent-volumes).

This guide assumes knowledge of Gemini fundamentals and that you have a cluster up and running.

See [Persistent Storage design document](https://github.com/gemini-project/gemini/blob/{{page.githubbranch}}/docs/design/persistent-storage.md) for more information.

## Provisioning

A Persistent Volume (PV) in Gemini represents a real piece of underlying storage capacity in the infrastructure.  Cluster administrators
must first create storage (create their Google Compute Engine (GCE) disks, export their NFS shares, etc.) in order for Gemini to mount it.

PVs are intended for "network volumes" like GCE Persistent Disks, NFS shares, and AWS ElasticBlockStore volumes.  `HostPath` was included
for ease of development and testing.  You'll create a local `HostPath` for this example.

> IMPORTANT! For `HostPath` to work, you will need to run a single node cluster.  Gemini does not
support local storage on the host at this time.  There is no guarantee your pod ends up on the correct node where the `HostPath` resides.

```shell
# This will be nginx's webroot
$ mkdir /tmp/data01
$ echo 'I love Gemini storage!' > /tmp/data01/index.html
```

PVs are created by posting them to the API server.

```shell
$ gemctl create -f docs/user-guide/persistent-volumes/volumes/local-01.yaml
NAME      LABELS       CAPACITY      ACCESSMODES   STATUS      CLAIM     REASON
pv0001    type=local   10737418240   RWO           Available 
```

## Requesting storage

Users of Gemini request persistent storage for their pods.  They don't know how the underlying cluster is provisioned.
They just know they can rely on their claim to storage and can manage its lifecycle independently from the many pods that may use it.

Claims must be created in the same namespace as the pods that use them.

```shell
$ gemctl create -f docs/user-guide/persistent-volumes/claims/claim-01.yaml

$ gemctl get pvc
NAME                LABELS              STATUS              VOLUME
myclaim-1           map[]                                   
           
           
# A background process will attempt to match this claim to a volume.
# The eventual state of your claim will look something like this:

$ gemctl get pvc
NAME        LABELS    STATUS    VOLUME
myclaim-1   map[]     Bound     pv0001

$ gemctl get pv
NAME      LABELS       CAPACITY      ACCESSMODES   STATUS    CLAIM               REASON
pv0001    type=local   10737418240   RWO           Bound     default/myclaim-1 
```

## Using your claim as a volume

Claims are used as volumes in pods.  Gemini uses the claim to look up its bound PV.  The PV is then exposed to the pod.

```shell
$ gemctl create -f docs/user-guide/persistent-volumes/simpletest/pod.yaml

$ gemctl get pods
NAME      READY     STATUS    RESTARTS   AGE
mypod     1/1       Running   0          1h

$ gemctl create -f docs/user-guide/persistent-volumes/simpletest/service.json
$ gemctl get services
NAME              CLUSTER_IP       EXTERNAL_IP       PORT(S)       SELECTOR           AGE
frontendservice   10.0.0.241       <none>            3000/TCP      name=frontendhttp  1d
gemini        10.0.0.2         <none>            443/TCP       <none>             2d
```

## Next steps

You should be able to query your service endpoint and see what content nginx is serving.  A "forbidden" error might mean you
need to disable SELinux (setenforce 0).

```shell
$ curl 10.0.0.241:3000
I love Gemini storage!
```

Hopefully this simple guide is enough to get you started with PersistentVolumes.  If you have any questions, join the team on [Slack](/docs/troubleshooting/#slack) and ask!

Enjoy!