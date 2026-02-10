# Net Practice Pro

A comprehensive, single-page web application for learning and practicing IP addressing, subnetting, VLSM, network analysis, and binary conversion. Built as a fully client-side tool with no dependencies — just open and use.

---

## Project Overview

Net Practice Pro is an interactive educational platform designed to teach networking fundamentals through hands-on calculators, visual tools, and self-assessment quizzes. It covers the full spectrum of IPv4 subnetting topics — from binary/decimal conversion to VLSM allocation and route summarization — providing instant feedback and step-by-step explanations throughout.

The application is structured as a tabbed single-page interface with 13 tabs, each focusing on a specific networking concept, progressing from foundational knowledge to practical problem-solving.

---

## Features

### Interactive Calculators
- **Binary ↔ Decimal Converter** — Convert 8-bit binary to decimal and vice versa with step-by-step breakdowns.
- **Interval (Block Size) Calculator** — Enter a subnet mask octet value and instantly get the block size via `256 - X`.
- **Subnet Calculator (From Mask)** — Given any IP address and CIDR prefix, computes network address, broadcast address, usable host range, wildcard mask, and total/usable host counts. Handles `/31` (RFC 3021 point-to-point) and `/32` (host route) edge cases. Includes a **Copy** button to copy results to clipboard.
- **Subnet Creator** — Splits a base network into a requested number of equal subnets, showing bits borrowed, new CIDR, and a full subnet table.
- **VLSM Calculator** — Variable Length Subnet Masking tool that allows users to define multiple subnets with custom names and host requirements. Allocates subnets from a parent network block using a largest-first strategy with proper power-of-2 alignment. Dynamically add/remove subnet requirement rows (up to 10). Outputs a detailed allocation table with network, range, broadcast, mask, and waste per subnet plus an overall utilization summary.

### Network Analysis Tools
A dedicated **Network Tools** tab containing three sub-tools:

- **Subnet Overlap Checker** — Enter multiple subnets (IP + CIDR) and detect if any address ranges overlap. Produces:
  - A sortable analysis table with network, broadcast, and size per subnet.
  - Overlap/no-overlap status with detailed pair listings.
  - A **lane-based Address Space Map** visualization where overlapping subnets are automatically placed on separate rows (lanes) so both are always visible. Overlapping segments are highlighted with a pulsing red border. Includes a color-coded legend.
- **Route Summarization (Supernetting)** — Enter multiple networks and compute the shortest common CIDR prefix (supernet) that covers all of them. Displays intermediate binary comparison of all network addresses with matching/diverging bits highlighted, plus a summary route card.
- **IP-in-Subnet Checker** — Quickly test whether a given IP address falls within a specified subnet (IP + CIDR). Shows the subnet range and a clear ✅/❌ result.

### Copy-to-Clipboard
One-click **📋 Copy** buttons on result areas across the Unified Tool, From Mask calculator, VLSM Calculator, Overlap Checker, Route Summarization, and IP-in-Subnet Checker. Extracts formatted text from tables and result panels.

### Visual Tools
- **Magic Decoder Chart** — Interactive display of the 8 powers of 2 (128 → 1) used in binary-to-decimal conversion.
- **Subnet Block Divider** — Slider-driven visualizer that divides a network block in real time. Includes a 32-bit strip showing Network/Subnet/Host bit allocation, a proportional color-coded bar chart, and a subnet legend.
- **Subnet Context Bar** — Automatically generated when using the subnet calculator; shows where a subnet sits within its parent block.
- **Network Diagram Generator** — Hub-and-spoke SVG topology diagram that visualizes subnets from a base network. Adapts detail level automatically:
  - ≤4 subnets → full detail (router + switch + 3 host PCs, all IP info)
  - 5–8 subnets → medium (switch + 1 host)
  - 9–16 subnets → simple (text labels only)
  - 17+ subnets → compact (network + host count)
  - Color-coded subnet nodes with gateway labels on connection lines
  - Summary table with network, gateway, usable range, broadcast, and host count per subnet

