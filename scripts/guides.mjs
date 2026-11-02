// ─── SnapFit guides: original long-form articles ──────────────────────────────
// Rendered by gen-seo.mjs to /guides/<slug>/ plus a /guides/ hub. Each guide is
// hand-written, tied to one tool, and deliberately avoids per-exam numbers (those
// live in the presets and the size chart) so nothing here goes stale.
//   body: trusted HTML (h2 / p / ul / ol only).
export const GUIDES = [
  {
    slug: 'compress-photo-to-exact-kb',
    title: 'How to Compress a Photo to an Exact KB Size Without Ruining It',
    description: 'Why a photo is bigger than a form allows, and the order of fixes that gets it under the limit while keeping your face clear: dimensions first, then JPEG quality.',
    h1: 'How to compress a photo to an exact KB size without ruining it',
    tool: { href: '/photo-resizer/', label: 'Open the photo resizer' },
    body: `
    <p>Almost every Indian exam or ID form states a file-size window such as "between 20 KB and 50 KB". A modern phone photo is usually 2–6 MB, so it has to shrink by a factor of fifty or more — and the way you shrink it decides whether the result looks fine or looks like a smudge. This guide explains what actually controls a JPEG's size, so you can hit a target without guessing.</p>

    <h2>What makes a JPEG big or small</h2>
    <p>Three things decide the file size, in this order of impact:</p>
    <ul>
      <li><strong>Pixel dimensions.</strong> A 4000×3000 photo holds twelve million pixels; a 200×230 passport photo holds about forty-six thousand. Fewer pixels means proportionally less data to store, which is by far the biggest lever.</li>
      <li><strong>Detail and noise.</strong> JPEG stores smooth areas cheaply and busy areas expensively. A plain white background compresses to almost nothing; a cluttered room, hair texture and camera noise from a dim photo all cost bytes.</li>
      <li><strong>Quality setting.</strong> JPEG is lossy: a quality value (often 0–100) controls how aggressively fine detail is discarded. Lower quality means a smaller file and more visible blockiness.</li>
    </ul>

    <h2>The right order: dimensions, then background, then quality</h2>
    <ol>
      <li><strong>Resize to the required dimensions first.</strong> If the form asks for a specific width and height, do that before anything else. Most of the size reduction happens here, and it costs you no visible quality because the portal will display the photo at that size anyway.</li>
      <li><strong>Simplify the background.</strong> A flat white or light background removes the most expensive detail from the frame. It is also what most forms ask for.</li>
      <li><strong>Only then lower the JPEG quality</strong> until the file lands inside the allowed range. Starting here instead — squeezing a 4000-pixel photo down with quality alone — produces the blocky, blotchy result people complain about.</li>
    </ol>

    <h2>Why "under 50 KB" is not the whole story</h2>
    <p>Many portals also enforce a <em>minimum</em> size, for example 20 KB. A photo that is too small can be rejected just as a too-large one is, because the portal treats a tiny file as low quality. Aim for the middle of the window rather than the very edge: a file at 95% of the maximum can tip over after the portal re-reads it, and one at the minimum can fall below it.</p>

    <h2>Common mistakes</h2>
    <ul>
      <li><strong>Re-saving repeatedly.</strong> Each JPEG save discards a little more detail. Work from the original photo every time instead of compressing an already compressed copy.</li>
      <li><strong>Screenshotting the photo.</strong> A screenshot is a new, lower-quality image at the wrong dimensions.</li>
      <li><strong>Renaming a PNG to .jpg.</strong> Changing the extension does not change the format. Many portals check the real content and will reject it.</li>
      <li><strong>Using a heavy filter or "beauty" mode.</strong> Smoothing filters and sharpening add fine texture that bloats the file and can breach rules on unaltered photos.</li>
    </ul>

    <h2>How SnapFit handles it</h2>
    <p>Pick an exam preset (or the Custom preset with your own numbers) and upload the original. SnapFit crops and resizes to the exact dimensions, can replace the background with a flat colour, and then adjusts the JPEG quality so the output falls inside the KB range. You see the resulting file size before you download, and you can nudge quality, zoom and position if the framing needs fixing. Everything runs in your browser, so the original never leaves your device.</p>
    <p>If the preview looks too soft at the required size, the cause is almost always the source photo: take it in even daylight, from a steady rear camera, against a plain wall. Better input beats any amount of clever compression.</p>`,
  },
  {
    slug: 'make-pdf-smaller',
    title: 'How to Make a PDF Smaller Without Making It Unreadable',
    description: 'Why PDFs get large, which kinds shrink well, and what a browser-based compressor does to your pages — including the trade-off most guides leave out.',
    h1: 'How to make a PDF smaller without making it unreadable',
    tool: { href: '/?tool=pdf', label: 'Compress a PDF' },
    body: `
    <p>Application portals, scholarship forms and email attachments often cap uploads at 1 or 2 MB, while a scanned certificate easily weighs 8 MB. Before you reach for a compressor it helps to understand why the file is big, because that tells you how much you can safely shrink it.</p>

    <h2>Why PDFs are large</h2>
    <ul>
      <li><strong>Scanned pages are photographs.</strong> A scan or phone photo saved as a PDF is a full-resolution image on every page. These files are large and shrink very well.</li>
      <li><strong>Embedded images.</strong> A document exported from Word or Slides with high-resolution pictures carries them at full size, even if they appear small on the page.</li>
      <li><strong>Embedded fonts and metadata.</strong> These add a modest amount, and rarely matter beyond a few hundred kilobytes.</li>
      <li><strong>Text-only PDFs are already tiny.</strong> A typed ten-page document is often under 100 KB. If yours is large, there are images inside it.</li>
    </ul>

    <h2>The trade-off you should know about</h2>
    <p>There are two ways to compress a PDF. The first re-encodes the images inside it and leaves the text as real text. The second renders each page to a picture, compresses that picture, and builds a new PDF from the pictures. The second is simple, works on any file, and gives predictable sizes — but the result is a set of page images, so the text can no longer be selected, searched or copied.</p>
    <p>SnapFit's PDF compressor works the second way, entirely in your browser. That is the right choice for scanned documents, which were already images, and for forms that only need to be looked at. It is the wrong choice if you need to keep searchable text, so keep your original file as well and use the compressed copy only for the upload that demands a small size.</p>

    <h2>Getting the size down in practice</h2>
    <ol>
      <li><strong>Start from the best original you have.</strong> Compressing a compressed file compounds the loss.</li>
      <li><strong>Use the quality slider and watch the preview.</strong> Lower the quality until the text is only just comfortably legible, then raise it one notch. Small print, stamps and signatures degrade first.</li>
      <li><strong>Check the page count.</strong> Remove blank or duplicate pages before compressing; every page costs size.</li>
      <li><strong>Check the number you need.</strong> If the limit is 1 MB and you reach 900 KB, stop. Extra compression only costs legibility.</li>
    </ol>

    <h2>Tips for documents you will upload</h2>
    <ul>
      <li>Scan in black and white or greyscale for text documents; colour is rarely needed and triples the data.</li>
      <li>Scan at a moderate resolution. Roughly 150–200 DPI is readable for most forms; 600 DPI is overkill.</li>
      <li>Crop away the dark scanner borders — they are pure waste.</li>
      <li>Open the final file once and read it at 100% zoom before uploading. If you can read it, so can the verifier.</li>
    </ul>

    <h2>Is it safe to compress private documents online?</h2>
    <p>That depends on whether the file is uploaded. Many compression websites send your PDF to a server. SnapFit does the work on your own device, so identity documents, mark sheets and certificates are not transmitted. You can confirm this yourself: open your browser's developer tools, watch the Network tab while compressing, and you will see no upload of your file.</p>`,
  },
  {
    slug: 'qr-code-best-practices',
    title: 'How to Make a QR Code That Actually Scans: Size, Colour and Logo Tips',
    description: 'A practical guide to QR codes for websites: how big to print them, which colours scan, how much logo is safe, and how error correction makes logos possible.',
    h1: 'How to make a QR code that actually scans',
    tool: { href: '/qr-code-generator/', label: 'Make a QR code with your logo' },
    body: `
    <p>A QR code is a square pattern of dark and light modules that a phone camera reads and turns back into text — usually a web link. They are easy to make and surprisingly easy to make badly. These are the rules that decide whether a code scans reliably on a shop window, a visiting card or a poster.</p>

    <h2>1. Keep strong contrast</h2>
    <p>Scanners look for dark modules on a light background. Black on white is the safest. Dark blue, dark green or deep red on white also work. Light colours on a light background, or low-contrast pairs such as yellow on white, are the most common reason a code fails. Many scanners also struggle with "inverted" codes — light modules on a dark background — so avoid them unless you have tested them.</p>

    <h2>2. Leave the quiet zone</h2>
    <p>The blank margin around a QR code, about four modules wide, is part of the design. It lets the scanner find the edges. Do not crop it off and do not run text or borders into it. SnapFit's codes include this margin, so keep it when you place the image in a layout.</p>

    <h2>3. Print it large enough</h2>
    <p>As a rule of thumb, a printed code should be at least 2 cm across for close-up scanning, and bigger the further away it will be read from. A poster read from two metres away needs a code many times that size. If your link is long, the code contains more modules and each one is smaller, so shorten the link where you can.</p>

    <h2>4. Understand error correction</h2>
    <p>QR codes include redundancy so they still read when part of the code is dirty, damaged or covered. There are four levels, which can recover roughly 7%, 15%, 25% and 30% of the code (levels L, M, Q and H). Higher levels add more modules, so the code looks denser. This redundancy is exactly what makes a logo possible: the logo covers some modules, and error correction fills the gap.</p>
    <p>When you add a logo in SnapFit, the generator automatically switches to the highest level. Without a logo it uses a lighter level, which keeps the code simpler and easier to scan from afar.</p>

    <h2>5. Keep the logo small and simple</h2>
    <ul>
      <li>Keep the logo to roughly a fifth of the code's width. Bigger logos eat into the 30% recovery budget and make the code fragile.</li>
      <li>Give the logo a solid background pad so the modules around it are cleanly cut, not half-hidden.</li>
      <li>Prefer simple marks. A detailed photo as a logo adds visual noise next to the pattern.</li>
      <li>Always test the finished code with at least two different phones before printing in bulk.</li>
    </ul>

    <h2>6. Choose PNG or PDF for the job</h2>
    <p>Use the PNG for screens, social posts and documents. Use the PDF for printing: it places the code on an A4 page at a fixed physical size, which avoids the browser or printer shrinking it unexpectedly. If a print shop asks for vector artwork, tell them what you have — a 1024-pixel PNG is plenty for anything up to a small poster, but not for a billboard.</p>

    <h2>7. Remember what the code contains</h2>
    <p>A basic QR code holds the link itself; it does not phone home through a tracking service. That means it never expires, but it also means that if you later change the page address you need a new code. Double-check the link before you print — a typo is permanent once it is on a thousand flyers.</p>

    <h2>Quick pre-print checklist</h2>
    <ol>
      <li>Link opens correctly and uses https.</li>
      <li>Dark code on a light background.</li>
      <li>Quiet zone intact, at least 2 cm across.</li>
      <li>Logo around a fifth of the width at most.</li>
      <li>Scanned successfully on two phones, in normal indoor light.</li>
    </ol>`,
  },
  {
    slug: 'white-background-product-photos',
    title: 'White-Background Product Photos: A Checklist for Online Sellers',
    description: 'What marketplaces generally expect from listing photos, how to shoot a product at home so the background cleans up easily, and the mistakes that get listings flagged.',
    h1: 'White-background product photos: a checklist for online sellers',
    tool: { href: '/sell/meesho/', label: 'Make a listing photo' },
    body: `
    <p>New sellers on Amazon.in, Flipkart, Meesho, Myntra and similar marketplaces quickly learn that the main listing image has rules, and that a better photo sells more than a lower price. The good news: you do not need a studio. You need consistent light, a clean backdrop and a few habits. Marketplaces differ and change their rules, so treat this as a general checklist and confirm the specifics in your seller dashboard's image guidelines.</p>

    <h2>What marketplaces generally ask for</h2>
    <ul>
      <li><strong>A clean, usually white, background</strong> on the main image, with the product the only subject.</li>
      <li><strong>The product fills most of the frame</strong>, centred, without being cut off at the edges.</li>
      <li><strong>No overlaid text, logos, watermarks, badges or borders</strong> on the main image. Promotional graphics belong on secondary images, if allowed at all.</li>
      <li><strong>Sharp, evenly lit, accurate colour.</strong> Returns often come from a colour that did not match the photo.</li>
      <li><strong>A minimum resolution and a square or near-square shape</strong>, so the platform's zoom works. The exact figures vary by marketplace — the per-marketplace pages in SnapFit list the sizes its presets use.</li>
    </ul>

    <h2>Shooting at home</h2>
    <ol>
      <li><strong>Use a window, not a bulb.</strong> Place the product on a table beside a large window in daytime. Soft, indirect daylight gives even light without harsh shadows. Avoid direct sun, which burns highlights.</li>
      <li><strong>Make a sweep.</strong> Tape a sheet of white card or chart paper to a wall and let it curve onto the table. A curved backdrop has no horizon line, so the background becomes one smooth tone.</li>
      <li><strong>Fill the shadows.</strong> Hold a white card opposite the window to bounce light back into the dark side of the product.</li>
      <li><strong>Steady the phone.</strong> Use a stack of books or a cheap tripod and the timer, so the shot is sharp. Wipe the lens first — a smudged lens is the most common cause of a hazy image.</li>
      <li><strong>Shoot several angles.</strong> Front, back, side, a close-up of texture or labels, and one showing scale. Buyers cannot touch the item, so photos are the only inspection they get.</li>
    </ol>

    <h2>Cleaning up the background</h2>
    <p>Even a good sweep rarely photographs as pure white; it comes out slightly grey or cream. Marketplaces and shoppers prefer a true white that blends into the page. SnapFit's listing tool removes the background with an in-browser model, places the product on white and sizes it to the marketplace preset. Check the cut-out edges at full zoom: hair-thin parts, transparent materials such as glass, and white products on a white background are where automatic removal is weakest.</p>
    <p>Tips for easier cut-outs: keep the product a different colour from the backdrop where possible, avoid reflective surfaces that mirror the room, and keep a little space between the product and the backdrop's edges.</p>

    <h2>Mistakes that get listings flagged or ignored</h2>
    <ul>
      <li>Using another seller's or the manufacturer's photo without permission.</li>
      <li>Heavy filters or retouching that changes the colour or shape of the product.</li>
      <li>Props or accessories that are not included in the sale, which buyers read as part of the item.</li>
      <li>Tiny products lost in a big frame; crop in so the item fills the space.</li>
      <li>Inconsistent images across a catalogue; a uniform look reads as a trustworthy shop.</li>
    </ul>

    <h2>Before you upload</h2>
    <ol>
      <li>Is the product sharp and fully inside the frame?</li>
      <li>Is the background clean and consistent, with no leftover edges?</li>
      <li>Is the colour true to the real item?</li>
      <li>Is the image at the marketplace's size and file limit?</li>
      <li>Is there nothing on it that the marketplace forbids?</li>
    </ol>`,
  },
  {
    slug: 'is-it-safe-to-upload-photo-to-resizer',
    title: 'Is It Safe to Upload Your Photo and ID to an Online Resizer?',
    description: 'How online photo and PDF tools handle your files, how to check whether a site uploads them, and exactly what SnapFit does and does not send off your device.',
    h1: 'Is it safe to upload your photo and ID to an online resizer?',
    tool: { href: '/about/', label: 'Read how SnapFit works' },
    body: `
    <p>Exam photos, signatures, Aadhaar-linked forms and certificates are personal data. Yet people routinely drop them onto the first "free online resizer" a search shows. Whether that is safe depends entirely on one question: does the tool send your file to a server?</p>

    <h2>Two kinds of online tools</h2>
    <ul>
      <li><strong>Upload-based tools</strong> send your file to the company's server, process it there and send it back. Your photo sits on someone else's machine for some period — often with a policy you have not read. Some delete files within hours; others keep them, use them for analytics or training, or simply store them for longer than they say.</li>
      <li><strong>Browser-based tools</strong> download a program into your browser and process the file locally using your own device. The file is never transmitted anywhere, so there is nothing to store or leak.</li>
    </ul>

    <h2>How to check for yourself</h2>
    <p>You do not have to take any site's word for it. In Chrome, Edge or Firefox, press F12, open the <strong>Network</strong> tab, then process a test file. If the tool is browser-based you will see page assets loading but no request that carries your image or PDF. If you see a large "POST" or "upload" request the size of your file, it is being sent away. Disconnecting from the internet after the page has loaded is another easy test: a genuinely local tool keeps working.</p>

    <h2>What SnapFit does</h2>
    <p>Being specific matters more than a blanket promise, so here is what SnapFit actually sends:</p>
    <ul>
      <li><strong>Resizing, cropping, compression and PDF compression</strong> run in your browser using the canvas and PDF libraries. Your photo or PDF is not uploaded.</li>
      <li><strong>Background removal</strong> uses a machine-learning model that is downloaded to your browser and runs locally on your photo.</li>
      <li><strong>QR codes</strong> are drawn in your browser; the link, text and logo you enter are not sent anywhere.</li>
      <li><strong>The optional "read my notification" feature</strong> is the one exception. If you choose to upload a screenshot of an exam notice so SnapFit can read the size requirements, that screenshot is sent to a server-side reading service. Your photo is not part of that. You only use this feature if you click it.</li>
      <li><strong>Analytics and advertising.</strong> Like most free sites, SnapFit uses basic analytics and may show Google ads, which can set cookies. This concerns how the page is used, not the contents of your files. The privacy policy explains the details and how to opt out of personalised ads.</li>
    </ul>

    <h2>Habits that protect you on any site</h2>
    <ol>
      <li>Prefer tools that say plainly where processing happens, and check it with the Network tab.</li>
      <li>Never upload a document that shows more than the task needs. If a form wants only your photo, do not upload a page that also shows your Aadhaar number.</li>
      <li>Be wary of tools that demand an account just to resize one image.</li>
      <li>Read the privacy policy for a retention period and a contact address. A missing contact is a red flag.</li>
      <li>Delete downloaded copies from shared computers, such as a cyber café's, when you are done.</li>
    </ol>

    <h2>The bottom line</h2>
    <p>For personal photos and identity documents, a browser-based tool is the safer default because there is no copy to go astray. SnapFit is built that way, and the owner, contact details and privacy policy are published so you can reach a real person if something looks wrong.</p>`,
  },
]
