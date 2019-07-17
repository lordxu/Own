let mc = getMainCanvas()
let gl = createWebGlContext(mc)

let vts = createShader(gl, gl.VERTEX_SHADER, vt_shader)
let fms = createShader(gl, gl.FRAGMENT_SHADER, fm_shader)

let program = createProgram(gl, vts, fms)

// found attribute and uniform
let positionAttributeLocation = gl.getAttribLocation(program, 'a_position')
let coordAttributeLocation = gl.getAttribLocation(program, 'a_textcoord')
// unifiorm attribute u_matrix
let matrixUniformLocation = gl.getUniformLocation(program, 'u_matrix')
let samplerUniformLocation = gl.getUniformLocation(program, 'u_texture')

// create and bind buffer
let positionBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
// buffer data
let positions = [
  0, 0, 0,
  0, 0, -100,
  100, 0, 0,
  0, 0, -100,
  100, 0, -100,
  100, 0, 0,

  0, 0, -100,
  0, 100, -100,
  100, 0, -100,
  0, 100, -100,
  100, 100, -100,
  100, 0, -100,

  100, 0, -100,
  100, 100, -100,
  100, 0, 0,
  100, 100, -100,
  100, 100, 0,
  100, 0, 0,

  0, 100, 0,
  100, 100, 0,
  0, 100, -100,
  0, 100, -100,
  100, 100, 0,
  100, 100, -100,

  0, 0, 0,
  100, 0, 0,
  0, 100, 0,
  0, 100, 0,
  100, 0, 0,
  100, 100, 0,

  0, 0, -100,
  0, 0, 0,
  0, 100, -100,
  0, 100, -100,
  0, 0, 0,
  0, 100, 0,
]
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)

// create and bind vao
let vao = gl.createVertexArray()
gl.bindVertexArray(vao)

// activate point attribute
gl.enableVertexAttribArray(positionAttributeLocation)
// bind the current ARRAY_BUFFER to attribute
let size = 3, type = gl.FLOAT, normalize = false, stride = 0, offset = 0
gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset)

/* ----------- texture attribute ---------- */

// activate color attribute
let colorBuffer = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
let textureCoord = new Float32Array([
  // A
  0, 0,
  0, 0.5,
  0.25, 0,
  0, 0.5,
  0.25, 0.5,
  0.25, 0,

  // B
  0.25, 0,
  0.25, 0.5,
  0.5, 0,
  0.25, 0.5,
  0.5, 0.5,
  0.5, 0,

  // C
  0.5, 0,
  0.5, 0.5,
  0.75, 0,
  0.5, 0.5,
  0.75, 0.5,
  0.75, 0,

  // D
  0.25, 0.5,
  0, 0.5,
  0.25, 1,
  0.25, 1,
  0, 0.5,
  0, 1,

  // E
  0.5, 0.5,
  0.25, 0.5,
  0.5, 1,
  0.5, 1,
  0.25, 0.5,
  0.25, 1,

  // F
  0.75, 0.5,
  0.5, 0.5,
  0.75, 1,
  0.75, 1,
  0.5, 0.5,
  0.5, 1,
])
gl.bufferData(gl.ARRAY_BUFFER, textureCoord, gl.STATIC_DRAW)
gl.enableVertexAttribArray(coordAttributeLocation)
// the data is 8 bit unsigned byte(0 - 255)
size = 2, type = gl.FLOAT, normalize = false, stride = 0, offset = 0
gl.vertexAttribPointer(coordAttributeLocation, size, type, normalize, stride, offset)

/* ----------- texture attribute ---------- */

// animation global variables
let then = 0, currot = 0
const rotPerSecond = 40

// texture and frame buffer
let texture, targetTexture, fb

function main () {
  // init texture and frame buffer
  initTextures()
  bindFrameBuffer(texture)

  // draw first screen
  requestAnimationFrame(render)
}

