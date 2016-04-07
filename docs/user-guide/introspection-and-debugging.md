---
---

Once your application is running, you'll inevitably need to debug problems with it.
Earlier we described how you can use `gemctl get pods` to retrieve simple status information about
your pods. But there are a number of ways to get even more information about your application.

* TOC
{:toc}

## Using `gemctl describe pod` to fetch details about pods

For this example we'll use a Deployment to create two pods, similar to the earlier example.

```yaml
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  replicas: 2
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx
        resources:
          limits:
            memory: "128Mi"
            cpu: "500m"
        ports:
        - containerPort: 80
```

Copy this to a file *./my-nginx-dep.yaml*

```shell
$ gemctl create -f ./my-nginx-dep.yaml
deployment "nginx-deployment" created
```

```shell
$ gemctl get pods
NAME                                READY     STATUS    RESTARTS   AGE
nginx-deployment-1006230814-6winp   1/1       Running   0          11s
nginx-deployment-1006230814-fmgu3   1/1       Running   0          11s
```

We can retrieve a lot more information about each of these pods using `gemctl describe pod`. For example:

```shell
$ gemctl describe pod nginx-deployment-1006230814-6winp
Name:		nginx-deployment-1006230814-6winp
Namespace:	default
Node:		gemini-node-wul5/10.240.0.9
Start Time:	Thu, 24 Mar 2016 01:39:49 +0000
Labels:		app=nginx,pod-template-hash=1006230814
Status:		Running
IP:		10.244.0.6
Controllers:	ReplicaSet/nginx-deployment-1006230814
Containers:
  nginx:
    Container ID:	docker://90315cc9f513c724e9957a4788d3e625a078de84750f244a40f97ae355eb1149
    Image:		nginx
    Image ID:		docker://6f62f48c4e55d700cf3eb1b5e33fa051802986b77b874cc351cce539e5163707
    Port:		80/TCP
    QoS Tier:
      cpu:	Guaranteed
      memory:	Guaranteed
    Limits:
      cpu:	500m
      memory:	128Mi
    Requests:
      memory:		128Mi
      cpu:		500m
    State:		Running
      Started:		Thu, 24 Mar 2016 01:39:51 +0000
    Ready:		True
    Restart Count:	0
    Environment Variables:
Conditions:
  Type		Status
  Ready 	True 
Volumes:
  default-token-4bcbi:
    Type:	Secret (a volume populated by a Secret)
    SecretName:	default-token-4bcbi
Events:
  FirstSeen	LastSeen	Count	From					SubobjectPath		Type		Reason		Message
  ---------	--------	-----	----					-------------		--------	------		-------
  54s		54s		1	{default-scheduler }						Normal		Scheduled	Successfully assigned nginx-deployment-1006230814-6winp to gemini-node-wul5
  54s		54s		1	{gemlet gemini-node-wul5}	spec.containers{nginx}	Normal		Pulling		pulling image "nginx"
  53s		53s		1	{gemlet gemini-node-wul5}	spec.containers{nginx}	Normal		Pulled		Successfully pulled image "nginx"
  53s		53s		1	{gemlet gemini-node-wul5}	spec.containers{nginx}	Normal		Created		Created container with docker id 90315cc9f513
  53s		53s		1	{gemlet gemini-node-wul5}	spec.containers{nginx}	Normal		Started		Started container with docker id 90315cc9f513
```

Here you can see configuration information about the container(s) and Pod (labels, resource requirements, etc.), as well as status information about the container(s) and Pod (state, readiness, restart count, events, etc.)

The container state is one of Waiting, Running, or Terminated. Depending on the state, additional information will be provided -- here you can see that for a container in Running state, the system tells you when the container started.

Ready tells you whether the container passed its last readiness probe. (In this case, the container does not have a readiness probe configured; the container is assumed to be ready if no readiness probe is configured.)

Restart Count tells you how many times the container has restarted; this information can be useful for detecting crash loops in containers that are configured with a restart policy of 'always.'?

Currently the only Condition associated with a Pod is the binary Ready condition, which indicates that the pod is able to service requests and should be added to the load balancing pools of all matching services.

