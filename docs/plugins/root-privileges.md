# Root Privileges

What do you do if your package manager needs root/admin privileges?
Well, you have to display a graphical password prompt, of course!

## Packages that do this

  * [`electron-sudo`](https://github.com/automation-stack/electron-sudo) is *probably* the best package for this. It provides both `exec` and `spawn` (`spawn` is especially useful for [providing logs](./logs.md))
  * [`sudo-prompt`](https://github.com/jorangreef/sudo-prompt) is another good option, however it only provides `exec`
