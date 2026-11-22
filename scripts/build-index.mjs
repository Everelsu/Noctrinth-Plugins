import crypto from 'node:crypto'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const PLUGINS_DIR = path.resolve('plugins')
const OUT_DIR = path.resolve('dist')
const BASE_URL = (
	process.env.CATALOG_BASE_URL || 'https://everelsu.github.io/Noctrinth-Plugins'
).replace(/\/+$/, '')

fs.rmSync(OUT_DIR, { recursive: true, force: true })
fs.mkdirSync(path.join(OUT_DIR, 'archives'), { recursive: true })

// Publish schema & SDK alongside index.json on GitHub Pages
fs.copyFileSync(path.resolve('plugin-schema.json'), path.join(OUT_DIR, 'plugin-schema.json'))

const plugins = []
const seenIds = new Set()

if (fs.existsSync(PLUGINS_DIR)) {
	for (const entry of fs.readdirSync(PLUGINS_DIR, { withFileTypes: true })) {
		if (!entry.isDirectory()) continue
		const dir = path.join(PLUGINS_DIR, entry.name)
		const manifestPath = path.join(dir, 'plugin.json')
		if (!fs.existsSync(manifestPath)) {
			throw new Error(`Missing plugin.json in plugins/${entry.name}`)
		}
		const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
		if (!manifest.id || !manifest.name || !manifest.version || manifest.apiVersion !== 1) {
			throw new Error(`Invalid manifest in plugins/${entry.name}`)
		}
		if (!/^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/.test(manifest.id)) {
			throw new Error(`Invalid plugin id "${manifest.id}" in plugins/${entry.name}`)
		}
		if (!['theme', 'content-source', 'extension'].includes(manifest.type)) {
			throw new Error(`Invalid plugin type "${manifest.type}" in plugins/${entry.name}`)
		}
		if (seenIds.has(manifest.id)) {
			throw new Error(`Duplicate plugin id "${manifest.id}"`)
		}
		seenIds.add(manifest.id)

		const zipName = `${manifest.id}-${manifest.version}.zip`
		const zipPath = path.join(OUT_DIR, 'archives', zipName)
		execFileSync('zip', ['-r', '-q', zipPath, '.', '-x', '.git/*', '.git'], { cwd: dir })

		const bytes = fs.readFileSync(zipPath)
		const sha256 = crypto.createHash('sha256').update(bytes).digest('hex')

		let commit
		try {
			commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: dir, encoding: 'utf8' }).trim()
		} catch {
			// Optional when not a submodule
		}

		plugins.push({
			id: manifest.id,
			name: manifest.name,
			version: manifest.version,
			apiVersion: manifest.apiVersion,
			type: manifest.type,
			author: manifest.author,
			description: manifest.description,
			homepage: manifest.homepage,
			repository: manifest.repository,
			icon_url: manifest.icon_url,
			tags: Array.isArray(manifest.tags) ? manifest.tags : undefined,
			download_url: `${BASE_URL}/archives/${zipName}`,
			sha256,
			commit,
			permissions: manifest.permissions,
		})
	}
}

plugins.sort((a, b) => a.name.localeCompare(b.name))

const index = {
	schema_version: 1,
	updated_at: new Date().toISOString(),
	plugins,
}

fs.writeFileSync(path.join(OUT_DIR, 'index.json'), JSON.stringify(index, null, 2))
console.log(`Built catalog with ${plugins.length} plugin(s).`)