function render (now) {
  const targetWidth = targetHeight = 256
  // draw frame buffer first
  {
    // activate 
    gl.bindFrameBuffer(gl.FRAMEBUFFER, fb)
    gl.bindTexture(gl.TEXTURE_2D, texture)

    gl.viewport(0, 0, targetWidth, targetHeight)
    clear(gl)

    // see only clockwise triangles
    gl.enable(gl.CULL_FACE)

    // depth test
    gl.enable(gl.DEPTH_TEST)

    gl.useProgram(program)
    // bind the attribute/buffer we set
    gl.bindVertexArray(vao)

    drawObject(now, targetWidth, targetHeight)
  }

  // draw main scene
  {
    // make inner size the same as css size 
    resizeCanvas()

    // init window
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
    clear(gl)

    // see only clockwise triangles
    gl.enable(gl.CULL_FACE)

    // depth test
    gl.enable(gl.DEPTH_TEST)

    gl.useProgram(program)
    // bind the attribute/buffer we set
    gl.bindVertexArray(vao)

    drawObject(now)
  }
  
  // we call requestAnimationFrame again to keep on animating
  requestAnimationFrame(render)
}

function drawObject (now, width, height) {
  
  // inverse matrix of camera matrix
  let caPosition = [0, 0, 200], center = [0, 0, 0], up = [0, 1, 0]

  // be careful that this util handled invert by default, so we needn't do that by ourselves
  let caMatrix = m4.lookAt(m4unit(), caPosition, center, up)

  // perspective matrix
  let pov = Math.PI / 2
  let perspective = m4.perspective(m4unit(), pov, width / height, 1, 2000)

  /* ----------- animation ----------- */
  if (!then) then = now
  else {
    currot += (now - then) / 1000 * rotPerSecond
    then = now
  }
  /* ----------- animation ----------- */

  let rotationY = m4rotateY(toRad(currot))
  let translation = m4translate(0, 30, 0)
  let matrix = m4mul(rotationY, translation, caMatrix, perspective)
  gl.uniformMatrix4fv(matrixUniformLocation, false, matrix)

  // render
  let primitiveType = gl.TRIANGLES
  let offset = 0, count = 6 * 6
  gl.drawArrays(primitiveType, offset, count)
}

function resizeCanvas () {
  let cw = mc.width, ch = mc.height, sw = mc.clientWidth, sh = mc.clientHeight
  if (cw !== sw) mc.width = sw
  if (ch !== sh) mc.height = sh
}

function initTextures (targetWidth, targetHeigt) {
  /* ------- create and bind child texture stt ------- */

  texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)

  {
    const level = 0 // mipmap level
    const innerFormat = gl.R8 // gpu will get this format
    const width = 3
    const height = 2
    const border = 0
    const format = gl.RED // format in webgl
    const type = gl.UNSIGNED_BYTE //supplied format 
    const pixels = new Uint8Array([
      128, 64, 128,
      0, 192, 0
    ])
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1) // webgl, as opengl, only support 2**n data texture width, so an alignment should be given to pad it.
    gl.texImage2D(gl.TEXTURE_2D, level, innerFormat, width, height, border, format, type, pixels)
  }

  /* ------- create and bind child texture end ------- */

  /* ------- create and bind target texture stt ------- */

  targetTexture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, targetTexture)

  {
    const level = 0 // mipmap level
    const innerFormat = gl.RGB // gpu will get this format
    const width = targetWidth
    const height = targetHeigt
    const border = 0
    const format = gl.RGB // format in webgl
    const type = gl.UNSIGNED_BYTE //supplied format 
    const pixels = null
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1) // webgl, as opengl, only support 2**n data texture width, so an alignment should be given to pad it.
    gl.texImage2D(gl.TEXTURE_2D, level, innerFormat, width, height, border, format, type, pixels)
  }

  /* ------- create and bind target texture end ------- */
}

function bindFrameBuffer (texture) {
  // create a frame buffer to render on
  fb = gl.createFrameBuffer()
  gl.bindFrameBuffer(gl.FRAMEBUFFER, fb)

  // bind the frame buffer and our texture
  const attachmentPoint = gl.COLOR_ATTACHMENT0
  const level = 0
  gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl._TEXTURE2D, texture, level)
}

function clear () {
  gl.clearColor(0, 0, 0, 0)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
}

main()