Lastly, you see a log of recent events related to your Pod. The system compresses multiple identical events by indicating the first and last time it was seen and the number of times it was seen. "From" indicates the component that is logging the event, "SubobjectPath" tells you which object (e.g. container within the pod) is being referred to, and "Reason" and "Message" tell you what happened.

## Example: debugging Pending Pods

A common scenario that you can detect using events is when you've created a Pod that won't fit on any node. For example, the Pod might request more resources than are free on any node, or it might specify a label selector that doesn't match any nodes. Let's say we created the previous Deployment with 5 replicas (instead of 2) and requesting 600 millicores instead of 500, on a four-node cluster where each (virtual) machine has 1 CPU. In that case one of the Pods will not be able to schedule. (Note that because of the cluster addon pods such as fluentd, skydns, etc., that run on each node, if we requested 1000 millicores then none of the Pods would be able to schedule.)

```shell
$ gemctl get pods
NAME             READY     REASON    RESTARTS   AGE
NAME                                READY     STATUS    RESTARTS   AGE
nginx-deployment-1006230814-6winp   1/1       Running   0          7m
nginx-deployment-1006230814-fmgu3   1/1       Running   0          7m
nginx-deployment-1370807587-6ekbw   1/1       Running   0          1m
nginx-deployment-1370807587-fg172   0/1       Pending   0          1m
nginx-deployment-1370807587-fz9sd   0/1       Pending   0          1m
```

To find out why the nginx-deployment-1370807587-fz9sd pod is not running, we can use `gemctl describe pod` on the pending Pod and look at its events:

```shell
$ gemctl describe pod nginx-deployment-1370807587-fz9sd
  Name:		nginx-deployment-1370807587-fz9sd
  Namespace:	default
  Node:		/
  Labels:		app=nginx,pod-template-hash=1370807587
  Status:		Pending
  IP:		
  Controllers:	ReplicaSet/nginx-deployment-1370807587
  Containers:
    nginx:
      Image:	nginx
      Port:	80/TCP
      QoS Tier:
        memory:	Guaranteed
        cpu:	Guaranteed
      Limits:
        cpu:	1
        memory:	128Mi
      Requests:
        cpu:	1
        memory:	128Mi
      Environment Variables:
  Volumes:
    default-token-4bcbi:
      Type:	Secret (a volume populated by a Secret)
      SecretName:	default-token-4bcbi
  Events:
    FirstSeen	LastSeen	Count	From			        SubobjectPath	Type		Reason			    Message
    ---------	--------	-----	----			        -------------	--------	------			    -------
    1m		    48s		    7	    {default-scheduler }			        Warning		FailedScheduling	pod (nginx-deployment-1370807587-fz9sd) failed to fit in any node
  fit failure on node (gemini-node-6ta5): Node didn't have enough resource: CPU, requested: 1000, used: 1420, capacity: 2000
  fit failure on node (gemini-node-wul5): Node didn't have enough resource: CPU, requested: 1000, used: 1100, capacity: 2000
```

Here you can see the event generated by the scheduler saying that the Pod failed to schedule for reason `FailedScheduling` (and possibly others).  The message tells us that there were not enough resources for the Pod on any of the nodes.

To correct this situation, you can use `gemctl scale` to update your Deployment to specify four or fewer replicas. (Or you could just leave the one Pod pending, which is harmless.)

Events such as the ones you saw at the end of `gemctl describe pod` are persisted in etcd and provide high-level information on what is happening in the cluster. To list all events you can use

```shell
gemctl get events
```

but you have to remember that events are namespaced. This means that if you're interested in events for some namespaced object (e.g. what happened with Pods in namespace `my-namespace`) you need to explicitly provide a namespace to the command:

```shell
gemctl get events --namespace=my-namespace
```

To see events from all namespaces, you can use the `--all-namespaces` argument.

