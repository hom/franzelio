// share.js

/**
 * Mapping enums to numerical codes for compact representation.
 */
const COLOR_MAP = {
    black: 0,
    red: 1,
    green: 2,
    blue: 3,
    darkgray: 4, // For 'silent' mode lines
    darkred: 5,  // For 'burner' mode lines
    magenta: 6,  // For 'splitter' mode lines
  };
  
  const MODE_MAP = {
    draw: 0,
    erase: 1,
    toggle: 2,
    silent: 3,
    burner: 4,
    splitter: 5,
  };
  
  
  // In share.js
  
  /**
   * The encodeState function converts the instrument's state into a compact Base64URL string.
   * It scales normalized coordinates (0 to 1) to unsigned 16-bit integers (0 to 65535)
   * for efficient storage. This ensures that when the state is shared and loaded on devices
   * with different screen sizes, the positions and sizes remain proportionally accurate.
   */
  
  export function encodeState(state) {
    const lines = state.lines || [];
    const dots = state.dots || [];
    const predrawnLine = state.predrawnLine;
  
    // Estimate the total buffer size needed
    let bufferLength = 1 + 1 + 1 + 1; // Flags and settings (4 bytes)
    bufferLength += 2 + lines.length * 11; // Lines data
    bufferLength += 1 + (predrawnLine ? 9 : 0); // PredrawnLine data
    bufferLength += 2 + dots.length * 9; // Dots data
  
    const buffer = new Uint8Array(bufferLength);
    let offset = 0;
  
    // Encode flags and settings
    buffer[offset++] = state.isSoundOn ? 1 : 0; // Sound state (1 byte)
    buffer[offset++] = COLOR_MAP[state.currentBallColor] !== undefined ? COLOR_MAP[state.currentBallColor] : 0; // Current ball color (1 byte)
    buffer[offset++] = Math.round((state.dropRateValue || 1) * 10); // Drop rate scaled by 10 (1 byte)
    buffer[offset++] = MODE_MAP[state.currentMode] !== undefined ? MODE_MAP[state.currentMode] : 0; // Current mode (1 byte)
  
    // Encode number of lines
    buffer[offset++] = (lines.length >> 8) & 0xff; // High byte
    buffer[offset++] = lines.length & 0xff;        // Low byte
  
    // Encode each line
    for (const line of lines) {
      // Scale normalized coordinates (0 to 1) to unsigned 16-bit integers (0 to 65535)
      const x1 = clamp(Math.round(line.x1 * 65535), 0, 65535);
      const y1 = clamp(Math.round(line.y1 * 65535), 0, 65535);
      const x2 = clamp(Math.round(line.x2 * 65535), 0, 65535);
      const y2 = clamp(Math.round(line.y2 * 65535), 0, 65535);
  
      // Store coordinates as unsigned 16-bit integers (2 bytes each)
      buffer[offset++] = (x1 >> 8) & 0xff; // x1 high byte
      buffer[offset++] = x1 & 0xff;        // x1 low byte
      buffer[offset++] = (y1 >> 8) & 0xff; // y1 high byte
      buffer[offset++] = y1 & 0xff;        // y1 low byte
      buffer[offset++] = (x2 >> 8) & 0xff; // x2 high byte
      buffer[offset++] = x2 & 0xff;        // x2 low byte
      buffer[offset++] = (y2 >> 8) & 0xff; // y2 high byte
      buffer[offset++] = y2 & 0xff;        // y2 low byte
  
      buffer[offset++] = COLOR_MAP[line.color] !== undefined ? COLOR_MAP[line.color] : 0; // Line color (1 byte)
      buffer[offset++] = MODE_MAP[line.mode] !== undefined ? MODE_MAP[line.mode] : 0;     // Line mode (1 byte)
      buffer[offset++] = line.isActive ? 1 : 0;      // Line active state (1 byte)
    }
  
    // Encode the predrawnLine if it exists
    if (predrawnLine) {
      buffer[offset++] = 1; // PredrawnLine exists (1 byte)
  
      // Scale coordinates
      const x1 = clamp(Math.round(predrawnLine.x1 * 65535), 0, 65535);
      const y1 = clamp(Math.round(predrawnLine.y1 * 65535), 0, 65535);
      const x2 = clamp(Math.round(predrawnLine.x2 * 65535), 0, 65535);
      const y2 = clamp(Math.round(predrawnLine.y2 * 65535), 0, 65535);
  
      // Store coordinates
      buffer[offset++] = (x1 >> 8) & 0xff;
      buffer[offset++] = x1 & 0xff;
      buffer[offset++] = (y1 >> 8) & 0xff;
      buffer[offset++] = y1 & 0xff;
      buffer[offset++] = (x2 >> 8) & 0xff;
      buffer[offset++] = x2 & 0xff;
      buffer[offset++] = (y2 >> 8) & 0xff;
      buffer[offset++] = y2 & 0xff;
  
      buffer[offset++] = COLOR_MAP[predrawnLine.color] !== undefined ? COLOR_MAP[predrawnLine.color] : 0; // PredrawnLine color (1 byte)
    } else {
      buffer[offset++] = 0; // PredrawnLine does not exist
    }
  
    // Encode number of dots
    buffer[offset++] = (dots.length >> 8) & 0xff; // High byte
    buffer[offset++] = dots.length & 0xff;        // Low byte
  
    // Encode each dot
    for (const dot of dots) {
      // Scale normalized positions to unsigned 16-bit integers
      const posX = clamp(Math.round(dot.position[0] * 65535), 0, 65535);
      const posY = clamp(Math.round(dot.position[1] * 65535), 0, 65535);
  
      // Velocities can be negative; shift range from -1 to +1 to 0 to 65535
      const velX = clamp(Math.round((dot.velocity.x + 1) * 32767.5), 0, 65535);
      const velY = clamp(Math.round((dot.velocity.y + 1) * 32767.5), 0, 65535);
  
      // Store positions
      buffer[offset++] = (posX >> 8) & 0xff;
      buffer[offset++] = posX & 0xff;
      buffer[offset++] = (posY >> 8) & 0xff;
      buffer[offset++] = posY & 0xff;
  
      // Store velocities
      buffer[offset++] = (velX >> 8) & 0xff;
      buffer[offset++] = velX & 0xff;
      buffer[offset++] = (velY >> 8) & 0xff;
      buffer[offset++] = velY & 0xff;
  
      buffer[offset++] = COLOR_MAP[dot.color] !== undefined ? COLOR_MAP[dot.color] : 0; // Dot color (1 byte)
    }
  
    // Convert the buffer to a binary string
    let binary = '';
    for (let i = 0; i < buffer.length; i++) {
      binary += String.fromCharCode(buffer[i]);
    }
  
    // Base64URL encode the binary string
    const base64 = btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, ''); // Remove padding
  
    return base64;
  }
  
  
  /**
   * The decodeState function deciphers the Base64URL string back into the instrument's state.
   * It converts the stored unsigned 16-bit integers back to normalized coordinates (0 to 1),
   * which are then denormalized in applyState() to match the current canvas size.
   * This ensures the shared instrument appears correctly on different devices.
   */
  
  export function decodeState(base64String) {
    try {
      // Restore padding for Base64 decoding
      let base64 = base64String.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) {
        base64 += '=';
      }
  
      // Decode the Base64 string to a binary string
      const binary = atob(base64);
      const buffer = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        buffer[i] = binary.charCodeAt(i);
      }
  
      let offset = 0;
  
      // Decode flags and settings
      const isSoundOn = buffer[offset++] === 1; // Sound state
  
      const currentBallColorCode = buffer[offset++];
      let currentBallColor = getKeyByValue(COLOR_MAP, currentBallColorCode);
      if (currentBallColor === null) {
        console.warn(`Unknown ball color code: ${currentBallColorCode}, defaulting to 'black'`);
        currentBallColor = 'black';
      }
  
      const dropRateValue = (buffer[offset++] || 10) / 10; // Drop rate
  
      const currentModeCode = buffer[offset++];
      let currentMode = getKeyByValue(MODE_MAP, currentModeCode);
      if (currentMode === null) {
        console.warn(`Unknown mode code: ${currentModeCode}, defaulting to 'draw'`);
        currentMode = 'draw';
      }
  
      // Decode number of lines
      const numLines = (buffer[offset++] << 8) | buffer[offset++];
  
      const lines = [];
      // Decode each line
      for (let i = 0; i < numLines; i++) {
        const x1Int = (buffer[offset++] << 8) | buffer[offset++];
        const y1Int = (buffer[offset++] << 8) | buffer[offset++];
        const x2Int = (buffer[offset++] << 8) | buffer[offset++];
        const y2Int = (buffer[offset++] << 8) | buffer[offset++];
  
        // Convert integers back to normalized coordinates (0 to 1)
        const x1f = x1Int / 65535;
        const y1f = y1Int / 65535;
        const x2f = x2Int / 65535;
        const y2f = y2Int / 65535;
  
        const colorCode = buffer[offset++];
        let color = getKeyByValue(COLOR_MAP, colorCode);
        if (color === null) {
          console.warn(`Unknown color code: ${colorCode}, defaulting to 'black'`);
          color = 'black';
        }
  
        const modeCode = buffer[offset++];
        let mode = getKeyByValue(MODE_MAP, modeCode);
        if (mode === null) {
          console.warn(`Unknown mode code: ${modeCode}, defaulting to 'draw'`);
          mode = 'draw';
        }
  
        const isActive = buffer[offset++] === 1;
        lines.push({ x1: x1f, y1: y1f, x2: x2f, y2: y2f, color, mode, isActive });
      }
  
      // Decode the predrawnLine if it exists
      const hasPredrawnLine = buffer[offset++] === 1;
      let predrawnLine = null;
      if (hasPredrawnLine) {
        const x1Int = (buffer[offset++] << 8) | buffer[offset++];
        const y1Int = (buffer[offset++] << 8) | buffer[offset++];
        const x2Int = (buffer[offset++] << 8) | buffer[offset++];
        const y2Int = (buffer[offset++] << 8) | buffer[offset++];
  
        const x1f = x1Int / 65535;
        const y1f = y1Int / 65535;
        const x2f = x2Int / 65535;
        const y2f = y2Int / 65535;
  
        const colorCode = buffer[offset++];
        let color = getKeyByValue(COLOR_MAP, colorCode);
        if (color === null) {
          console.warn(`Unknown predrawn line color code: ${colorCode}, defaulting to 'black'`);
          color = 'black';
        }
        predrawnLine = { x1: x1f, y1: y1f, x2: x2f, y2: y2f, color };
      }
  
      // Decode number of dots
      const numDots = (buffer[offset++] << 8) | buffer[offset++];
  
      const dots = [];
      // Decode each dot
      for (let i = 0; i < numDots; i++) {
        const posXInt = (buffer[offset++] << 8) | buffer[offset++];
        const posYInt = (buffer[offset++] << 8) | buffer[offset++];
  
        const velXInt = (buffer[offset++] << 8) | buffer[offset++];
        const velYInt = (buffer[offset++] << 8) | buffer[offset++];
  
        // Convert integers back to normalized positions (0 to 1)
        const posXf = posXInt / 65535;
        const posYf = posYInt / 65535;
  
        // Convert velocities back to -1 to +1 range
        const velXf = (velXInt / 32767.5) - 1;
        const velYf = (velYInt / 32767.5) - 1;
  
        const colorCode = buffer[offset++];
        let color = getKeyByValue(COLOR_MAP, colorCode);
        if (color === null) {
          console.warn(`Unknown dot color code: ${colorCode}, defaulting to 'black'`);
          color = 'black';
        }
  
        dots.push({
          position: [posXf, posYf],
          velocity: { x: velXf, y: velYf },
          color,
        });
      }
  
      // Return the decoded state
      return {
        isSoundOn,
        currentBallColor,
        dropRateValue,
        currentMode,
        lines,
        predrawnLine,
        dots,
      };
    } catch (error) {
      console.error('Failed to decode state:', error);
      return null;
    }
  }
  
  
  
  /**
   * Generates a shareable URL with the encoded state using the query parameter.
   * @param {Object} state - The instrument state to encode.
   * @returns {String} - The full shareable URL.
   */
  export function getShareableURL(state) {
    const base64State = encodeState(state);
    const url = new URL(window.location.href);
    url.searchParams.set('share', base64State);
    return url.toString();
  }
  
  /**
   * Handles incoming shared state from the URL query parameters.
   * Resets the URL after loading the state without reloading the page.
   * @param {Instrument} instrument - The instrument instance to apply the state to.
   */
  export function handleIncomingShare(instrument) {
    const params = new URLSearchParams(window.location.search);
    const sharedState = params.get('share');
    if (sharedState) {
      const state = decodeState(sharedState);
      if (state) {
        instrument.applyState(state);
        // Reset the URL without the query parameter without reloading the page
        const url = new URL(window.location.href);
        url.searchParams.delete('share');
        window.history.replaceState({}, document.title, url.pathname + url.search);
      } else {
        console.warn('Received invalid shared state.');
      }
    }
  }
  
  /**
   * Helper function to get key by value from a map.
   * @param {Object} map - The map object.
   * @param {Number} value - The value to search for.
   * @returns {String|null} - The corresponding key or null if not found.
   */
  function getKeyByValue(map, value) {
    const key = Object.keys(map).find((key) => map[key] === value);
    return key !== undefined ? key : null;
  }
  
  
  /**
   * Clamps a number between min and max.
   * @param {Number} num - The number to clamp.
   * @param {Number} min - Minimum value.
   * @param {Number} max - Maximum value.
   * @returns {Number} - The clamped number.
   */
  function clamp(num, min, max) {
    return Math.min(Math.max(num, min), max);
  }
  