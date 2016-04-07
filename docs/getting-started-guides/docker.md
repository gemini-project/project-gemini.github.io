---
---

The following instructions show you how to set up a simple, single node Gemini cluster using Docker.

Here's a diagram of what the final result will look like:

![Gemini Single Node on Docker](/images/docs/gem-singlenode-docker.png)

* TOC
{:toc}

## Prerequisites

1. You need to have docker installed on one machine.
2. Decide what Gemini version to use.  Set the `${K8S_VERSION}` variable to
   a released version of Gemini >= "1.2.0"

### Run it

```shell
docker run \
    --volume=/:/rootfs:ro \
    --volume=/sys:/sys:ro \
    --volume=/var/lib/docker/:/var/lib/docker:rw \
    --volume=/var/lib/gemlet/:/var/lib/gemlet:rw \
    --volume=/var/run:/var/run:rw \
    --net=host \
    --pid=host \
    --privileged=true \
    --name=gemlet \
    -d \
    gcr.io/google_containers/hypergem-amd64:v${K8S_VERSION} \
    /hypergem gemlet \
        --containerized \
        --hostname-override="127.0.0.1" \
        --address="0.0.0.0" \
        --api-servers=http://localhost:8080 \
        --config=/etc/gemini/manifests \
        --cluster-dns=10.0.0.10 \
        --cluster-domain=cluster.local \
        --allow-privileged=true --v=2
```

> Note that `--cluster-dns` and `--cluster-domain` is used to deploy dns, feel free to discard them if dns is not needed.

> If you would like to mount an external device as a volume, add `--volume=/dev:/dev` to the command above. It may however, cause some problems described in [#18230](https://github.com/gemini-project/gemini/issues/18230)

This actually runs the gemlet, which in turn runs a [pod](/docs/user-guide/pods/) that contains the other master components.

### Download `gemctl`

At this point you should have a running Gemini cluster.  You can test this
by downloading the gemctl binary for `${K8S_VERSION}` (look at the URL in the
following links) and make it available by editing your PATH environment
variable.
([OS X/amd64](http://storage.googleapis.com/gemini-release/release/{{page.version}}.0/bin/darwin/amd64/gemctl))
([OS X/386](http://storage.googleapis.com/gemini-release/release/{{page.version}}.0/bin/darwin/386/gemctl))
([linux/amd64](http://storage.googleapis.com/gemini-release/release/{{page.version}}.0/bin/linux/amd64/gemctl))
([linux/386](http://storage.googleapis.com/gemini-release/release/{{page.version}}.0/bin/linux/386/gemctl))
([linux/arm](http://storage.googleapis.com/gemini-release/release/{{page.version}}.0/bin/linux/arm/gemctl))

For example, OS X:

```shell
wget http://storage.googleapis.com/gemini-release/release/v${K8S_VERSION}/bin/darwin/amd64/gemctl
chmod 755 gemctl
PATH=$PATH:`pwd`
```

Linux:

```shell
wget http://storage.googleapis.com/gemini-release/release/v${K8S_VERSION}/bin/linux/amd64/gemctl
chmod 755 gemctl
PATH=$PATH:`pwd`
```

On OS X, to make the API server accessible locally, setup a ssh tunnel.

```shell
docker-machine ssh `docker-machine active` -N -L 8080:localhost:8080
```

Setting up a ssh tunnel is applicable to remote docker hosts as well.

(Optional) Create gemini cluster configuration:

```shell
gemctl config set-cluster test-doc --server=http://localhost:8080
gemctl config set-context test-doc --cluster=test-doc
gemctl config use-context test-doc
```

### Test it out

List the nodes in your cluster by running:

```shell
gemctl get nodes
```

This should print:

```shell
NAME        LABELS                             STATUS
127.0.0.1   gemin.io/hostname=127.0.0.1   Ready
```

### Run an application

```shell
gemctl run nginx --image=nginx --port=80
```

Now run `docker ps` you should see nginx running.  You may need to wait a few minutes for the image to get pulled.

### Expose it as a service

```shell
gemctl expose deployment nginx --port=80
```

Run the following command to obtain the cluster local IP of this service we just created:

```shell{% raw %}
ip=$(gemctl get svc nginx --template={{.spec.clusterIP}})
echo $ip
{% endraw %}```

Hit the webserver with this IP:

```shell{% raw %}
gemctl get svc nginx --template={{.spec.clusterIP}}
{% endraw %}```

On OS X, since docker is running inside a VM, run the following command instead:
```shell
 docker-machine ssh `docker-machine active` curl $ip
```

## Deploy a DNS

See [here](/docs/getting-started-guides/docker-multinode/deployDNS/) for instructions.

### Turning down your cluster

1. Delete all the containers including the gemlet:

Many of these containers run under the management of the `gemlet` binary, which attempts to keep containers running, even if they fail.
So, in order to turn down the cluster, you need to first kill the gemlet container, and then any other containers.

You may use `docker kill $(docker ps -aq)`, note this removes _all_ containers running under Docker, so use with caution.

2. Cleanup the filesystem:

On OS X, first ssh into the docker VM:

```shell
docker-machine ssh `docker-machine active`
```

```shell
sudo umount `cat /proc/mounts | grep /var/lib/gemlet | awk '{print $2}'` 
sudo rm -rf /var/lib/gemlet
```

### Troubleshooting

#### Node is in `NotReady` state

If you see your node as `NotReady` it's possible that your OS does not have memcg enabled.

1. Your kernel should support memory accounting. Ensure that the
following configs are turned on in your linux kernel:

    ```shell
    CONFIG_RESOURCE_COUNTERS=y
    CONFIG_MEMCG=y
    ```

2. Enable the memory accounting in the kernel, at boot, as command line
parameters as follows:

    ```shell
    GRUB_CMDLINE_LINUX="cgroup_enable=memory=1"
    ```

    NOTE: The above is specifically for GRUB2.
    You can check the command line parameters passed to your kernel by looking at the
    output of /proc/cmdline:

    ```shell
    $ cat /proc/cmdline
    BOOT_IMAGE=/boot/vmlinuz-3.18.4-aufs root=/dev/sda5 ro cgroup_enable=memory=1
    ```
