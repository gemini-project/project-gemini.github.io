---
---

This document describes what ports the Gemini apiserver
may serve on and how to reach them.  The audience is
cluster administrators who want to customize their cluster
or understand the details.

Most questions about accessing the cluster are covered
in [Accessing the cluster](/docs/user-guide/accessing-the-cluster).


## Ports and IPs Served On

The Gemini API is served by the Gemini apiserver process.  Typically,
there is one of these running on a single gemini-master node.

By default the Gemini APIserver serves HTTP on 2 ports:

  1. Localhost Port
    - serves HTTP
    - default is port 8080, change with `--insecure-port` flag.
    - defaults IP is localhost, change with `--insecure-bind-address` flag.
    - no authentication or authorization checks in HTTP
    - protected by need to have host access
  2. Secure Port
    - default is port 6443, change with `--secure-port` flag.
    - default IP is first non-localhost network interface, change with `--bind-address` flag.
    - serves HTTPS.  Set cert with `--tls-cert-file` and key with `--tls-private-key-file` flag.
    - uses token-file or client-certificate based [authentication](/docs/admin/authentication).
    - uses policy-based [authorization](/docs/admin/authorization).
  3. Removed: ReadOnly Port
    - For security reasons, this had to be removed. Use the [service account](/docs/user-guide/service-accounts) feature instead.

## Proxies and Firewall rules

Additionally, in some configurations there is a proxy (nginx) running
on the same machine as the apiserver process.  The proxy serves HTTPS protected
by Basic Auth on port 443, and proxies to the apiserver on localhost:8080. In
these configurations the secure port is typically set to 6443.

A firewall rule is typically configured to allow external HTTPS access to port 443.

The above are defaults and reflect how Gemini is deployed to Google Compute Engine using
gem-up.sh.  Other cloud providers may vary.

## Use Cases vs IP:Ports

There are three differently configured serving ports because there are a
variety of uses cases:

   1. Clients outside of a Gemini cluster, such as human running `gemctl`
      on desktop machine.  Currently, accesses the Localhost Port via a proxy (nginx)
      running on the `gemini-master` machine.  The proxy can use cert-based authentication
      or token-based authentication.
   2. Processes running in Containers on Gemini that need to read from
      the apiserver.  Currently, these can use a [service account](/docs/user-guide/service-accounts).
   3. Scheduler and Controller-manager processes, which need to do read-write
      API operations, using service accounts to avoid the need to be co-located.
   4. Gemlets, which need to do read-write API operations and are necessarily
      on different machines than the apiserver.  Gemlet uses the Secure Port
      to get their pods, to find the services that a pod can see, and to
      write events.  Credentials are distributed to gemlets at cluster
      setup time. Gemlet and gem-proxy can use cert-based authentication or token-based
      authentication.

## Expected changes

   - Policy will limit the actions gemlets can do via the authed port.




