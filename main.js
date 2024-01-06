const util = require("util")
const exec = util.promisify(require("child_process").exec)
const fs = require("fs")
const prompt = require("prompt-sync")()

let targetDevice = "{0.0.0.00000000}.{8d949fce-83a5-405f-be7f-a47a91fe7869}"

const cgfFile = "./confg.json"

let confg
const main = async () => {
  const getAllAudioDevicesCommand = `getAllAudioDevices.ps1`

  try {
    confg = await fetchConfig()
    console.log("Using received Configuration")
  } catch (error) {
    console.log("Need to set config")
  }

  if (!isConfigSet(confg)) {
    await execPSFile(getAllAudioDevicesCommand, true).then(async res => {
      await setConfigViaPrompt([...res])
    })
  } else {
    await execPSFile(getAllAudioDevicesCommand, true).then(async res => {
      if (!isConfigSet(confg)) return

      targetDevice = isDeviceActive(confg.optionA.output, res)
        ? confg.optionB.output.ID
        : confg.optionA.output.ID
      const switchAudioDeviceCommand = `switchAudioDevice.ps1" -targetDeviceId "${targetDevice}`

      await execPSFile(switchAudioDeviceCommand)
    })
  }
}

function isDeviceActive(device, dvcArr) {
  if (!device || !dvcArr) return false
  const arr = [...dvcArr]
  const deviceInArr = arr.find(dvc => dvc.ID === device.ID)
  if (!deviceInArr) return false

  return (
    deviceInArr.Default.trim() === "true" ||
    deviceInArr.DefaultCommunication.trim() === "true"
  )
}

function isConfigSet(cfg) {
  return !(!cfg || !cfg.optionA || !cfg.optionB)
}

async function setConfigViaPrompt(devices) {
  const newCfg = {}
  const pb = "Playback"
  const rec = "Recording"
  do {
    console.log("SELECTING OPTION A:")
    const aOut = resolvePromptOfDevices(
      devices,
      pb,
      "Choose Index of Option A Output Device:"
    )
    const aIn = resolvePromptOfDevices(
      devices,
      rec,
      "Choose Index of Option A Input Device:"
    )
    console.log()
    console.log("SELECTING OPTION B:")
    const bOut = resolvePromptOfDevices(
      devices,
      pb,
      "Choose Index of Option B Output Device:"
    )
    const bIn = resolvePromptOfDevices(
      devices,
      rec,
      "Choose Index of Option B Input Device:"
    )
    newCfg.optionA = { output: aOut, input: aIn }
    newCfg.optionB = { output: bOut, input: bIn }
  } while (!isConfigSet(newCfg))
  confg = newCfg
  writeCfgToFile(JSON.stringify(newCfg))
}

function resolvePromptOfDevices(devices, type, promtText) {
  let pickedIndex = -1
  const possibleOptions = devices.filter(device => device.Type === type)
  if (possibleOptions.length === 1) {
    console.log("Automatically picked the only Option available:")
    dumpAllRelevantDeviceData(possibleOptions, type)
    const { Index, Type, Name, ID } = possibleOptions[0]
    return { Index: Index, Type: Type, Name: Name, ID: ID }
  }
  while (!possibleOptions.some(device => device.Index === pickedIndex)) {
    dumpAllRelevantDeviceData(devices, type)
    pickedIndex = Number.parseInt(prompt(promtText))
  }
  const { Index, Type, Name, ID } = possibleOptions.find(device => {
    return device.Index === pickedIndex
  })
  return { Index: Index, Type: Type, Name: Name, ID: ID }
}

function prepTable(inputArr) {
  const arr = [...inputArr]
  const maxLengths = {}

  // find max length
  for (const obj of arr) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = String(obj[key])
        const keyVal = String(key)
        const currentMaxLength = maxLengths[key] || keyVal.length || 0
        maxLengths[key] = Math.max(currentMaxLength, value.length)
      }
    }
  }

  // fill to max length with spaces
  for (const obj of arr) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = String(obj[key])
        const maxLength = maxLengths[key]
        const paddedValue = value.padEnd(maxLength, " ") // pad w/ spaces
        obj[key] = paddedValue
      }
    }
  }

  //produce Table outPutString
  let topSep = ""
  let midSep = ""
  let botSep = ""
  let paddedKeys = []
  let keyArr = Object.keys(maxLengths)
  for (let i = 0; i < keyArr.length; i++) {
    const key = keyArr[i]
    //padkeys
    paddedKeys.push(keyArr[i].padEnd(maxLengths[key], " "))
    //create Top Seperator
    topSep += "─".repeat(maxLengths[key]) + (!keyArr[i + 1] ? "" : "┬")
    //create Mid Seperator
    midSep += "─".repeat(maxLengths[key]) + (!keyArr[i + 1] ? "" : "┼")
    //create Bot Seperator
    botSep += "─".repeat(maxLengths[key]) + (!keyArr[i + 1] ? "" : "┴")
  }

  res = `┌${topSep}┐\n` + `│${paddedKeys.join("│")}│`
  for (const obj of arr) {
    res += `\n├${midSep}┤\n│`
    for (const key in obj) {
      res += `${obj[key]}│`
    }
  }
  res += `\n└${botSep}┘`
  return res
}

function customConsoleTable(arr) {
  if (!Array.isArray(arr) || arr.length === 0) {
    console.error("Invalid or empty Array")
    return
  }

  const tableStr = prepTable(arr)
  return tableStr
}

function dumpAllRelevantDeviceData(devices, type) {
  if (!devices || !type) {
    console.log("devices or type is undefined")
    return
  }

  const reducedObjArr = devices
    .filter(device => device.Type === type)
    .map(({ Index, Name, Type }) => ({ Index, Name, Type }))

  const res = customConsoleTable(reducedObjArr)
  console.log(res)
}

async function fetchConfig() {
  return new Promise((resolve, reject) => {
    fs.readFile(cgfFile, "utf8", (error, data) => {
      if (error) {
        reject(error)
        return
      }

      const val = JSON.parse(data)
      resolve(val)
    })
  })
}

// Function 2 execute PowerShell commands
async function execPSFile(fileName, shouldReturn) {
  shouldReturn = shouldReturn | false
  try {
    const { stdout } = await exec(
      `powershell -ExecutionPolicy Bypass -File "${__dirname}\\${fileName}"`
    )

    if (shouldReturn) return JSON.parse(stdout.trim())
    return
  } catch (error) {
    console.error("Error:", error.message)
    //maybe add to Execute setup.ps1 again
    throw error
  }
}
async function writeCfgToFile(newCfgStr) {
  fs.writeFile(cgfFile, newCfgStr, err => {
    if (err) throw err
    console.log("New Config Saved!")
    console.log("Restart to switch Audio Devices")
  })
}
main()

//// CLOUDFLARE PAGES
//supabase
