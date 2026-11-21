# qino

qino is a flat-file Markdown CMS. It reads a content folder and hands typed entries to a consumer website, which owns rendering and routing.

## Media

**Image manifest**:
The record `qino build` keeps of each image an image field references: its size, dimensions and blur placeholder. A deployed server reads it in place of image files it doesn't have.
_Avoid_: Lock file, image cache, image metadata
