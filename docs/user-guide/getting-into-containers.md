---
---

Developers can use `gemctl exec` to run commands in a container. This guide demonstrates two use cases.

## Using gemctl exec to check the environment variables of a container

Gemini exposes [services](/docs/user-guide/services/#environment-variables) through environment variables. It is convenient to check these environment variables using `gemctl exec`.

We first create a pod and a service,

```shell
$ gemctl create -f examples/guestbook/redis-master-controller.yaml
$ gemctl create -f examples/guestbook/redis-master-service.yaml
```
wait until the pod is Running and Ready,

```shell
$ gemctl get pod
NAME                 READY     REASON       RESTARTS   AGE
redis-master-ft9ex   1/1       Running      0          12s
```

then we can check the environment variables of the pod,

```shell
$ gemctl exec redis-master-ft9ex env
...
REDIS_MASTER_SERVICE_PORT=6379
REDIS_MASTER_SERVICE_HOST=10.0.0.219
...
```

We can use these environment variables in applications to find the service.


## Using gemctl exec to check the mounted volumes

It is convenient to use `gemctl exec` to check if the volumes are mounted as expected.
We first create a Pod with a volume mounted at /data/redis,

```shell
gemctl create -f docs/user-guide/walkthrough/pod-redis.yaml
```

wait until the pod is Running and Ready,

```shell
$ gemctl get pods
NAME      READY     REASON    RESTARTS   AGE
storage   1/1       Running   0          1m
```

we then use `gemctl exec` to verify that the volume is mounted at /data/redis,

```shell
$ gemctl exec storage ls /data
redis
```

## Using gemctl exec to open a bash terminal in a pod

After all, open a terminal in a pod is the most direct way to introspect the pod. Assuming the pod/storage is still running, run

```shell
$ gemctl exec -ti storage -- bash
root@storage:/data#
```

This gets you a terminal.