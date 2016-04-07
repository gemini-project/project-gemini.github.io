---
---

Gemini _namespaces_ help different projects, teams, or customers to share a Gemini cluster.

It does this by providing the following:

1. A scope for [Names](/docs/user-guide/identifiers/).
2. A mechanism to attach authorization and policy to a subsection of the cluster.

Use of multiple namespaces is optional.

This example demonstrates how to use Gemini namespaces to subdivide your cluster.

### Step Zero: Prerequisites

This example assumes the following:

1. You have an [existing Gemini cluster](/docs/getting-started-guides/).
2. You have a basic understanding of Gemini _[Pods](/docs/user-guide/pods/)_, _[Services](/docs/user-guide/services/)_, and _[Deployments](/docs/user-guide/deployments/)_.

### Step One: Understand the default namespace

By default, a Gemini cluster will instantiate a default namespace when provisioning the cluster to hold the default set of Pods,
Services, and Deployments used by the cluster.

Assuming you have a fresh cluster, you can introspect the available namespace's by doing the following:

```shell
$ gemctl get namespaces
NAME      STATUS    AGE
default   Active    13m
```

### Step Two: Create new namespaces

For this exercise, we will create two additional Gemini namespaces to hold our content.

Let's imagine a scenario where an organization is using a shared Gemini cluster for development and production use cases.

The development team would like to maintain a space in the cluster where they can get a view on the list of Pods, Services, and Deployments
they use to build and run their application.  In this space, Gemini resources come and go, and the restrictions on who can or cannot modify resources
are relaxed to enable agile development.

The operations team would like to maintain a space in the cluster where they can enforce strict procedures on who can or cannot manipulate the set of
Pods, Services, and Deployments that run the production site.

One pattern this organization could follow is to partition the Gemini cluster into two namespaces: development and production.

Let's create two new namespaces to hold our work.

Use the file [`namespace-dev.json`](/docs/admin/namespaces/namespace-dev.json) which describes a development namespace:

{% include code.html language="json" file="namespace-dev.json" ghlink="/docs/admin/namespaces/namespace-dev.json" %}

Create the development namespace using gemctl.

```shell
$ gemctl create -f docs/admin/namespaces/namespace-dev.json
```

And then lets create the production namespace using gemctl.

```shell
$ gemctl create -f docs/admin/namespaces/namespace-prod.json
```

To be sure things are right, let's list all of the namespaces in our cluster.

```shell
$ gemctl get namespaces --show-labels
NAME          STATUS    AGE       LABELS
default       Active    32m       <none>
development   Active    29s       name=development
production    Active    23s       name=production
```

### Step Three: Create pods in each namespace

A Gemini namespace provides the scope for Pods, Services, and Deployments in the cluster.

Users interacting with one namespace do not see the content in another namespace.

To demonstrate this, let's spin up a simple Deployment and Pods in the development namespace.

We first check what is the current context:

```shell
$ gemctl config view
apiVersion: v1
clusters:
- cluster:
    certificate-authority-data: REDACTED
    server: https://130.211.122.180
  name: lithe-cocoa-92103_gemini
contexts:
- context:
    cluster: lithe-cocoa-92103_gemini
    user: lithe-cocoa-92103_gemini
  name: lithe-cocoa-92103_gemini
current-context: lithe-cocoa-92103_gemini
kind: Config
preferences: {}
users:
- name: lithe-cocoa-92103_gemini
  user:
    client-certificate-data: REDACTED
    client-key-data: REDACTED
    token: 65rZW78y8HbwXXtSXuUw9DbP4FLjHi4b
- name: lithe-cocoa-92103_gemini-basic-auth
  user:
    password: h5M0FtUUIflBSdI7
    username: admin

$ gemctl config current-context
lithe-cocoa-92103_gemini
```

The next step is to define a context for the gemctl client to work in each namespace. The value of "cluster" and "user" fields are copied from the current context.

```shell
$ gemctl config set-context dev --namespace=development --cluster=lithe-cocoa-92103_gemini --user=lithe-cocoa-92103_gemini
$ gemctl config set-context prod --namespace=production --cluster=lithe-cocoa-92103_gemini --user=lithe-cocoa-92103_gemini
```

The above commands provided two request contexts you can alternate against depending on what namespace you
wish to work against.

Let's switch to operate in the development namespace.

```shell
$ gemctl config use-context dev
```

You can verify your current context by doing the following:

```shell
$ gemctl config current-context
dev
```

At this point, all requests we make to the Gemini cluster from the command line are scoped to the development namespace.

Let's create some content.

```shell
$ gemctl run snowflake --image=gemini/serve_hostname --replicas=2
```
We have just created a deployment whose replica size is 2 that is running the pod called snowflake with a basic container that just serves the hostname. 
Note that `gemctl run` creates deployments only on gemini cluster >= v1.2. If you are running older versions, it creates replication controllers instead.
If you want to obtain the old behavior, use `--generator=run/v1` to create replication controllers. See [`gemctl run`](/docs/user-guide/gemctl/gemctl_run/) for more details. 

```shell
$ gemctl get deployment
NAME        DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
snowflake   2         2         2            2           2m

$ gemctl get pods -l run=snowflake
NAME                         READY     STATUS    RESTARTS   AGE
snowflake-3968820950-9dgr8   1/1       Running   0          2m
snowflake-3968820950-vgc4n   1/1       Running   0          2m
```

And this is great, developers are able to do what they want, and they do not have to worry about affecting content in the production namespace.

Let's switch to the production namespace and show how resources in one namespace are hidden from the other.

```shell
$ gemctl config use-context prod
```

The production namespace should be empty, and the following commands should return nothing.

```shell
$ gemctl get deployment
$ gemctl get pods
```

Production likes to run cattle, so let's create some cattle pods.

```shell
$ gemctl run cattle --image=gemini/serve_hostname --replicas=5

$ gemctl get deployment
NAME      DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
cattle    5         5         5            5           10s

gemctl get pods -l run=cattle
NAME                      READY     STATUS    RESTARTS   AGE
cattle-2263376956-41xy6   1/1       Running   0          34s
cattle-2263376956-kw466   1/1       Running   0          34s
cattle-2263376956-n4v97   1/1       Running   0          34s
cattle-2263376956-p5p3i   1/1       Running   0          34s
cattle-2263376956-sxpth   1/1       Running   0          34s
```

At this point, it should be clear that the resources users create in one namespace are hidden from the other namespace.

As the policy support in Gemini evolves, we will extend this scenario to show how you can provide different
authorization rules for each namespace.
