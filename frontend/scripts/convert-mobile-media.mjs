// Produce smaller WebP assets for the offline Android build. Keep the source
// GIFs and JPEGs untouched so the website and its existing CDN remain unchanged.
import sharp from 'sharp'
import { readdir, mkdir, stat } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const media = [
  { source: resolve(scriptDir, '../../media/gif'), output: resolve(scriptDir, '../dist/gif'), extension: '.gif', animated: true },
  { source: resolve(scriptDir, '../../media/img'), output: resolve(scriptDir, '../dist/img'), extension: '.jpg', animated: false },
]

for (const pack of media) {
  const files = (await readdir(pack.source)).filter(name => name.toLowerCase().endsWith(pack.extension))
  await mkdir(pack.output, { recursive: true })
  let nextFile = 0
  let sourceBytes = 0
  let outputBytes = 0
  const workers = Array.from({ length: Math.min(4, files.length) }, async () => {
    while (nextFile < files.length) {
      const name = files[nextFile++]
      const source = resolve(pack.source, name)
      const output = resolve(pack.output, name.replace(/\.(gif|jpe?g)$/i, '.webp'))
      const original = await sharp(source, pack.animated ? { animated: true } : {}).metadata()
      const pipeline = sharp(source, pack.animated ? { animated: true } : {})
        .webp({ quality: 82, effort: 5, smartSubsample: true })
      await pipeline.toFile(output)
      const converted = await sharp(output, pack.animated ? { animated: true } : {}).metadata()
      if (pack.animated && (original.pages !== converted.pages
        || original.loop !== converted.loop
        || JSON.stringify(original.delay || []) !== JSON.stringify(converted.delay || []))) {
        throw new Error(`Animation timing changed while converting ${name}.`)
      }
      if (!pack.animated && (original.width !== converted.width || original.height !== converted.height)) {
        throw new Error(`Image dimensions changed while converting ${name}.`)
      }
      sourceBytes += (await stat(source)).size
      outputBytes += (await stat(output)).size
    }
  })
  await Promise.all(workers)
  const label = pack.animated ? 'animated exercise images' : 'exercise thumbnails'
  const originalFormat = pack.animated ? 'GIF' : 'JPEG'
  console.info(
    `Optimized ${files.length} Android ${label}: `
    + `${(sourceBytes / 1024 / 1024).toFixed(1)} MiB ${originalFormat} → `
    + `${(outputBytes / 1024 / 1024).toFixed(1)} MiB WebP `
    + `(${Math.round((1 - outputBytes / sourceBytes) * 100)}% smaller).`,
  )
}
