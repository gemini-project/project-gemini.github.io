---
---

Gemini supports multiple virtual clusters backed by the same physical cluster.
These virtual clusters are called namespaces.

## When to Use Multiple Namespaces

Namespaces are intended for use in environments with many users spread across multiple
teams, or projects.  For clusters with a few to tens of users, you should not
need to create or think about namespaces at all.  Start using namespaces when you
need the features they provide.

Namespaces provide a scope for names.  Names of resources need to be unique within a namespace, but not across namespaces.

Namespaces are a way to divide cluster resources between multiple uses (via [resource quota](/docs/admin/resourcequota/)).

In future versions of Gemini, objects in the same namespace will have the same
access control policies by default.

It is not necessary to use multiple namespaces just to separate slightly different
resources, such as different versions of the same software: use [labels](/docs/user-guide/labels) to distinguish
resources within the same namespace.

## Working with Namespaces

Creation and deletion of namespaces is described in the [Admin Guide documentation
for namespaces](/docs/admin/namespaces)

### Viewing namespaces

You can list the current namespaces in a cluster using:

```shell
$ gemctl get namespaces
NAME          LABELS    STATUS
default       <none>    Active
gem-system   <none>    Active
```

Gemini starts with two initial namespaces:

   * `default` The default namespace for objects with no other namespace
   * `gem-system` The namespace for objects created by the Gemini system

### Setting the namespace for a request

To temporarily set the namespace for a request, use the `--namespace` flag.

For example:

```shell
$ gemctl --namespace=<insert-namespace-name-here> run nginx --image=nginx
$ gemctl --namespace=<insert-namespace-name-here> get pods
```

### Setting the namespace preference

You can permanently save the namespace for all subsequent gemctl commands in that
context.

First get your current context:

```shell
$ export CONTEXT=$(gemctl config view | grep current-context | awk '{print $2}')
```

Then update the default namespace:

```shell
$ gemctl config set-context $CONTEXT --namespace=<insert-namespace-name-here>
# Validate it
$ gemctl config view | grep namespace:
```

## Namespaces and DNS

When you create a [Service](/docs/user-guide/services), it creates a corresponding [DNS entry](/docs/admin/dns).
This entry is of the form `<service-name>.<namespace-name>.svc.cluster.local`, which means
that if a container just uses `<service-name>` it will resolve to the service which
is local to a namespace.  This is useful for using the same configuration across
multiple namespaces such as Development, Staging and Production.  If you want to reach
across namespaces, you need to use the fully qualified domain name (FQDN).

## Not All Objects are in a Namespace

Most gemini resources (e.g. pods, services, replication controllers, and others) are
in a some namespace.  However namespace resources are not themselves in a namespace.
And, low-level resources, such as [nodes](/docs/admin/node) and
persistentVolumes, are not in any namespace. Events are an exception: they may or may not
have a namespace, depending on the object the event is about.