### Reference Material
- **IP Address Classes** — Class A–E ranges, default masks, and host counts.
- **Private IP Ranges (RFC 1918)** — Full table of non-routable address spaces.
- **Special Purpose Addresses** — Loopback, APIPA, default route, limited broadcast.
- **CIDR-to-Everything Chart** — Complete `/8` through `/32` reference with masks, wildcards, total IPs, usable hosts, and Class C equivalents.
- **Powers of 2 Table** — From `2⁰` to `2³²`.
- **Host/Mask Quick Picks** — "I need X hosts, which mask?" lookup table.
- **TCP/IP Model** — Full 4-layer reference with protocol mappings per layer.
- **TCP vs UDP Comparison** — Side-by-side feature comparison table.
- **Common Ports** — Well-known port numbers, protocols, and transport types.
- **Essential Protocols** — Protocol name, layer, and purpose reference.
- **IPv4 Packet Header** — Field-by-field breakdown of the IP header structure.
- **Network Security Basics** — Common attacks, descriptions, and mitigations.
- **Network Devices** — Router, switch, hub, firewall, etc. with OSI layer and function.
- **Quick Formulas & Exam Tips** — Essential calculation formulas with worked examples.

### Unified Smart Assistant
- A single multi-field form that accepts any combination of IP address, subnet mask, CIDR, subnet count, and decimal values. Automatically detects what was provided and produces all relevant analysis in one output. Results include a **Copy** button.

### Network Certification Drill (Exam Simulator)
- **Randomized Question Engine** across three difficulty levels:
  - **Easy** — Binary ↔ Decimal conversions plus `/24`–`/30` subnetting (4th octet only).
  - **Medium** — `/16`–`/23` subnetting (crosses into 3rd octet).
  - **Hard** — All CIDR ranges (`/8`–`/32`) including complex First/Last Usable Host questions.
- **Five question categories** that cycle randomly:
  1. **Binary Conversion** — Convert an 8-bit string to decimal, or a decimal to an 8-bit binary string (both directions).
  2. **Network ID Identification** — Given an IP/CIDR, find the Network Address.
  3. **Broadcast Address Identification** — Given an IP/CIDR, find the Broadcast Address.
  4. **Usable Host Range** — Identify the First or Last usable host in a subnet.
  5. **Mask Conversion** — Convert a CIDR prefix (e.g., `/27`) to a Dotted Decimal Mask (e.g., `255.255.255.224`).
- **Optional 30-second countdown timer** — toggle on/off via a switch. Horizontal progress bar changes color (indigo → amber → red) and auto-fails the question on expiry. Users can extend time by +15 seconds if needed.
- **Streak & scoring** — tracks Current Streak, Best Streak, Total Correct, and Total Attempted. Wrong answer, timeout, or skip resets the current streak.
- **Skip question** — skip any question to see the correct answer and move on without penalty beyond streak reset.
- **Smart Hint System** — context-specific clues (magic numbers, place values, octet math) with no scoring penalty.
- Full answer breakdown table shown after each submission.
- **Challenge Session History** — Quiz sessions are automatically saved to `localStorage` every 5 questions and when navigating away from the Challenge tab. A history panel at the bottom of the tab displays:
  - **All-time stats** — total sessions, total questions answered, best streak ever achieved.
  - **Last 20 sessions** — date, difficulty, score ratio, and streak per session.
  - **Clear history** button to reset all saved data.

---

## Technologies & Tools Used

