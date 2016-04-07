---
---

You can either build a release from sources or download a pre-built release.  If you do not plan on developing Gemini itself, we suggest a pre-built release. 

* TOC
{:toc}

### Prebuilt Binary Release

The list of binary releases is available for download from the [GitHub Gemini repo release page](https://github.com/gemini-project/gemini/releases).

Download the latest release and unpack this tar file on Linux or OS X, cd to the created `gemini/` directory, and then follow the getting started guide for your cloud.

On OS X you can also use the [homebrew](http://brew.sh/) package manager: `brew install gemini-cli`

### Building from source

Get the Gemini source.  If you are simply building a release from source there is no need to set up a full golang environment as all building happens in a Docker container.

Building a release is simple.

```shell
git clone https://github.com/gemini-project/gemini.git
cd gemini
make release
```

For more details on the release process see the [`build/` directory](http://releases.gem.io/{{page.githubbranch}}/build/)

### Download Gemini and automatically set up a default cluster

The bash script at `https://get.gem.io`, which can be run with `wget` or `curl`, automatically downloads Gemini, and provisions a cluster based on your desired cloud provider.

```shell
# wget version
export GEMINI_PROVIDER=YOUR_PROVIDER; wget -q -O - https://get.gem.io | bash

# curl version
export GEMINI_PROVIDER=YOUR_PROVIDER; curl -sS https://get.gem.io | bash
```

Possible values for `YOUR_PROVIDER` include:

* `gce` - Google Compute Engine [default]
* `gke` - Google Container Engine
* `aws` - Amazon EC2
* `azure` - Microsoft Azure
* `vagrant` - Vagrant (on local virtual machines)
* `vsphere` - VMWare VSphere
* `rackspace` - Rackspace

For the complete, up-to-date list of providers supported by this script, see [the `/cluster` folder in the main Gemini repo](https://github.com/gemini-project/gemini/tree/{{page.githubbranch}}/cluster), where each folder represents a possible value for `YOUR_PROVIDER`. If you don't see your desired provider, try looking at our [getting started guides](/docs/getting-started-guides); there's a good chance we have docs for them.
