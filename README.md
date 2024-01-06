# One-Click Audio Device Switcher

## Overview

The "One-Click Audio Device Switcher" is a simple command-line tool written in Node.js that allows users to easily switch between audio devices on a Windows system. It leverages PowerShell scripts to gather information about available audio devices and provides a one-click solution for switching between predefined sets of audio input and output devices.

## Features

- **User-friendly:** Intuitive command-line interface for selecting and switching between audio devices.
- **Configuration:** Saves the given Configuration of audio devices to switch between audio devices.
- **PowerShell:** Utilizes PowerShell scripts to interact with Windows audio devices.

## Usage

To use the "One-Click Audio Device Switcher," follow these steps:

1. Run the script: `npm start`
2. If no configuration is set, the script will prompt you to choose your preferred audio devices for two different configurations (Option A and Option B).
3. Once configurations are set, the script will automatically switch between devices.
4. For Resetting the configurations 

## Requirements

- Node.js
- PowerShell (Ensure execution policy allows running scripts)
- PowerShell Package: AudioDeviceCmdlets is installed (otherwise there is a `setup.ps1` file, which can be executed to install)

## Configuration

The configuration is stored in a JSON file (`confg.json`). If you need to modify configurations manually, you can edit this file.
To reset the configuration you are also able to delete the JSON File (`confg.json`).

## License

I don't know, yet.

## Author

zanchho
