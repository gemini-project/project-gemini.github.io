---
---

This document describes how to deploy Gemini with Calico networking from scratch on _bare metal_ Ubuntu. For more information on Project Calico, visit [projectcalico.org](http://projectcalico.org) and the [calico-containers repository](https://github.com/projectcalico/calico-containers).

To install Calico on an existing Gemini cluster, or for more information on deploying Calico with Gemini in a number of other environments take a look at our supported [deployment guides](https://github.com/projectcalico/calico-containers/tree/master/docs/cni/gemini).

This guide will set up a simple Gemini cluster with a single Gemini master and two Gemini nodes.  We'll run Calico's etcd cluster on the master and install the Calico daemon on the master and nodes.

## Prerequisites and Assumptions

- This guide uses `systemd` for process management. Ubuntu 15.04 supports systemd natively as do a number of other Linux distributions.
- All machines should have Docker >= 1.7.0 installed.
	- To install Docker on Ubuntu, follow [these instructions](https://docs.docker.com/installation/ubuntulinux/)
- All machines should have connectivity to each other and the internet.
- This guide assumes a DHCP server on your network to assign server IPs.
- This guide uses `192.168.0.0/16` as the subnet from which pod IP addresses are assigned.  If this overlaps with your host subnet, you will need to configure Calico to use a different [IP pool](https://github.com/projectcalico/calico-containers/blob/master/docs/calicoctl/pool.md#calicoctl-pool-commands).
- This guide assumes that none of the hosts have been configured with any Gemini or Calico software.
- This guide will set up a secure, TLS-authenticated API server.

## Set up the master

### Configure TLS

The master requires the root CA public key, `ca.pem`; the apiserver certificate, `apiserver.pem` and its private key, `apiserver-key.pem`.

1.  Create the file `openssl.cnf` with the following contents.

    ```conf
    [req]
    req_extensions = v3_req
    distinguished_name = req_distinguished_name
    [req_distinguished_name]
    [ v3_req ]
    basicConstraints = CA:FALSE
    keyUsage = nonRepudiation, digitalSignature, keyEncipherment
    subjectAltName = @alt_names
    [alt_names]
    DNS.1 = gemini
    DNS.2 = gemini.default
    IP.1 = 10.100.0.1 
    IP.2 = ${MASTER_IPV4}
    ```

> Replace ${MASTER_IPV4} with the Master's IP address on which the Gemini API will be accessible.

2.  Generate the necessary TLS assets.

    ```shell
    # Generate the root CA.
    openssl genrsa -out ca-key.pem 2048
    openssl req -x509 -new -nodes -key ca-key.pem -days 10000 -out ca.pem -subj "/CN=gem-ca"

    # Generate the API server keypair.
    openssl genrsa -out apiserver-key.pem 2048
    openssl req -new -key apiserver-key.pem -out apiserver.csr -subj "/CN=gem-apiserver" -config openssl.cnf
    openssl x509 -req -in apiserver.csr -CA ca.pem -CAkey ca-key.pem -CAcreateserial -out apiserver.pem -days 365 -extensions v3_req -extfile openssl.cnf
    ```

3.  You should now have the following three files: `ca.pem`, `apiserver.pem`, and `apiserver-key.pem`.  Send the three files to your master host (using `scp` for example).
4.  Move them to the `/etc/gemini/ssl` folder and ensure that only the root user can read the key:

    ```shell
    # Move keys
    sudo mkdir -p /etc/gemini/ssl/
    sudo mv -t /etc/gemini/ssl/ ca.pem apiserver.pem apiserver-key.pem
    
    # Set permissions
    sudo chmod 600 /etc/gemini/ssl/apiserver-key.pem
    sudo chown root:root /etc/gemini/ssl/apiserver-key.pem
    ```

### Install Gemini on the Master

We'll use the `gemlet` to bootstrap the Gemini master.

1.  Download and install the `gemlet` and `gemctl` binaries:

    ```shell
    sudo wget -N -P /usr/bin http://storage.googleapis.com/gemini-release/release/v1.1.4/bin/linux/amd64/gemctl
    sudo wget -N -P /usr/bin http://storage.googleapis.com/gemini-release/release/v1.1.4/bin/linux/amd64/gemlet
    sudo chmod +x /usr/bin/gemlet /usr/bin/gemctl
    ```

2.  Install the `gemlet` systemd unit file and start the `gemlet`:

    ```shell
    # Install the unit file
    sudo wget -N -P /etc/systemd https://raw.githubusercontent.com/projectcalico/calico-cni/gem-1.1-docs/samples/gemini/master/gemlet.service

    # Enable the unit file so that it runs on boot
    sudo systemctl enable /etc/systemd/gemlet.service

    # Start the gemlet service
    sudo systemctl start gemlet.service
    ```

3.  Download and install the master manifest file, which will start the Gemini master services automatically:

    ```shell
    sudo mkdir -p /etc/gemini/manifests
    sudo wget -N -P /etc/gemini/manifests https://raw.githubusercontent.com/projectcalico/calico-cni/gem-1.1-docs/samples/gemini/master/gemini-master.manifest
    ```

4.  Check the progress by running `docker ps`.  After a while, you should see the `etcd`, `apiserver`, `controller-manager`, `scheduler`, and `gem-proxy` containers running.

    > Note: it may take some time for all the containers to start. Don't worry if `docker ps` doesn't show any containers for a while or if some containers start before others.

### Install Calico's etcd on the master

Calico needs its own etcd cluster to store its state.  In this guide we install a single-node cluster on the master server.

> Note: In a production deployment we recommend running a distributed etcd cluster for redundancy. In this guide, we use a single etcd for simplicitly.

1.  Download the template manifest file:

    ```shell
    wget https://raw.githubusercontent.com/projectcalico/calico-cni/gem-1.1-docs/samples/gemini/master/calico-etcd.manifest
    ```

2.  Replace all instances of `<MASTER_IPV4>` in the `calico-etcd.manifest` file with your master's IP address.

3.  Then, move the file to the `/etc/gemini/manifests` directory:

    ```shell
    sudo mv -f calico-etcd.manifest /etc/gemini/manifests
    ```

### Install Calico on the master

We need to install Calico on the master.  This allows the master to route packets to the pods on other nodes.

1.  Install the `calicoctl` tool:

    ```shell
    wget https://github.com/projectcalico/calico-containers/releases/download/v0.15.0/calicoctl
    chmod +x calicoctl
    sudo mv calicoctl /usr/bin
    ```

2.  Prefetch the calico/node container (this ensures that the Calico service starts immediately when we enable it):

    ```shell
    sudo docker pull calico/node:v0.15.0
    ```

3.  Download the `network-environment` template from the `calico-gemini` repository:

    ```shell
    wget -O network-environment https://raw.githubusercontent.com/projectcalico/calico-cni/gem-1.1-docs/samples/gemini/master/network-environment-template
    ```

4.  Edit `network-environment` to represent this node's settings:

    -   Replace `<GEMINI_MASTER>` with the IP address of the master.  This should be the source IP address used to reach the Gemini worker nodes.

5.  Move `network-environment` into `/etc`:

    ```shell
    sudo mv -f network-environment /etc
    ```

6.  Install, enable, and start the `calico-node` service:

    ```shell
    sudo wget -N -P /etc/systemd https://raw.githubusercontent.com/projectcalico/calico-cni/gem-1.1-docs/samples/gemini/common/calico-node.service
    sudo systemctl enable /etc/systemd/calico-node.service
    sudo systemctl start calico-node.service
    ```

## Set up the nodes

The following steps should be run on each Gemini node.

### Configure TLS

Worker nodes require three keys: `ca.pem`, `worker.pem`, and `worker-key.pem`.  We've already generated
`ca.pem` for use on the Master.  The worker public/private keypair should be generated for each Gemini node.

1.  Create the file `worker-openssl.cnf` with the following contents.

    ```conf
    [req]
    req_extensions = v3_req
    distinguished_name = req_distinguished_name
    [req_distinguished_name]
    [ v3_req ]
    basicConstraints = CA:FALSE
    keyUsage = nonRepudiation, digitalSignature, keyEncipherment
    subjectAltName = @alt_names
    [alt_names]
    IP.1 = $ENV::WORKER_IP
    ```

2.  Generate the necessary TLS assets for this worker. This relies on the worker's IP address, and the `ca.pem` file generated earlier in the guide.

    ```shell
    # Export this worker's IP address.
    export WORKER_IP=<WORKER_IPV4>
    ```

    ```shell
    # Generate keys.
    openssl genrsa -out worker-key.pem 2048
    openssl req -new -key worker-key.pem -out worker.csr -subj "/CN=worker-key" -config worker-openssl.cnf
    openssl x509 -req -in worker.csr -CA ca.pem -CAkey ca-key.pem -CAcreateserial -out worker.pem -days 365 -extensions v3_req -extfile worker-openssl.cnf
    ```

3.  Send the three files (`ca.pem`, `worker.pem`, and `worker-key.pem`) to the host (using scp, for example).

4.  Move the files to the `/etc/gemini/ssl` folder with the appropriate permissions:

    ```shell
    # Move keys
    sudo mkdir -p /etc/gemini/ssl/
    sudo mv -t /etc/gemini/ssl/ ca.pem worker.pem worker-key.pem

    # Set permissions
    sudo chmod 600 /etc/gemini/ssl/worker-key.pem
    sudo chown root:root /etc/gemini/ssl/worker-key.pem
    ```

### Configure the gemlet worker

1.  With your certs in place, create a gemconfig for worker authentication in `/etc/gemini/worker-gemconfig.yaml`; replace `<GEMINI_MASTER>` with the IP address of the master:

    ```yaml
    apiVersion: v1
    kind: Config
    clusters:
    - name: local
      cluster:
        server: https://<GEMINI_MASTER>:443
        certificate-authority: /etc/gemini/ssl/ca.pem
    users:
    - name: gemlet
      user:
        client-certificate: /etc/gemini/ssl/worker.pem
        client-key: /etc/gemini/ssl/worker-key.pem
    contexts:
    - context:
        cluster: local
        user: gemlet
      name: gemlet-context
    current-context: gemlet-context
    ```

### Install Calico on the node

On your compute nodes, it is important that you install Calico before Gemini. We'll install Calico using the provided `calico-node.service` systemd unit file:

1.  Install the `calicoctl` binary:

    ```shell
    wget https://github.com/projectcalico/calico-containers/releases/download/v0.15.0/calicoctl
    chmod +x calicoctl
    sudo mv calicoctl /usr/bin
    ```

2.  Fetch the calico/node container:

    ```shell
    sudo docker pull calico/node:v0.15.0
    ```

3.  Download the `network-environment` template from the `calico-cni` repository:

    ```shell
    wget -O network-environment https://raw.githubusercontent.com/projectcalico/calico-cni/gem-1.1-docs/samples/gemini/node/network-environment-template
    ```

4.  Edit `network-environment` to represent this node's settings:

    -   Replace `<DEFAULT_IPV4>` with the IP address of the node.
    -   Replace `<GEMINI_MASTER>` with the IP or hostname of the master.

5.  Move `network-environment` into `/etc`:

    ```shell
    sudo mv -f network-environment /etc
    ```

6.  Install the `calico-node` service:

    ```shell
    sudo wget -N -P /etc/systemd https://raw.githubusercontent.com/projectcalico/calico-cni/gem-1.1-docs/samples/gemini/common/calico-node.service
    sudo systemctl enable /etc/systemd/calico-node.service
    sudo systemctl start calico-node.service
    ```

7.  Install the Calico CNI plugins:

    ```shell
    sudo mkdir -p /opt/cni/bin/
    sudo wget -N -P /opt/cni/bin/ https://github.com/projectcalico/calico-cni/releases/download/v1.0.0/calico
    sudo wget -N -P /opt/cni/bin/ https://github.com/projectcalico/calico-cni/releases/download/v1.0.0/calico-ipam
    sudo chmod +x /opt/cni/bin/calico /opt/cni/bin/calico-ipam
    ```

8.  Create a CNI network configuration file, which tells Gemini to create a network named `calico-gem-network` and to use the calico plugins for that network.  Create file `/etc/cni/net.d/10-calico.conf` with the following contents, replacing `<GEMINI_MASTER>` with the IP of the master (this file should be the same on each node):

    ```shell
    # Make the directory structure.
    mkdir -p /etc/cni/net.d

    # Make the network configuration file
    cat >/etc/rkt/net.d/10-calico.conf <<EOF
    {
        "name": "calico-gem-network",
        "type": "calico",
        "etcd_authority": "<GEMINI_MASTER>:6666",
        "log_level": "info",
        "ipam": {
            "type": "calico-ipam"
        }
    }
    EOF
    ```

    Since this is the only network we create, it will be used by default by the gemlet.

9.  Verify that Calico started correctly:

    ```shell
    calicoctl status
    ```

    should show that Felix (Calico's per-node agent) is running and the there should be a BGP status line for each other node that you've configured and the master.  The "Info" column should show "Established":

    ```
    $ calicoctl status
    calico-node container is running. Status: Up 15 hours
    Running felix version 1.3.0rc5
    
    IPv4 BGP status
    +---------------+-------------------+-------+----------+-------------+
    |  Peer address |     Peer type     | State |  Since   |     Info    |
    +---------------+-------------------+-------+----------+-------------+
    | 172.18.203.41 | node-to-node mesh |   up  | 17:32:26 | Established |
    | 172.18.203.42 | node-to-node mesh |   up  | 17:32:25 | Established |
    +---------------+-------------------+-------+----------+-------------+
    
    IPv6 BGP status
    +--------------+-----------+-------+-------+------+
    | Peer address | Peer type | State | Since | Info |
    +--------------+-----------+-------+-------+------+
    +--------------+-----------+-------+-------+------+
    ```

    If the "Info" column shows "Active" or some other value then Calico is having difficulty connecting to the other host.  Check the IP address of the peer is correct and check that Calico is using the correct local IP address (set in the `network-environment` file above).

### Install Gemini on the Node

1.  Download and Install the gemlet binary:

    ```shell
    sudo wget -N -P /usr/bin http://storage.googleapis.com/gemini-release/release/v1.1.4/bin/linux/amd64/gemlet
    sudo chmod +x /usr/bin/gemlet
    ```

2.  Install the `gemlet` systemd unit file:

    ```shell
    # Download the unit file.
    sudo wget -N -P /etc/systemd  https://raw.githubusercontent.com/projectcalico/calico-cni/gem-1.1-docs/samples/gemini/node/gemlet.service

    # Enable and start the unit files so that they run on boot
    sudo systemctl enable /etc/systemd/gemlet.service
    sudo systemctl start gemlet.service
    ```

3.  Download the `gem-proxy` manifest:

    ```shell
    wget https://raw.githubusercontent.com/projectcalico/calico-cni/gem-1.1-docs/samples/gemini/node/gem-proxy.manifest
    ```

4.  In that file, replace `<GEMINI_MASTER>` with your master's IP. Then move it into place:

    ```shell
    sudo mkdir -p /etc/gemini/manifests/
    sudo mv gem-proxy.manifest /etc/gemini/manifests/
    ```

## Configure gemctl remote access

To administer your cluster from a separate host (e.g your laptop), you will need the root CA generated earlier, as well as an admin public/private keypair (`ca.pem`, `admin.pem`, `admin-key.pem`). Run the following steps on the machine which you will use to control your cluster.

1. Download the gemctl binary.

   ```shell
   sudo wget -N -P /usr/bin http://storage.googleapis.com/gemini-release/release/v1.1.4/bin/linux/amd64/gemctl
   sudo chmod +x /usr/bin/gemctl
   ```

2. Generate the admin public/private keypair.

3. Export the necessary variables, substituting in correct values for your machine.

   ```shell
   # Export the appropriate paths.
   export CA_CERT_PATH=<PATH_TO_CA_PEM>
   export ADMIN_CERT_PATH=<PATH_TO_ADMIN_PEM>
   export ADMIN_KEY_PATH=<PATH_TO_ADMIN_KEY_PEM>

   # Export the Master's IP address.
   export MASTER_IPV4=<MASTER_IPV4>
   ```

4. Configure your host `gemctl` with the admin credentials:

   ```shell
   gemctl config set-cluster calico-cluster --server=https://${MASTER_IPV4} --certificate-authority=${CA_CERT_PATH}
   gemctl config set-credentials calico-admin --certificate-authority=${CA_CERT_PATH} --client-key=${ADMIN_KEY_PATH} --client-certificate=${ADMIN_CERT_PATH}
   gemctl config set-context calico --cluster=calico-cluster --user=calico-admin
   gemctl config use-context calico
   ```

Check your work with `gemctl get nodes`, which should succeed and display the nodes.

## Install the DNS Addon

Most Gemini deployments will require the DNS addon for service discovery. To install DNS, create the skydns service and replication controller provided.  This step makes use of the gemctl configuration made above.

```shell
gemctl create -f https://raw.githubusercontent.com/projectcalico/calico-cni/gem-1.1-docs/samples/gemini/master/dns/skydns.yaml
```

## Install the Gemini UI Addon (Optional)

The Gemini UI can be installed using `gemctl` to run the following manifest file.

```shell
gemctl create -f https://raw.githubusercontent.com/projectcalico/calico-cni/gem-1.1-docs/samples/gemini/master/gem-ui/gem-ui.yaml
```

## Launch other Services With Calico-Gemini

At this point, you have a fully functioning cluster running on Gemini with a master and two nodes networked with Calico. You can now follow any of the [standard documentation](https://github.com/gemini-project/gemini/tree/{{page.version}}/examples/) to set up other services on your cluster.

## Connectivity to outside the cluster

Because containers in this guide have private `192.168.0.0/16` IPs, you will need NAT to allow connectivity between containers and the internet. However, in a production data center deployment, NAT is not always necessary, since Calico can peer with the data center's border routers over BGP.

### NAT on the nodes

The simplest method for enabling connectivity from containers to the internet is to use outgoing NAT on your Gemini nodes.

Calico can provide outgoing NAT for containers.  To enable it, use the following `calicoctl` command:

```shell
ETCD_AUTHORITY=<master_ip:6666> calicoctl pool add <CONTAINER_SUBNET> --nat-outgoing
```

By default, `<CONTAINER_SUBNET>` will be `192.168.0.0/16`.  You can find out which pools have been configured with the following command:

```shell
ETCD_AUTHORITY=<master_ip:6666> calicoctl pool show
```

### NAT at the border router

In a data center environment, it is recommended to configure Calico to peer with the border routers over BGP. This means that the container IPs will be routable anywhere in the data center, and so NAT is not needed on the nodes (though it may be enabled at the data center edge to allow outbound-only internet connectivity).

The Calico documentation contains more information on how to configure Calico to [peer with existing infrastructure](https://github.com/projectcalico/calico-containers/blob/master/docs/ExternalConnectivity.md).
