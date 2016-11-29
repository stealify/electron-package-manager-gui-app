<h1 align="center">
  <a href="https://github.com/pipam/pipam"><img src="assets/banner.png" alt="Pipam" width="480" height="270"/></a><br>
</h1>

| Service                         | Badge                                                                                                          |
|---------------------------------|----------------------------------------------------------------------------------------------------------------|
| Travis (macOS and Linux Builds) | [![Travis](https://img.shields.io/travis/pipam/pipam.svg)](https://travis-ci.org/pipam/pipam)                  |
| AppVeyor (Windows Builds)       | [![AppVeyor](https://img.shields.io/appveyor/ci/facekapow/pipam.svg)](https://ci.appveyor.com/project/facekapow/pipam) |
| Coveralls.io (Code Coverage)    | [![Coveralls](https://img.shields.io/coveralls/pipam/pipam.svg)](https://coveralls.io/github/pipam/pipam)      |

A package manager manager.

Pipam is little app that helps you manage your packages across different package managers. E.g. manage packages from apt-get, Homebrew, and more (hopefully npm, bundler, pip, etc. in the future).

## Why?

Well...

1. GUIs ftw! Most package managers only offer CLI interfaces, Pipam can provide a GUI interface for them.
2. Everything's in one place.
3. Why would you need any more reasons?

Also, Pipam is extensible, so you're not stuck with just the default managers. If your favorite package manager doesn't have a Pipam plugin yet, you can [write one](./docs/plugins/README.md)! It's pretty straightforward to install and use plugins, but if it isn't to you, then you can get some help... [here](./docs/managing-plugins.md).

## Where can I start?

  * [Visit Pipam's website](https://pipam.github.io) and head to the Downloads section for the latest version.
  * Or... check out the [Releases](https://github.com/pipam/pipam/releases) for all available versions.

## Why the weird name?

Pipam stands for ***P***luginable ***I***nterface for ***PA***ckage ***M***anagers. So, yeah.

Originally it was going to be ***P***latform ***I***ndependent ***P***ackage ***A***daptable ***M***anager, but that makes no sense whatsoever. It *is* platform independent, but the whole pluginable thing is more appropriate for what it actually is.