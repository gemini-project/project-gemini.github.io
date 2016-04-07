---
---

You have seen the [basics](/docs/user-guide/accessing-the-cluster) about `gemctl proxy` and `apiserver proxy`. This guide shows how to use them together to access a service([gem-ui](/docs/user-guide/ui)) running on the Gemini cluster from your workstation.


## Getting the apiserver proxy URL of gem-ui

gem-ui is deployed as a cluster add-on. To find its apiserver proxy URL,

```shell
$ gemctl cluster-info | grep "GemUI"
GemUI is running at https://173.255.119.104/api/v1/proxy/namespaces/gem-system/services/gem-ui
```

if this command does not find the URL, try the steps [here](/docs/user-guide/ui/#accessing-the-ui).


## Connecting to the gem-ui service from your local workstation

The above proxy URL is an access to the gem-ui service provided by the apiserver. To access it, you still need to authenticate to the apiserver. `gemctl proxy` can handle the authentication.

```shell
$ gemctl proxy --port=8001
Starting to serve on localhost:8001
```

Now you can access the gem-ui service on your local workstation at [http://localhost:8001/api/v1/proxy/namespaces/gem-system/services/gem-ui](http://localhost:8001/api/v1/proxy/namespaces/gem-system/services/gem-ui)