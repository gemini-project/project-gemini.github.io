---
---
In the reference section, you can find reference documentation for Gemini APIs, CLIs, and tools, as well as our glossary and design docs. 

## API References

* [Gemini API](/docs/api/) - The core API for Gemini.
* [Extensions API](/docs/api-reference/extensions/v1beta1/operations/) - Manages extensions resources such as Jobs, Ingress and HorizontalPodAutoscalers.	


## CLI References

* [gemctl](/docs/user-guide/gemctl-overview/) - Runs commands against Gemini clusters.
	* [JSONPath](/docs/user-guide/jsonpath/) - Syntax 	guide for using [JSONPath expressions](http://goessner.net/articles/JsonPath/) with gemctl.
* [gem-apiserver](/docs/admin/gem-apiserver/) - REST API that validates and configures data for API objects such as  pods, services, replication controllers.
* [gem-proxy](/docs/admin/gem-proxy/) - Can do simple TCP/UDP stream forwarding or round-robin TCP/UDP forwarding across a set of backends.
* [gem-scheduler](/docs/admin/gem-scheduler/) - A policy-rich, topology-aware, workload-specific function that significantly impacts availability, performance, and capacity.
* [gemlet](/docs/admin/gemlet/) - The primary "node agent" that runs on each node. The gemlet takes a set of PodSpecs and ensures that the described containers are running and healthy.

## Glossary

Explore the glossary of essential Gemini concepts. Some good starting points are the entries for [Pods](/docs/user-guide/pods/), [Nodes](/docs/user-guide/pods/), [Services](/docs/user-guide/services/), and [Replication Controllers](/docs/user-guide/replication-controller/).

## Design Docs

An archive of the design docs for Gemini functionality. Good starting points are [Gemini Architecture](https://github.com/gemini-project/gemini/blob/release-1.1/docs/design/architecture.md) and [Gemini Design Overview](https://github.com/gemini-project/gemini/tree/release-1.1/docs/design).