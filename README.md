# SnapFit

SnapFit is a browser-based React app for exam-ready photo editing and PDF compression.

It helps users prepare passport and exam photos for Indian exams like NEET, JEE, UPSC, SSC, IBPS, RRB, GATE, NDA, and more. The app also includes a standalone PDF compressor for reducing PDF file size locally.

## Features

- Exam photo resizing for 20+ presets
- Auto crop and face framing for passport/exam photos
- Background replacement with white, off-white, light blue, or blue
- JPEG output preview and file size estimation
- Custom preset support for any width, height, and KB range
- 100% in-browser processing — no uploads, no server storage
- PDF compressor with before/after preview and quality slider

## Tech stack

- React
- Vite
- Emotion (`@emotion/react`, `@emotion/styled`)
- `pdfjs-dist` and `jspdf` for client-side PDF handling
- ESLint for linting

## Notes

- The app supports image uploads in JPG/PNG format for photo editing.
- PDF compression runs entirely in the browser using `pdfjs-dist` and `jspdf`.
- The photo tool is designed to help match exam-specific dimension and file size requirements.

## License

This repository is currently private and intended for local development.
