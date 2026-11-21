# Noctrinth Plugins Database

Official plugin catalog for **Noctrinth**.

Each plugin is registered as a commit-pinned `git submodule` inside `plugins/<id>`. Every submission and update goes through Pull Request review; on merge, GitHub Actions validates every `plugin.json`, packages `.zip` archives, computes **SHA-256** checksums, and publishes `index.json` to GitHub Pages.

The generated `index.json` powers both:
- **Noctrinth Launcher** (**Settings → Plugins → Catalog**)
- **Noctrinth Website** (**Plugins** directory)

## Submitting a New Plugin

1. Build your plugin using [Noctrinth-Plugin-Template](https://github.com/Everelsu/Noctrinth-Plugin-Template).
2. Fork this repository and add your plugin as a git submodule:
   ```bash
   git submodule add https://github.com/<user>/<repo> plugins/<plugin-id>
   git commit -m "feat: add <plugin-id>"
   ```
3. Open a Pull Request.

## Updating an Existing Plugin

```bash
git submodule update --remote plugins/<plugin-id>
git commit -m "chore: update <plugin-id> to vX.Y.Z"
```
Open a Pull Request — after review, CI will rebuild the archive and update its SHA-256 in `index.json`.

## GitHub Pages Setup (Maintainers)

In repository **Settings → Pages → Build and deployment**, set **Source** to **GitHub Actions**. After the first push to `main`, the catalog will be live at:
`https://everelsu.github.io/Noctrinth-Plugins/index.json`
