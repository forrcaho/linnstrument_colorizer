export const connectToMidi = async (): Promise<MIDIOutput | undefined> => {
  try {
    const midiAccess = await navigator.requestMIDIAccess()
    const outputs = midiAccess.outputs.values()

    for (const output of outputs) {
      if (output.name === 'LinnStrument MIDI') {
        alert(
          'LinnStrument found!\n' +
            'Make sure your LinnStrument is listening on MIDI channel 1,\n' +
            'and send colors when ready.'
        )
        return output
      }
    }
    alert('Could not find your LinnStrument\nPlease make sure it is connected and try again')
  } catch (error) {
    alert('Could not find your LinnStrument\nPlease restart your browser')
    console.error('Error connecting to MIDI instrument:', error)
  }
}

/*
You can set any of LinnStrument's note pad to any color by sending LinnStrument a series of three MIDI Control Change messages:

1) CC20: Column number of note pad to change (control key column is 0, left play column is 1, right play column is 25)

2) CC21: Row number of note pad to change (bottom row is 0, top is 7)

3) CC22: Color to change it to (0=as set in Note Lights settings, 1=red, 2=yellow, 3=green, 4=cyan, 5=blue, 6=magenta, 7=off, 8=white, 9= orange, 10=lime and 11=pink).

First send CC20 and CC21 to select the column and row to be lit, then send CC22 to light it.

There are two addition CC messages that are related only the three custom light patterns in Scale Select memories A, A# and B:

4) CC23:  Save loaded light pattern to flash.
After sending a new light pattern to LinnStrument, send a CC23 message with value 0, 1 or 2 to save it to Scale Select memory A, A# or B, respectively.

5) CC24.: Clear custom light pattern from flash.
Send a CC24 message with value 0, 1 or 2 to clear Scale Select pattern A, A# or B, respectively.

‍
*/

export const sendColor = (
  device: MIDIOutput,
  rowIndex: number,
  colIndex: number,
  colorNumber: number
) => {
  const deviceRow = 7 - rowIndex
  const deviceColumn = colIndex + 1
  device.send([0xb0, 20, deviceColumn])
  device.send([0xb0, 21, deviceRow])
  device.send([0xb0, 22, colorNumber])
}

export const saveColors = (device: MIDIOutput, memory: number) => {
  device.send([0xb0, 23, memory])
}

export const clearColors = (device: MIDIOutput, memory: number) => {
  device.send([0xb0, 24, memory])
}