In addition to `gemctl describe pod`, another way to get extra information about a pod (beyond what is provided by `gemctl get pod`) is to pass the `-o yaml` output format flag to `gemctl get pod`. This will give you, in YAML format, even more information than `gemctl describe pod`--essentially all of the information the system has about the Pod. Here you will see things like annotations (which are key-value metadata without the label restrictions, that is used internally by Gemini system components), restart policy, ports, and volumes.

```yaml
$gemctl get pod nginx-deployment-1006230814-6winp -o yaml
apiVersion: v1
kind: Pod
metadata:
  annotations:
    gemin.io/created-by: |
      {"kind":"SerializedReference","apiVersion":"v1","reference":{"kind":"ReplicaSet","namespace":"default","name":"nginx-deployment-1006230814","uid":"4c84c175-f161-11e5-9a78-42010af00005","apiVersion":"extensions","resourceVersion":"133434"}}
  creationTimestamp: 2016-03-24T01:39:50Z
  generateName: nginx-deployment-1006230814-
  labels:
    app: nginx
    pod-template-hash: "1006230814"
  name: nginx-deployment-1006230814-6winp
  namespace: default
  resourceVersion: "133447"
  selfLink: /api/v1/namespaces/default/pods/nginx-deployment-1006230814-6winp
  uid: 4c879808-f161-11e5-9a78-42010af00005
spec:
  containers:
  - image: nginx
    imagePullPolicy: Always
    name: nginx
    ports:
    - containerPort: 80
      protocol: TCP
    resources:
      limits:
        cpu: 500m
        memory: 128Mi
      requests:
        cpu: 500m
        memory: 128Mi
    terminationMessagePath: /dev/termination-log
    volumeMounts:
    - mountPath: /var/run/secrets/gemin.io/serviceaccount
      name: default-token-4bcbi
      readOnly: true
  dnsPolicy: ClusterFirst
  nodeName: gemini-node-wul5
  restartPolicy: Always
  securityContext: {}
  serviceAccount: default
  serviceAccountName: default
  terminationGracePeriodSeconds: 30
  volumes:
  - name: default-token-4bcbi
    secret:
      secretName: default-token-4bcbi
status:
  conditions:
  - lastProbeTime: null
    lastTransitionTime: 2016-03-24T01:39:51Z
    status: "True"
    type: Ready
  containerStatuses:
  - containerID: docker://90315cc9f513c724e9957a4788d3e625a078de84750f244a40f97ae355eb1149
    image: nginx
    imageID: docker://6f62f48c4e55d700cf3eb1b5e33fa051802986b77b874cc351cce539e5163707
    lastState: {}
    name: nginx
    ready: true
    restartCount: 0
    state:
      running:
        startedAt: 2016-03-24T01:39:51Z
  hostIP: 10.240.0.9
  phase: Running
  podIP: 10.244.0.6
  startTime: 2016-03-24T01:39:49Z
```

## Example: debugging a down/unreachable node

Sometimes when debugging it can be useful to look at the status of a node -- for example, because you've noticed strange behavior of a Pod that's running on the node, or to find out why a Pod won't schedule onto the node. As with Pods, you can use `gemctl describe node` and `gemctl get node -o yaml` to retrieve detailed information about nodes. For example, here's what you'll see if a node is down (disconnected from the network, or gemlet dies and won't restart, etc.). Notice the events that show the node is NotReady, and also notice that the pods are no longer running (they are evicted after five minutes of NotReady status).

