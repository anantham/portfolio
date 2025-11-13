const fs = require('fs')
const path = require('path')

function usage() {
  console.log('Usage: node scripts/visualize_wheel.js <log-file> [--width <px>] [--height <px>]')
  process.exit(1)
}

const args = process.argv.slice(2)
if (args.length === 0) {
  usage()
}

const options = {
  width: null,
  height: null
}

let logPath = null
for (let i = 0; i < args.length; i++) {
  const arg = args[i]
  if (arg === '--width') {
    options.width = Number(args[++i])
  } else if (arg === '--height') {
    options.height = Number(args[++i])
  } else if (!logPath) {
    logPath = arg
  }
}

if (!logPath) usage()

const resolvedPath = path.isAbsolute(logPath)
  ? logPath
  : path.join(process.cwd(), logPath)

if (!fs.existsSync(resolvedPath)) {
  console.error(`Log file not found: ${resolvedPath}`)
  process.exit(1)
}

const logData = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'))
const metadata = logData.metadata || {}
const summary = logData.summary || {}
const samples = logData.log || []

if (samples.length === 0) {
  console.error('Log contains no samples to plot.')
  process.exit(1)
}

const width = options.width || metadata.width || 1280
const height = options.height || metadata.height || 720

const startTime = samples[0].t || 0
const endTime = samples[samples.length - 1].t || startTime
const duration = endTime - startTime

const title = path.basename(resolvedPath)

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${title} – wheel path</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      margin: 0;
      background: #0f172a;
      color: #e2e8f0;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px;
      gap: 16px;
    }
    canvas {
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(15, 23, 42, 0.45);
    }
    .meta {
      max-width: 960px;
      width: 100%;
      background: rgba(15, 23, 42, 0.6);
      border-radius: 12px;
      padding: 16px 20px;
      line-height: 1.5;
      box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.15);
    }
    code {
      font-family: 'JetBrains Mono', 'Fira Code', 'SFMono-Regular', monospace;
      font-size: 0.85rem;
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <canvas id="wheel-canvas" width="${width}" height="${height}"></canvas>
  <div class="meta">
    <strong>Summary</strong><br />
    Samples: <code>${samples.length}</code><br />
    Time span: <code>${duration.toFixed(0)} ms</code><br />
    X range: <code>${summary.minX?.toFixed(1) ?? '–'} → ${summary.maxX?.toFixed(1) ?? '–'}</code><br />
    Y range: <code>${summary.minY?.toFixed(1) ?? '–'} → ${summary.maxY?.toFixed(1) ?? '–'}</code><br />
    Speed range: <code>${summary.minSpeed?.toFixed(2) ?? '–'} → ${summary.maxSpeed?.toFixed(2) ?? '–'}</code>
  </div>
  <script>
    const samples = ${JSON.stringify(samples)}
    const canvas = document.getElementById('wheel-canvas')
    const ctx = canvas.getContext('2d')

    ctx.lineWidth = 2
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, '#38bdf8')
    gradient.addColorStop(0.5, '#c084fc')
    gradient.addColorStop(1, '#f97316')
    ctx.strokeStyle = gradient

    ctx.beginPath()
    samples.forEach((point, index) => {
      const x = point.x
      const y = point.y
      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()

    ctx.fillStyle = '#0f172a'
    ctx.beginPath()
    ctx.arc(samples[0].x, samples[0].y, 6, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#f97316'
    ctx.beginPath()
    const last = samples[samples.length - 1]
    ctx.arc(last.x, last.y, 6, 0, Math.PI * 2)
    ctx.fill()
  </script>
</body>
</html>
`

const outputDir = path.join(__dirname, '..', 'visualizations')
fs.mkdirSync(outputDir, { recursive: true })

const outputName = path.basename(resolvedPath, path.extname(resolvedPath)) + '.html'
const outputPath = path.join(outputDir, outputName)
fs.writeFileSync(outputPath, html, 'utf8')

console.log(`Visualization written to ${outputPath}`)
console.log('Open this file in a browser to inspect the path.')
