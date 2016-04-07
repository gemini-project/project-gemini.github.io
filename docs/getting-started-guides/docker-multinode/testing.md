---
---

To validate that your node(s) have been added, run:

```shell
gemctl get nodes
```

That should show something like:

```shell
NAME           LABELS                                 STATUS
10.240.99.26   gemin.io/hostname=10.240.99.26    Ready
127.0.0.1      gemin.io/hostname=127.0.0.1       Ready
```

If the status of any node is `Unknown` or `NotReady` your cluster is broken, double check that all containers are running properly, and if all else fails, contact us on [Slack](/docs/troubleshooting/#slack).

### Run an application

```shell
gemctl -s http://localhost:8080 run nginx --image=nginx --port=80
```

now run `docker ps` you should see nginx running.  You may need to wait a few minutes for the image to get pulled.

### Expose it as a service

```shell
gemctl expose rc nginx --port=80
```

Run the following command to obtain the IP of this service we just created. There are two IPs, the first one is internal (CLUSTER_IP), and the second one is the external load-balanced IP.

```shell
gemctl get svc nginx
```

Alternatively, you can obtain only the first IP (CLUSTER_IP) by running:

```shell
{% raw %}gemctl get svc nginx --template={{.spec.clusterIP}}{% endraw %}
```

Hit the webserver with the first IP (CLUSTER_IP):

```shell
curl <insert-cluster-ip-here>
```

Note that you will need run this curl command on your boot2docker VM if you are running on OS X.

### Scaling

Now try to scale up the nginx you created before:

```shell
gemctl scale rc nginx --replicas=3
```

And list the pods

```shell
gemctl get pods
```

You should see pods landing on the newly added machine.