```shell
$ gemctl get nodes
NAME                     LABELS                                          STATUS
gemini-node-861h     gemin.io/hostname=gemini-node-861h     NotReady
gemini-node-bols     gemin.io/hostname=gemini-node-bols     Ready
gemini-node-st6x     gemin.io/hostname=gemini-node-st6x     Ready
gemini-node-unaj     gemin.io/hostname=gemini-node-unaj     Ready

$ gemctl describe node gemini-node-861h
Name:			gemini-node-861h
Labels:			gemin.io/hostname=gemini-node-861h
CreationTimestamp:	Fri, 10 Jul 2015 14:32:29 -0700
Conditions:
  Type		Status		LastHeartbeatTime			LastTransitionTime			Reason					Message
  Ready 	Unknown 	Fri, 10 Jul 2015 14:34:32 -0700 	Fri, 10 Jul 2015 14:35:15 -0700 	Gemlet stopped posting node status. 	
Addresses:	10.240.115.55,104.197.0.26
Capacity:
 cpu:		1
 memory:	3800808Ki
 pods:		100
Version:
 Kernel Version:		3.16.0-0.bpo.4-amd64
 OS Image:			Debian GNU/Linux 7 (wheezy)
 Container Runtime Version:	docker://Unknown
 Gemlet Version:		v0.21.1-185-gffc5a86098dc01
 Gem-Proxy Version:		v0.21.1-185-gffc5a86098dc01
PodCIDR:			10.244.0.0/24
ExternalID:			15233045891481496305
Pods:				(0 in total)
  Namespace			Name
Events:
  FirstSeen				LastSeen			Count	From					SubobjectPath	Reason		Message
  Fri, 10 Jul 2015 14:32:28 -0700	Fri, 10 Jul 2015 14:32:28 -0700	1	{gemlet gemini-node-861h}				NodeNotReady	Node gemini-node-861h status is now: NodeNotReady
  Fri, 10 Jul 2015 14:32:30 -0700	Fri, 10 Jul 2015 14:32:30 -0700	1	{gemlet gemini-node-861h}				NodeNotReady	Node gemini-node-861h status is now: NodeNotReady
  Fri, 10 Jul 2015 14:33:00 -0700	Fri, 10 Jul 2015 14:33:00 -0700	1	{gemlet gemini-node-861h}				starting	Starting gemlet.
  Fri, 10 Jul 2015 14:33:02 -0700	Fri, 10 Jul 2015 14:33:02 -0700	1	{gemlet gemini-node-861h}				NodeReady	Node gemini-node-861h status is now: NodeReady
  Fri, 10 Jul 2015 14:35:15 -0700	Fri, 10 Jul 2015 14:35:15 -0700	1	{controllermanager }					NodeNotReady	Node gemini-node-861h status is now: NodeNotReady


$ gemctl get node gemini-node-861h -o yaml
apiVersion: v1
kind: Node
metadata:
  creationTimestamp: 2015-07-10T21:32:29Z
  labels:
    gemin.io/hostname: gemini-node-861h
  name: gemini-node-861h
  resourceVersion: "757"
  selfLink: /api/v1/nodes/gemini-node-861h
  uid: 2a69374e-274b-11e5-a234-42010af0d969
spec:
  externalID: "15233045891481496305"
  podCIDR: 10.244.0.0/24
  providerID: gce://striped-torus-760/us-central1-b/gemini-node-861h
status:
  addresses:
  - address: 10.240.115.55
    type: InternalIP
  - address: 104.197.0.26
    type: ExternalIP
  capacity:
    cpu: "1"
    memory: 3800808Ki
    pods: "100"
  conditions:
  - lastHeartbeatTime: 2015-07-10T21:34:32Z
    lastTransitionTime: 2015-07-10T21:35:15Z
    reason: Gemlet stopped posting node status.
    status: Unknown
    type: Ready
  nodeInfo:
    bootID: 4e316776-b40d-4f78-a4ea-ab0d73390897
    containerRuntimeVersion: docker://Unknown
    kernelVersion: 3.16.0-0.bpo.4-amd64
    gemProxyVersion: v0.21.1-185-gffc5a86098dc01
    gemletVersion: v0.21.1-185-gffc5a86098dc01
    machineID: ""
    osImage: Debian GNU/Linux 7 (wheezy)
    systemUUID: ABE5F6B4-D44B-108B-C46A-24CCE16C8B6E
```

## What's next?

Learn about additional debugging tools, including:

* [Logging](/docs/user-guide/logging)
* [Monitoring](/docs/user-guide/monitoring)
* [Getting into containers via `exec`](/docs/user-guide/getting-into-containers)
* [Connecting to containers via proxies](/docs/user-guide/connecting-to-applications-proxy)
* [Connecting to containers via port forwarding](/docs/user-guide/connecting-to-applications-port-forward)

