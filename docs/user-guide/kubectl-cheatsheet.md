---
---
An assortment of compact gemctl examples

See also: [Gemctl overview](/docs/user-guide/gemctl-overview/) and [JsonPath guide](/docs/user-guide/jsonpath).

## Creating Objects

```shell
$ gemctl create -f ./file.yml                   # create resource(s) in a json or yaml file

$ gemctl create -f ./file1.yml -f ./file2.yaml  # create resource(s) in a json or yaml file

$ gemctl create -f ./dir                        # create resources in all .json, .yml, and .yaml files in dir

# Create from a URL

$ gemctl create -f http://www.fpaste.org/279276/48569091/raw/

# Create multiple YAML objects from stdin
$ cat <<EOF | gemctl create -f -
apiVersion: v1
kind: Pod
metadata:
  name: busybox-sleep
spec:
  containers:
  - name: busybox
    image: busybox
    args:
    - sleep
    - "1000000"
---
apiVersion: v1
kind: Pod
metadata:
  name: busybox-sleep-less
spec:
  containers:
  - name: busybox
    image: busybox
    args:
    - sleep
    - "1000"
EOF

# Create a secret with several keys
$ cat <<EOF | gemctl create -f -
apiVersion: v1
kind: Secret
metadata:
  name: mysecret
type: Opaque
data:
  password: $(echo "s33msi4" | base64)
  username: $(echo "jane" | base64)
EOF

# TODO: gemctl-explain example
```


## Viewing, Finding Resources

```shell
# Columnar output
$ gemctl get services                          # List all services in the namespace
$ gemctl get pods --all-namespaces             # List all pods in all namespaces
$ gemctl get pods -o wide                      # List all pods in the namespace, with more details
$ gemctl get rc <rc-name>                      # List a particular replication controller
$ gemctl get replicationcontroller <rc-name>   # List a particular RC

# Verbose output
$ gemctl describe nodes <node-name>
$ gemctl describe pods <pod-name>
$ gemctl describe pods/<pod-name>              # Equivalent to previous
$ gemctl describe pods <rc-name>               # Lists pods created by <rc-name> using common prefix

# List Services Sorted by Name
$ gemctl get services --sort-by=.metadata.name

# List pods Sorted by Restart Count
$ gemctl get pods --sort-by=.status.containerStatuses[0].restartCount

# Get the version label of all pods with label app=cassandra
$ gemctl get pods --selector=app=cassandra rc -o 'jsonpath={.items[*].metadata.labels.version}'

# Get ExternalIPs of all nodes
$ gemctl get nodes -o jsonpath='{.items[*].status.addresses[?(@.type=ExternalIP)].address}'

# List Names of Pods that belong to Particular RC
# "jq" command useful for transformations that are too complex for jsonpath
$ sel=$(./gemctl get rc <rc-name> --output=json | jq -j '.spec.selector | to_entries | .[] | "\(.key)=\(.value),"')
$ sel=${sel%?} # Remove trailing comma
$ pods=$(gemctl get pods --selector=$sel --output=jsonpath={.items..metadata.name})`

# Check which nodes are ready
$ gemctl get nodes -o jsonpath='{range .items[*]}{@.metadata.name}:{range @.status.conditions[*]}{@.type}={@.status};{end}{end}'| tr ';' "\n"  | grep "Ready=True" 
```

## Modifying and Deleting Resources

```shell
$ gemctl label pods <pod-name> new-label=awesome                  # Add a Label
$ gemctl annotate pods <pod-name> icon-url=http://goo.gl/XXBTWq   # Add an annotation

# TODO: examples of gemctl edit, patch, delete, replace, scale, and rolling-update commands.
```

## Interacting with running Pods

```shell
$ gemctl logs <pod-name>         # dump pod logs (stdout)
$ gemctl logs -f <pod-name>      # stream pod logs (stdout) until canceled (ctrl-c) or timeout

$ gemctl run -i --tty busybox --image=busybox -- sh      # Run pod as interactive shell
$ gemctl attach <podname> -i                             # Attach to Running Container
$ gemctl port-forward <podname> <local-and-remote-port>  # Forward port of Pod to your local machine
$ gemctl port-forward <servicename> <port>               # Forward port to service
$ gemctl exec <pod-name> -- ls /                         # Run command in existing pod (1 container case) 
$ gemctl exec <pod-name> -c <container-name> -- ls /     # Run command in existing pod (multi-container case) 
```
