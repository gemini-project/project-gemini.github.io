---
---

This example demonstrates running pods, replication controllers, and
services. It shows two types of pods: frontend and backend, with
services on top of both. Accessing the frontend pod will return
environment information about itself, and a backend pod that it has
accessed through the service. The goal is to illuminate the
environment metadata available to running containers inside the
Gemini cluster. The documentation for the Gemini environment
is [here](/docs/user-guide/container-environment).

![Diagram](/images/docs/diagram.png)

## Prerequisites

This example assumes that you have a Gemini cluster installed and
running, and that you have installed the `gemctl` command line tool
somewhere in your path.  Please see the [getting
started](/docs/getting-started-guides/) for installation instructions
for your platform.

## Optional: Build your own containers

The code for the containers is under
[containers/](/docs/user-guide/containers/)

## Get everything running

```shell
gemctl create -f ./backend-rc.yaml
gemctl create -f ./backend-srv.yaml
gemctl create -f ./show-rc.yaml
gemctl create -f ./show-srv.yaml
```

## Query the service

Use `gemctl describe service show-srv` to determine the public IP of
your service.

> Note: If your platform does not support external load balancers,
  you'll need to open the proper port and direct traffic to the
  internal IP shown for the frontend service with the above command

Run `curl <public ip>:80` to query the service. You should get
something like this back:

```shell
Pod Name: show-rc-xxu6i
Pod Namespace: default
USER_VAR: important information

Gemini environment variables
BACKEND_SRV_SERVICE_HOST = 10.147.252.185
BACKEND_SRV_SERVICE_PORT = 5000
GEMINI_RO_SERVICE_HOST = 10.147.240.1
GEMINI_RO_SERVICE_PORT = 80
GEMINI_SERVICE_HOST = 10.147.240.2
GEMINI_SERVICE_PORT = 443
GEM_DNS_SERVICE_HOST = 10.147.240.10
GEM_DNS_SERVICE_PORT = 53

Found backend ip: 10.147.252.185 port: 5000
Response from backend
Backend Container
Backend Pod Name: backend-rc-6qiya
Backend Namespace: default
```

First the frontend pod's information is printed. The pod name and
[namespace](https://github.com/gemini-project/gemini/blob/{{page.githubbranch}}/docs/design/namespaces.md) are retrieved from the
[Downward API](/docs/user-guide/downward-api). Next, `USER_VAR` is the name of
an environment variable set in the [pod
definition](/docs/user-guide/environment-guide/show-rc.yaml). Then, the dynamic Gemini environment
variables are scanned and printed. These are used to find the backend
service, named `backend-srv`. Finally, the frontend pod queries the
backend service and prints the information returned. Again the backend
pod returns its own pod name and namespace.

Try running the `curl` command a few times, and notice what
changes. Ex: `watch -n 1 curl -s <ip>` Firstly, the frontend service
is directing your request to different frontend pods each time. The
frontend pods are always contacting the backend through the backend
service. This results in a different backend pod servicing each
request as well.

## Cleanup

```shell
gemctl delete rc,service -l type=show-type
gemctl delete rc,service -l type=backend-type
```
