<script setup lang="ts">
import { ref } from 'vue'
import { connectToMidi, sendColor, saveColors, clearColors } from './utils/MIDI'

const instSize = ref({
  rows: 8,
  cols: 25
})

const colorChoices = [
  'gray', // This color never actually shows because the color is turned off for 0.
  'red',
  'yellow',
  'green',
  'cyan',
  'blue',
  'magenta',
  'black',
  'white',
  'orange',
  'lime',
  'pink'
]

const selectedIndex = ref(0)

const selectColor = (index: number) => {
  selectedIndex.value = index
}

const colorGrid = ref<number[][]>(
  Array.from({ length: instSize.value.rows }, () =>
    Array.from<number>({ length: instSize.value.cols }).fill(0)
  )
)

const setColor = (rowIndex: number, colIndex: number) => {
  if (colorGrid.value[rowIndex][colIndex] === selectedIndex.value) {
    colorGrid.value[rowIndex][colIndex] = 0
  } else {
    colorGrid.value[rowIndex][colIndex] = selectedIndex.value
  }
}

const clearAll = () => {
  for (let rows = 0; rows < instSize.value.rows; rows++) {
    for (let cols = 0; cols < instSize.value.cols; cols++) {
      colorGrid.value[rows][cols] = 0
    }
  }
}

const buildKey = (rowIndex: number, colIndex: number) => {
  return `${rowIndex}|${colIndex}|${colorGrid.value[rowIndex][colIndex]}`
}

const homingDots = [
  [0, 7],
  [0, 19],
  [1, 0],
  [1, 12],
  [1, 24],
  [2, 5],
  [2, 17],
  [3, 10],
  [3, 22],
  [4, 3],
  [4, 15],
  [5, 8],
  [5, 20],
  [6, 1],
  [6, 13],
  [7, 6],
  [7, 18]
]

const homingDot = (rowIndex: number, colIndex: number) => {
  return homingDots.some((el) => el[0] === rowIndex && el[1] === colIndex)
}

const homingDotColor = (rowIndex: number, colIndex: number) => {
  return colorChoices[colorGrid.value[rowIndex][colIndex]] === 'black' ? 'white' : 'black'
}

const MIDIDevice = ref<MIDIOutput | undefined>()
const getMIDIDevice = async () => {
  MIDIDevice.value = undefined // make sure there's no stale reference
  MIDIDevice.value = await connectToMidi()
}

const sendColorsToDevice = () => {
  if (!MIDIDevice.value) {
    alert('MIDI device is not connected\nCannot send colors')
    return
  }
  for (let i = 0; i < instSize.value.rows; i++) {
    for (let j = 0; j < instSize.value.cols; j++) {
      sendColor(MIDIDevice.value, i, j, colorGrid.value[i][j])
    }
  }
}

const memory = ref<number | undefined>()

const saveColorsToDevice = () => {
  if (!MIDIDevice.value) {
    alert('MIDI device is not connected\nCannot save colors')
    return
  }
  if (!memory.value) {
    alert('No memory selected\nCannot save colors')
    return
  }
  saveColors(MIDIDevice.value, memory.value)
}

const clearColorsFromDevice = () => {
  if (!MIDIDevice.value) {
    alert('MIDI device is not connected\nCannot save colors')
    return
  }
  if (!memory.value) {
    alert('No memory selected\nCannot save colors')
    return
  }
  clearColors(MIDIDevice.value, memory.value)
}
</script>

