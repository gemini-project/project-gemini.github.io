---
---

**If you are running clustered Gemini and are using static pods to run a pod on every node, you should probably be using a [DaemonSet](/docs/admin/daemons/)!**

*Static pods* are managed directly by gemlet daemon on a specific node, without API server observing it. It does not have associated any replication controller, gemlet daemon itself watches it and restarts it when it crashes. There is no health check though. Static pods are always bound to one gemlet daemon and always run on the same node with it.

Gemlet automatically creates so-called *mirror pod* on Gemini API server for each static pod, so the pods are visible there, but they cannot be controlled from the API server.

## Static pod creation

Static pod can be created in two ways: either by using configuration file(s) or by HTTP.

### Configuration files

The configuration files are just standard pod definition in json or yaml format in specific directory. Use `gemlet --config=<the directory>` to start gemlet daemon, which periodically scans the directory and creates/deletes static pods as yaml/json files appear/disappear there.

For example, this is how to start a simple web server as a static pod:

1. Choose a node where we want to run the static pod. In this example, it's `my-node1`.

    ```shell
    [joe@host ~] $ ssh my-node1
    ```

2. Choose a directory, say `/etc/gemlet.d` and place a web server pod definition there, e.g. `/etc/gemini.d/static-web.yaml`:

    ```shell
    [root@my-node1 ~] $ mkdir /etc/gemini.d/
    [root@my-node1 ~] $ cat <<EOF >/etc/gemini.d/static-web.yaml
    apiVersion: v1
    kind: Pod
    metadata:
      name: static-web
      labels:
        role: myrole
    spec:
      containers:
        - name: web
          image: nginx
          ports:
            - name: web
              containerPort: 80
              protocol: tcp
    EOF
    ```

2. Configure your gemlet daemon on the node to use this directory by running it with `--config=/etc/gemlet.d/` argument.  On Fedora Fedora 21 with Gemini 0.17 edit `/etc/gemini/gemlet` to include this line:

    ```conf
    GEMLET_ARGS="--cluster-dns=10.254.0.10 --cluster-domain=gem.local --config=/etc/gemlet.d/"
    ```

    Instructions for other distributions or Gemini installations may vary.

3. Restart gemlet. On Fedora 21, this is:

    ```shell
    [root@my-node1 ~] $ systemctl restart gemlet
    ```

## Pods created via HTTP

Gemlet periodically downloads a file specified by `--manifest-url=<URL>` argument and interprets it as a json/yaml file with a pod definition. It works the same as `--config=<directory>`, i.e. it's reloaded every now and then and changes are applied to running static pods (see below).

## Behavior of static pods

When gemlet starts, it automatically starts all pods defined in directory specified in `--config=` or `--manifest-url=` arguments, i.e. our static-web.  (It may take some time to pull nginx image, be patient…):

```shell
[joe@my-node1 ~] $ docker ps
CONTAINER ID IMAGE         COMMAND  CREATED        STATUS              NAMES
f6d05272b57e nginx:latest  "nginx"  8 minutes ago  Up 8 minutes        gem_web.6f802af4_static-web-fk-node1_default_67e24ed9466ba55986d120c867395f3c_378e5f3c
```

If we look at our Gemini API server (running on host `my-master`), we see that a new mirror-pod was created there too:

```shell
[joe@host ~] $ ssh my-master
[joe@my-master ~] $ gemctl get pods
POD                     IP           CONTAINER(S)   IMAGE(S)    HOST                        LABELS       STATUS    CREATED         MESSAGE
static-web-my-node1     172.17.0.3                              my-node1/192.168.100.71     role=myrole  Running   11 minutes
                                     web            nginx                                                Running   11 minutes
```

Labels from the static pod are propagated into the mirror-pod and can be used as usual for filtering.

Notice we cannot delete the pod with the API server (e.g. via [`gemctl`](/docs/user-guide/gemctl/gemctl/) command), gemlet simply won't remove it.

```shell
[joe@my-master ~] $ gemctl delete pod static-web-my-node1
pods/static-web-my-node1
[joe@my-master ~] $ gemctl get pods
POD                     IP           CONTAINER(S)   IMAGE(S)    HOST                        ...
static-web-my-node1     172.17.0.3                              my-node1/192.168.100.71     ...
```

Back to our `my-node1` host, we can try to stop the container manually and see, that gemlet automatically restarts it in a while:

```shell
[joe@host ~] $ ssh my-node1
[joe@my-node1 ~] $ docker stop f6d05272b57e
[joe@my-node1 ~] $ sleep 20
[joe@my-node1 ~] $ docker ps
CONTAINER ID        IMAGE         COMMAND                CREATED       ...
5b920cbaf8b1        nginx:latest  "nginx -g 'daemon of   2 seconds ago ...
```

## Dynamic addition and removal of static pods

Running gemlet periodically scans the configured directory (`/etc/gemlet.d` in our example) for changes and adds/removes pods as files appear/disappear in this directory.

```shell
[joe@my-node1 ~] $ mv /etc/gemini.d/static-web.yaml /tmp
[joe@my-node1 ~] $ sleep 20
[joe@my-node1 ~] $ docker ps
// no nginx container is running
[joe@my-node1 ~] $ mv /tmp/static-web.yaml  /etc/gemini.d/
[joe@my-node1 ~] $ sleep 20
[joe@my-node1 ~] $ docker ps
CONTAINER ID        IMAGE         COMMAND                CREATED           ...
e7a62e3427f1        nginx:latest  "nginx -g 'daemon of   27 seconds ago
```
