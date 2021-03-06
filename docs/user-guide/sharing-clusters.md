---
---

Client access to a running Gemini cluster can be shared by copying
the `gemctl` client config bundle ([gemconfig](/docs/user-guide/gemconfig-file)).
This config bundle lives in `$HOME/.gem/config`, and is generated
by `cluster/gem-up.sh`. Sample steps for sharing `gemconfig` below.

**1. Create a cluster**

```shell
$ cluster/gem-up.sh
```

**2. Copy `gemconfig` to new host**

```shell
$ scp $HOME/.gem/config user@remotehost:/path/to/.gem/config
```

**3. On new host, make copied `config` available to `gemctl`**

* Option A: copy to default location

```shell
$ mv /path/to/.gem/config $HOME/.gem/config
```

* Option B: copy to working directory (from which gemctl is run)

```shell
$ mv /path/to/.gem/config $PWD
```

* Option C: manually pass `gemconfig` location to `gemctl`

```shell
# via environment variable
$ export GEMCONFIG=/path/to/.gem/config

# via commandline flag
$ gemctl ... --gemconfig=/path/to/.gem/config
```

## Manually Generating `gemconfig`

`gemconfig` is generated by `gem-up` but you can generate your own
using (any desired subset of) the following commands.

```shell
# create gemconfig entry
$ gemctl config set-cluster $CLUSTER_NICK \
    --server=https://1.1.1.1 \
    --certificate-authority=/path/to/apiserver/ca_file \
    --embed-certs=true \
    # Or if tls not needed, replace --certificate-authority and --embed-certs with
    --insecure-skip-tls-verify=true \
    --gemconfig=/path/to/standalone/.gem/config

# create user entry
$ gemctl config set-credentials $USER_NICK \
    # bearer token credentials, generated on gem master
    --token=$token \
    # use either username|password or token, not both
    --username=$username \
    --password=$password \
    --client-certificate=/path/to/crt_file \
    --client-key=/path/to/key_file \
    --embed-certs=true \
    --gemconfig=/path/to/standalone/.gem/config

# create context entry
$ gemctl config set-context $CONTEXT_NAME --cluster=$CLUSTER_NICKNAME --user=$USER_NICK
```

Notes:

* The `--embed-certs` flag is needed to generate a standalone
`gemconfig`, that will work as-is on another host.
* `--gemconfig` is both the preferred file to load config from and the file to
save config too. In the above commands the `--gemconfig` file could be
omitted if you first run

```shell
$ export GEMCONFIG=/path/to/standalone/.gem/config
```

* The ca_file, key_file, and cert_file referenced above are generated on the
gem master at cluster turnup. They can be found on the master under
`/srv/gemini`. Bearer token/basic auth are also generated on the gem master.

For more details on `gemconfig` see [gemconfig-file.md](/docs/user-guide/gemconfig-file),
and/or run `gemctl config -h`.

## Merging `gemconfig` Example

`gemctl` loads and merges config from the following locations (in order)

1. `--gemconfig=/path/to/.gem/config` command line flag
2. `GEMCONFIG=/path/to/.gem/config` env variable
3. `$PWD/.gem/config`
4. `$HOME/.gem/config`

If you create clusters A, B on host1, and clusters C, D on host2, you can
make all four clusters available on both hosts by running

```shell
# on host2, copy host1's default gemconfig, and merge it from env
$ scp host1:/path/to/home1/.gem/config /path/to/other/.gem/config

$ export $GEMCONFIG=/path/to/other/.gem/config

# on host1, copy host2's default gemconfig and merge it from env
$ scp host2:/path/to/home2/.gem/config /path/to/other/.gem/config

$ export $GEMCONFIG=/path/to/other/.gem/config
```

Detailed examples and explanation of `gemconfig` loading/merging rules can be found in [gemconfig-file](/docs/user-guide/gemconfig-file).