<template>
  <div class="container">
    <h1>LinnStrument Colorizer</h1>
    <div class="text">
      Use this MIDI webapp to send color patterns to your LinnStrument and save them.
      <ul>
        <li>
          Make sure your LinnStrument is usb connected to your computer, and click the "Connect to
          LinnStrument" button.
        </li>
        <li>
          Your browser should show you a dialog asking you whether you want to allow this webapp to
          send MIDI to your device. Say yes.
        </li>
        <li>When you are connected, the "Send colors to LinnStrument" button will be enabled.</li>
        <li>
          Choose a color from the palette by clicking on it, then click on the keys in the
          LinnStrument grid to set them to that color-- unless it is already that color, in which
          case it will be cleared (set to "unset"). The square on the left of the palette is
          "unset", meaning that the current color will not be changed. The black dot is "off", which
          will turn off any light that is currently set. The "Clear All" button at the right of the
          palette will clear all the keys so you can start over.
        </li>
        <li>
          If you want to save your light pattern to one of the LinnStrument's user memories, select
          the radio button for the memory you want to write. The last two buttons, "Save colors to
          selected memory" and "Clear colors from selected memory" will be enabled. Use these
          buttons to save or clear the selected memory.
        </li>
      </ul>
      <em
        >NOTE: If you're using Mozilla Firefox and this webapp doesn't seem to be doing anything,
        try restarting your browser. (Not just reloading the webapp -- restarting your browser).
        Firefox has weird ideas about MIDI security.</em
      >
    </div>
    <div class="palette">
      <div
        v-for="(color, index) in colorChoices"
        :key="color"
        :class="{ selected: index === selectedIndex }"
        :style="{ backgroundColor: index === 0 ? 'var(--inst-fg-color)' : 'black' }"
        class="palette-square"
        @click="selectColor(index)"
      >
        <div
          v-if="index !== 0"
          class="circle"
          :style="{
            backgroundColor: color,
            border: '2px solid ' + (color === 'black' ? 'white' : 'black')
          }"
        ></div>
      </div>
      <div><button @click="clearAll">Clear All</button></div>
    </div>

    <div class="linnstrument-container">
      <div class="grid-container">
        <div v-for="(row, rowIndex) in instSize.rows" :key="rowIndex" class="grid-row">
          <div
            v-for="(col, colIndex) in instSize.cols"
            :key="buildKey(rowIndex, colIndex)"
            class="grid-square"
            @click="setColor(rowIndex, colIndex)"
          >
            <div
              v-if="colorGrid[rowIndex][colIndex] !== 0"
              class="circle"
              :style="{
                backgroundColor: colorChoices[colorGrid[rowIndex][colIndex]]
              }"
            ></div>
            <div
              v-if="homingDot(rowIndex, colIndex)"
              class="homing-dot"
              :style="{ backgroundColor: homingDotColor(rowIndex, colIndex) }"
            ></div>
          </div>
        </div>
      </div>
      <div class="vertical-text">LinnStrument</div>
    </div>

    <div class="button-container">
      <button class="connect-button" @click="getMIDIDevice">Connect to LinnStrument</button>
      <button class="send-button" :disabled="!MIDIDevice" @click="sendColorsToDevice">
        Send colors to LinnStrument
      </button>
      <div class="radio-buttons">
        <span><input type="radio" name="memory" value="0" v-model="memory" />A </span>
        <span><input type="radio" name="memory" value="1" v-model="memory" />A# </span>
        <span><input type="radio" name="memory" value="2" v-model="memory" />B </span>
      </div>
      <button class="save-button" :disabled="!MIDIDevice || !memory" @click="saveColorsToDevice">
        Save colors to selected memory
      </button>
      <button class="save-button" :disabled="!MIDIDevice || !memory" @click="clearColorsFromDevice">
        Clear colors from selected memory
      </button>
    </div>
    <div class="text">
      <p>Copyright 2024 by Forrest Cahoon.</p>
      <p>
        Source is available
        <a href="https://github.com/forrcaho/linnstrument_colorizer">on github</a> under the MIT
        license. Please submit bugs and feature requests to
        <a href="https://github.com/forrcaho/linnstrument_colorizer/issues">issues</a>, or better
        yet, provide a
        <a href="https://github.com/forrcaho/linnstrument_colorizer/pulls">pull request</a>.
      </p>
    </div>
  </div>
</template>

<style scoped>
.container {
  --square-size: 35px;
  --inst-fg-color: #bbb;
  margin: auto;
  width: calc(var(--square-size) * v-bind('instSize.cols') + 50);
}
.palette {
  display: flex;
  padding: var(--square-size);
  width: calc(var(--square-size) * v-bind('colorChoices.length') * 1.5);
  margin: auto;
}

.palette-square {
  width: var(--square-size);
  height: var(--square-size);
  border: 2px solid transparent;
  margin: 5px;
  position: relative;
  cursor: pointer;
}

.palette-square.selected {
  border-color: white;
}
.linnstrument-container {
  display: flex;
  border: 5px solid black;
  background-color: black;
  grid-template-columns: auto auto;
  max-width: calc(var(--square-size) * v-bind('instSize.cols') + 50);
}

.grid-container {
  display: grid;
  gap: 5px;
  grid-template-columns: repeat(v-bind('instSize.cols'), var(--square-size));
  grid-auto-rows: var(--square-size);
}

.grid-row {
  display: contents;
}

.grid-square {
  border: 1px solid black;
  background-color: var(--inst-fg-color);
  position: relative;
}

.circle {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: calc(var(--square-size) / 2);
  height: calc(var(--square-size) / 2);
  border-radius: 50%;
}

.homing-dot {
  position: relative;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: black;
}

.vertical-text {
  background-color: black;
  color: white;
  font-size: 38px;
  font-weight: bolder;
  font-family:
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Oxygen,
    Ubuntu,
    Cantarell,
    'Open Sans',
    'Helvetica Neue',
    sans-serif;
  padding: 5px;
  writing-mode: vertical-lr;
  transform: rotate(180deg); /* Rotate text to display vertically upwards */
  white-space: nowrap; /* Prevent text wrapping */
  width: 50px;
}

.button-container {
  display: grid;
  padding: 50px;
  width: 250px;
}

button {
  margin: 10px;
}

.radio-buttons {
  color: white;
}
</style>