| Layer     | Technology                   |
|-----------|------------------------------|
| Markup    | HTML5 (semantic elements)    |
| Styling   | CSS3 (custom properties, grid, flexbox, animations) |
| Scripting | Vanilla JavaScript (ES5-compatible, no transpiler needed) |
| Font      | [Inter](https://fonts.google.com/specimen/Inter) via Google Fonts |
| Storage   | `localStorage` for theme preference and challenge history |

**No frameworks, no build tools, no runtime dependencies.** The entire application is three static files.

---

## Folder & File Structure

```
netpracticeV1/
├── index.html    # Complete page structure — all 13 tabs, forms, tables, and reference content (~1,900 lines)
├── script.js     # Application logic — calculators, converters, VLSM, network tools, exam simulator, diagram generator, particle background, theme toggle, accessibility (~2,400 lines)
├── style.css     # Full styling — layout, components, responsive design, dark mode, particle canvas, timer, hint UI, accessibility (~2,000 lines)
└── README.md     # This file
```


## Installation & Setup

1. **Clone or download** the repository:
   ```bash
   git clone <repository-url>
   cd netpracticeV1
   ```

2. **Open `index.html`** in any modern web browser:
   - Double-click the file, or
   - Use a local dev server:
     ```bash
     # Python
     python -m http.server 8000

     # Node.js (npx)
     npx serve .
     ```
   - Or use the VS Code Live Server extension.

No installation, no `npm install`, no build step required.

---

## How the Application Works

### Input Handling
Every input field has a dedicated sanitizer function that runs on `oninput`:
- **IP fields** — strips non-numeric/non-dot characters, clamps octets to 0–255, prevents double dots, auto-inserts dots after 3-digit octets.
- **CIDR fields** — allows digits only, clamps to 0–32.
- **Binary fields** — allows only `0` and `1`, enforces 8-character max.
- **Decimal fields** — digits only, clamped to 0–255.

### Calculation Engine
Core IP math uses 32-bit unsigned integer arithmetic:
- `ipToInt(ip)` — converts dotted-decimal string to a 32-bit unsigned integer via bitwise shifts.
- `intToIp(n)` — reverses the process.
- Subnet masks are generated from CIDR with `(0xFFFFFFFF << (32 - cidr)) >>> 0`.
- Network address = `IP & Mask`, Broadcast = `Network | ~Mask`.
- Special handling exists for `/31` (point-to-point, RFC 3021) and `/32` (host route) prefixes.

### VLSM Allocation
The VLSM Calculator sorts subnet requirements by host count (largest first) and allocates sequentially within the parent network block. Each subnet is sized to the next power of 2 that accommodates the requested hosts plus network and broadcast addresses. The allocation pointer advances with proper alignment to ensure no wasted boundaries.

### Network Analysis
- **Overlap detection** uses pairwise range comparison (`s1.network ≤ s2.broadcast && s2.network ≤ s1.broadcast`). The visual bar assigns overlapping subnets to separate "lanes" (rows) using a greedy bin-packing algorithm so all segments remain visible. Conflicting segments receive a pulsing red `box-shadow` and dashed white border.
- **Route summarization** converts all networks to 32-bit binary strings, XORs each against the first, and finds the longest common prefix. The result is displayed with a binary comparison table showing matching (green) vs diverging (red) bit positions.
- **IP-in-subnet** checks whether `(ipInt & maskInt) === netInt` to determine membership.

### Visualization
The Block Divider and subnet calculator generate HTML visualizations dynamically:
1. A **32-bit strip** with color-coded cells for Network (N), Subnet (S), and Host (H) bits.
2. A **proportional bar** where each subnet is a segment whose width represents its share of the parent block. Hover tooltips show IP ranges.
3. A **color-coded legend** mapping subnet numbers to their network addresses.

### Exam Simulator Engine
The Network Certification Drill tab implements a full exam simulator with five question categories. `generateChallenge()` selects a category based on difficulty (Easy mixes binary and `/24`–`/30` subnets; Medium uses `/16`–`/23` subnets; Hard spans `/8`–`/32` with all types). Specialized generators handle each category:
- `generateBinaryQuestion()` — creates bidirectional binary ↔ decimal conversion questions.
- `generateMaskQuestion()` — asks for the dotted-decimal mask given a CIDR prefix.
- `generateSubnetQuestion()` — computes network/broadcast/usable hosts and randomly asks for one.

The **countdown timer is optional** — users toggle it on/off via `toggleChallengeTimer()`. When enabled, `startChallengeTimer()` runs a 30-second countdown that transitions from indigo → amber (≤10s) → red (≤5s). Users can press **+15s** (`extendChallengeTimer()`) to add time. If time expires, `challengeTimeout()` resets the streak and reveals the answer.

`skipChallengeQuestion()` lets users skip any question — the streak resets, the attempt is counted, and the correct answer is revealed with an amber "Skipped" feedback card.

`showChallengeHint()` delivers context-specific clues: binary place values for conversion questions, magic numbers and increment values for subnet questions, and octet math breakdowns for mask questions. Hints are free (no penalty).

`checkChallengeAnswer()` normalizes both inputs (stripping leading zeros, whitespace) before comparing. A full answer breakdown table and a "Next Question" button are shown after each attempt.

**Session persistence** — `saveChallengeSession()` serializes the current score, streak, best streak, difficulty, and timestamp into a `challengeHistory` array in `localStorage`. Sessions auto-save every 5 questions and when leaving the Challenge tab. `loadChallengeHistory()` renders the last 20 sessions and all-time aggregated stats on page load.

---

## Usage Instructions

| Goal | Where to Go |
|------|-------------|
| Learn the powers-of-2 chart | **Magic Decoder** tab |
| Convert between binary and decimal | **Binary Guide** tab — use the converter at the top |
| Identify IP class, private ranges, special addresses | **IP Classes** tab |
| Understand subnet block sizes | **Subnet Intervals** tab — use the interval calculator |
| Visually split a network with a slider | **Block Divider** tab |
| Calculate network/broadcast/range from IP + CIDR | **From Mask** tab |
| Divide a network into N equal subnets | **Subnetting** tab |
| Allocate variable-sized subnets from one block | **VLSM** tab — define subnet names and host counts |
| Check for subnet overlaps | **Network Tools** tab → Overlap Checker |
| Summarize multiple routes into one supernet | **Network Tools** tab → Route Summarization |
| Test if an IP belongs to a subnet | **Network Tools** tab → IP-in-Subnet Checker |
| Do everything at once | **Unified Tool** tab — fill in any combination of fields |
| Look up CIDR ↔ mask ↔ hosts, TCP/IP, ports, protocols | **Quick Reference** tab |
| Test your skills | **Challenge** tab — pick a difficulty, toggle the timer, and build a streak |
| Review past quiz performance | **Challenge** tab — scroll to Session History |
| Generate a subnet topology diagram | **Network Diagram** tab — enter base IP, CIDR, subnet count |
| Copy any result to clipboard | Click the **📋 Copy** button on any result panel |
| Toggle light/dark theme | **☀️ / 🌙 button** in the header |

---

## Known Limitations

- **IPv4 only** — no IPv6 support.
- **Partial state persistence** — theme preference and challenge history are persisted via `localStorage`. Other inputs and the active tab reset on page reload.
- **Visualization capped** — the proportional bar shows a maximum of 16 subnet segments; additional subnets are summarized as "+ N more."
- **Static content** — reference tables are hardcoded in HTML; updating them requires editing `index.html` directly.
- **Single-page scroll** — with 13 tabs of dense content, the initial HTML payload is large (~1,900 lines), though only one tab is visible at a time.
- **Google Fonts dependency** — the Inter font is loaded from an external CDN. The app works without it (falls back to system sans-serif) but will look slightly different offline.
- **Overlap visualization scale** — when subnets span vastly different address ranges (e.g., `10.0.0.0/8` and `192.168.1.0/24`), smaller segments may appear as thin slivers on the address space map.

---

## Future Improvements

- **IPv6 Support** — add a section for IPv6 addressing, prefix notation, and EUI-64.
- **Export / Share** — let users export calculation results as text, image, or shareable URL.
- **Progressive Web App (PWA)** — add a service worker and manifest for full offline capability.
- **Accessibility Audit** — improve color contrast ratios for some visualization segments and add screen-reader-only labels to the bit strip cells. (`aria-current` tracking, skip-to-content link, and keyboard navigation are already implemented.)
- **Drag-and-drop VLSM** — visual drag interface for rearranging and resizing subnet allocations.
- **Import/Export Subnet Plans** — save and load VLSM or subnet configurations as JSON files.
