# pi-startup-time

A small [pi](https://github.com/liborw/pi-coding-agent) package that measures startup time and shows the latest reading in the status bar.

## Install

```bash
pi install npm:@liborw/pi-startup-time
```

Or use the GitHub repo directly:

```bash
pi install git:github.com/liborw/pi-startup-time
```

## What it does

- Measures startup time on `session_start`
- Shows the result in the footer status line
- Adds `/startup-time` to display the latest recorded value

## Package contents

- `src/index.ts` - pi extension entry point

## Development

```bash
pi -e ./src/index.ts
```
