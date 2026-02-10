/* ========================================
   Net Practice Pro - script.js
   ======================================== */

/* ---------- Menu & Tab Navigation ---------- */
function toggleMenu() {
    var menu = document.getElementById('mainMenu');
    var btn = document.querySelector('.menu-btn');
    if (menu) {
        menu.classList.toggle('show');
        var expanded = menu.classList.contains('show');
        if (btn) btn.setAttribute('aria-expanded', String(expanded));
    }
}

function switchTab(tabId) {
    /* Save challenge session if leaving challenge tab */
    if (challengeState && challengeState.started && challengeState.total > 0) {
        var currentChallenge = document.getElementById('challenge');
        if (currentChallenge && currentChallenge.classList.contains('active') && tabId !== 'challenge') {
            saveChallengeSession();
        }
    }

    var contents = document.querySelectorAll('.tab-content');
    for (var i = 0; i < contents.length; i++) {
        contents[i].classList.remove('active');
    }
    var target = document.getElementById(tabId);
    if (target) target.classList.add('active');

    /* Update aria-current on menu items */
    var items = document.querySelectorAll('.menu-item');
    for (var j = 0; j < items.length; j++) {
        if (items[j].id === 'mi-' + tabId) {
            items[j].setAttribute('aria-current', 'page');
        } else {
            items[j].removeAttribute('aria-current');
        }
    }

    var menu = document.getElementById('mainMenu');
    if (menu) menu.classList.remove('show');
}

/* ---------- Input Sanitisers ---------- */
function sanitizeBinaryInput(el) {
    el.value = el.value.replace(/[^01]/g, '').substring(0, 8);
}

function sanitizeIpInput(el) {
    /* Detect if user is deleting (value got shorter) */
    var prev = el.getAttribute('data-prev') || '';
    var isDeleting = el.value.length < prev.length;

    /* Strip non-digit, non-dot chars */
    var raw = el.value.replace(/[^0-9.]/g, '');

    /* Prevent leading dot */
    raw = raw.replace(/^\./, '');

    /* Prevent double dots */
    raw = raw.replace(/\.{2,}/g, '.');

    /* Split into octets by dot */
    var parts = raw.split('.');

    /* Clamp each octet to 0-255 and limit to 4 octets */
    var cleaned = [];
    for (var i = 0; i < parts.length && i < 4; i++) {
        var seg = parts[i];
        /* Remove leading zeros (but keep single "0") */
        if (seg.length > 1 && seg[0] === '0') seg = String(parseInt(seg, 10));
        /* Clamp to 255 */
        if (seg !== '' && parseInt(seg, 10) > 255) seg = '255';
        cleaned.push(seg);
    }

    /* Auto-add dot after 3-digit octet (only if not already 4 octets and not deleting) */
    var last = cleaned[cleaned.length - 1];
    if (!isDeleting && cleaned.length < 4 && last && last.length === 3 && !raw.endsWith('.')) {
        el.value = cleaned.join('.') + '.';
    } else {
        el.value = cleaned.join('.');
    }

    /* Store current value for next comparison */
    el.setAttribute('data-prev', el.value);
}

function sanitizeCidrInput(el) {
    el.value = el.value.replace(/[^0-9]/g, '');
    var v = parseInt(el.value, 10);
    if (isNaN(v)) return;
    if (v > 32) el.value = 32;
}

function sanitizeDecimalByte(el) {
    el.value = el.value.replace(/[^0-9]/g, '');
    if (el.value === '') return;
    var v = parseInt(el.value, 10);
    if (isNaN(v) || v < 0) { el.value = ''; return; }
    if (v > 255) v = 255;
    el.value = String(v);
}

function sanitizeDecimalList(el) {
    el.value = el.value.replace(/[^0-9, ]/g, '');
    /* Clamp each comma-separated number to 0-255 */
    var parts = el.value.split(',');
    for (var i = 0; i < parts.length; i++) {
        var trimmed = parts[i].replace(/[^0-9]/g, '');
        if (trimmed === '') { parts[i] = parts[i].replace(/[0-9]/g, ''); continue; }
        var v = parseInt(trimmed, 10);
        if (v > 255) v = 255;
        parts[i] = parts[i].replace(/[0-9]+/, String(v));
    }
    el.value = parts.join(',');
}

function sanitizeSubnetCount(el) {
    el.value = el.value.replace(/[^0-9]/g, '');
    var v = parseInt(el.value, 10);
    if (isNaN(v)) return;
    if (v > 256) el.value = 256;
}

function sanitizeMaskInput(el) {
    sanitizeIpInput(el);
}

/* ---------- Binary <-> Decimal Converters ---------- */
function convertBinToDec() {
    var bin = document.getElementById('binInput').value;
    var out = document.getElementById('binResult');
    if (!out) return;
    if (bin.length === 0) { out.innerHTML = ''; return; }
    if (bin.length !== 8 || /[^01]/.test(bin)) {
        out.innerHTML = '<p style="color:var(--danger)">Enter exactly 8 binary digits (0s and 1s)</p>';
        return;
    }
    var powers = [128, 64, 32, 16, 8, 4, 2, 1];
    var total = 0;
    var parts = [];
    for (var i = 0; i < 8; i++) {
        if (bin[i] === '1') { total += powers[i]; parts.push(powers[i]); }
    }

    /* Build Position / Binary / Add table */
    var d = 60; /* base delay ms per column */
    var html = '<table class="edu-table"><thead><tr><th style="animation-delay:0ms">Position</th>';
    for (var i = 0; i < 8; i++) {
        var cls = bin[i] === '1' ? 'highlight-cell' : '';
        html += '<th class="' + cls + '" style="animation-delay:' + ((i + 1) * d) + 'ms">' + powers[i] + '</th>';
    }
    html += '</tr></thead><tbody>';

    /* Binary row */
    var rowOff = 9 * d;
    html += '<tr><td style="animation-delay:' + rowOff + 'ms"><strong>Binary</strong></td>';
    for (var i = 0; i < 8; i++) {
        var cls = bin[i] === '1' ? 'highlight-cell' : '';
        html += '<td class="' + cls + '" style="animation-delay:' + (rowOff + (i + 1) * d) + 'ms">' + bin[i] + '</td>';
    }
    html += '</tr>';

    /* Add row */
    var rowOff2 = 18 * d;
    html += '<tr><td style="animation-delay:' + rowOff2 + 'ms"><strong>Add</strong></td>';
    for (var i = 0; i < 8; i++) {
        var cls = bin[i] === '1' ? 'highlight-cell' : '';
        html += '<td class="' + cls + '" style="animation-delay:' + (rowOff2 + (i + 1) * d) + 'ms">' + (bin[i] === '1' ? powers[i] : '-') + '</td>';
    }
    html += '</tr></tbody></table>';

    /* Formula box */
    var formulaDelay = 27 * d;
    html += '<div class="formula-box" style="animation-delay:' + formulaDelay + 'ms">';
    html += (parts.length ? parts.join(' &nbsp;+&nbsp; ') : '0') + ' &nbsp;=&nbsp; ' + total;
    html += '</div>';

    out.innerHTML = html;
}

function convertDecToBin() {
    var dec = parseInt(document.getElementById('decInput').value, 10);
    var out = document.getElementById('decResult');
    if (!out) return;
    if (isNaN(dec) || dec < 0 || dec > 255) {
        out.innerHTML = dec !== dec ? '' : '<p style="color:var(--danger)">Enter 0-255</p>';
        return;
    }
    var bin = '';
    var rem = dec;
    var powers = [128, 64, 32, 16, 8, 4, 2, 1];
    var steps = [];
    for (var i = 0; i < 8; i++) {
        var fits = rem >= powers[i];
        var newRem = fits ? rem - powers[i] : rem;
        steps.push({ step: i + 1, power: powers[i], exponent: 7 - i, value: rem, fits: fits, bit: fits ? '1' : '0', remainder: newRem });
        if (fits) { bin += '1'; rem -= powers[i]; }
        else { bin += '0'; }
    }
    var html = '';

    /* Position / Binary / Add summary table (top) */
    var d = 60;
    var activeParts = [];
    html += '<table class="edu-table"><thead><tr><th style="animation-delay:0ms">Position</th>';
    for (var i = 0; i < 8; i++) {
        var cls = bin[i] === '1' ? 'highlight-cell' : '';
        html += '<th class="' + cls + '" style="animation-delay:' + ((i + 1) * d) + 'ms">' + powers[i] + '</th>';
    }
    html += '</tr></thead><tbody>';
    var rowOff = 9 * d;
    html += '<tr><td style="animation-delay:' + rowOff + 'ms"><strong>Binary</strong></td>';
    for (var i = 0; i < 8; i++) {
        var cls = bin[i] === '1' ? 'highlight-cell' : '';
        html += '<td class="' + cls + '" style="animation-delay:' + (rowOff + (i + 1) * d) + 'ms">' + bin[i] + '</td>';
    }
    html += '</tr>';
    var rowOff2 = 18 * d;
    html += '<tr><td style="animation-delay:' + rowOff2 + 'ms"><strong>Add</strong></td>';
    for (var i = 0; i < 8; i++) {
        var cls = bin[i] === '1' ? 'highlight-cell' : '';
        if (bin[i] === '1') activeParts.push(powers[i]);
        html += '<td class="' + cls + '" style="animation-delay:' + (rowOff2 + (i + 1) * d) + 'ms">' + (bin[i] === '1' ? powers[i] : '-') + '</td>';
    }
    html += '</tr></tbody></table>';
    var formulaDelay = 27 * d;
    html += '<div class="formula-box" style="animation-delay:' + formulaDelay + 'ms">';
    html += (activeParts.length ? activeParts.join(' &nbsp;+&nbsp; ') : '0') + ' &nbsp;=&nbsp; ' + dec;
    html += '</div>';

    var answerDelay = 29 * d;
    html += '<div class="converter-answer" style="text-align:center;margin-top:1em;animation-delay:' + answerDelay + 'ms">';
    html += '<p><strong>Decimal:</strong> ' + dec + '</p>';
    html += '<p style="font-size:1.3em;color:var(--secondary)"><strong>Binary = ' + bin + '</strong></p>';
    html += '</div>';
    html += '<details class="dec-steps-details"><summary>Show steps</summary>';
    html += '<div class="dec-steps-table-wrap">';
    html += '<table class="edu-table dec-steps-table">';
    html += '<thead><tr>';
    html += '<th>#</th><th>Power</th><th>Value</th><th>Fits in ' + dec + '?</th><th>Bit</th><th>Remainder</th>';
    html += '</tr></thead><tbody>';
    for (var j = 0; j < steps.length; j++) {
        var s = steps[j];
        var rowClass = s.fits ? 'step-fit' : 'step-nofit';
        html += '<tr class="' + rowClass + '">';
        html += '<td>' + s.step + '</td>';
        html += '<td>2<sup>' + s.exponent + '</sup> = ' + s.power + '</td>';
        html += '<td>' + s.value + '</td>';
        html += '<td>' + (s.fits ? '<span class="step-icon fit">&#10004; Yes</span>' : '<span class="step-icon nofit">&#10008; No</span>') + '</td>';
        html += '<td class="step-bit">' + s.bit + '</td>';
        html += '<td>' + s.remainder + '</td>';
        html += '</tr>';
    }
    html += '</tbody></table></div>';

    html += '</details>';
    out.innerHTML = html;
}

/* ---------- Interval Calculator ---------- */
function calculateInterval() {
    var val = parseInt(document.getElementById('maskOctet').value, 10);
    var out = document.getElementById('intervalResult');
    if (!out) return;
    if (isNaN(val) || val < 0 || val > 255) { out.innerHTML = ''; return; }
    var interval = 256 - val;
    var html = '<div style="text-align:center">';
    html += '<p>Mask octet value: <strong>' + val + '</strong></p>';
    html += '<p>256 - ' + val + ' = <strong style="color:var(--secondary);font-size:1.3em">' + interval + '</strong></p>';
    html += '<p>Each subnet has <strong>' + interval + '</strong> total IPs</p>';
    html += '</div>';
    out.innerHTML = html;
}

/* ---------- Helper Utilities ---------- */
function ipToInt(ip) {
    var p = ip.split('.');
    return ((parseInt(p[0]) << 24) | (parseInt(p[1]) << 16) | (parseInt(p[2]) << 8) | parseInt(p[3])) >>> 0;
}

function intToIp(n) {
    return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
}

function validateIP(ip) {
    var parts = ip.split('.');
    if (parts.length !== 4) return false;
    for (var i = 0; i < 4; i++) {
        var n = parseInt(parts[i], 10);
        if (isNaN(n) || n < 0 || n > 255 || String(n) !== parts[i].trim()) return false;
    }
    return true;
}

function cidrToMask(cidr) {
    if (cidr === 0) return '0.0.0.0';
    var mask = (0xFFFFFFFF << (32 - cidr)) >>> 0;
    return intToIp(mask);
}

function clampInt(v, lo, hi) {
    v = parseInt(v, 10);
    if (isNaN(v)) return lo;
    return Math.max(lo, Math.min(hi, v));
}

function decToBinStr(n) {
    var s = '';
    for (var i = 7; i >= 0; i--) s += ((n >> i) & 1) ? '1' : '0';
    return s;
}

function getIpClass(first) {
    if (first < 128) return 'A';
    if (first < 192) return 'B';
    if (first < 224) return 'C';
    if (first < 240) return 'D';
    return 'E';
}

function isPrivate(ip) {
    var parts = ip.split('.').map(Number);
    if (parts[0] === 10) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    return false;
}

/* ---------- Calculate From Mask (Tab 5) ---------- */
function calculateFromMask() {
    var ipVal = (document.getElementById('calcIP').value || '').trim();
    var cidrVal = clampInt(document.getElementById('calcCIDR').value, 0, 32);
    var out = document.getElementById('calcResults');
    if (!out) return;

    if (!validateIP(ipVal)) {
        out.innerHTML = '<p style="color:var(--danger)">Please enter a valid IP address</p>';
        return;
    }
    var ipInt = ipToInt(ipVal);
    var maskInt = cidrVal === 0 ? 0 : (0xFFFFFFFF << (32 - cidrVal)) >>> 0;
    var netInt = (ipInt & maskInt) >>> 0;
    var bcastInt = (netInt | (~maskInt >>> 0)) >>> 0;
    var total = Math.pow(2, 32 - cidrVal);
    var wildcard = intToIp((~maskInt) >>> 0);

    /* /31 and /32 edge-case handling */
    var usable, firstUsable, lastUsable, edgeNote = '';
    if (cidrVal === 32) {
        usable = 1;
        firstUsable = intToIp(netInt);
        lastUsable  = intToIp(netInt);
        edgeNote = '<div class="note-box" style="margin-top:12px"><p><strong>\u{1F4CC} Host Route (/32)</strong></p><p>A /32 identifies a single host. There is no network or broadcast address — the entire address space is one host. Commonly used in routing tables, loopback interfaces, and ACLs.</p></div>';
    } else if (cidrVal === 31) {
        usable = 2;
        firstUsable = intToIp(netInt);
        lastUsable  = intToIp(bcastInt);
        edgeNote = '<div class="note-box" style="margin-top:12px"><p><strong>\u{1F4CC} Point-to-Point Link (/31 — RFC 3021)</strong></p><p>A /31 subnet has exactly 2 addresses, both usable. There is no reserved network or broadcast address. This is the standard for point-to-point router links to conserve IP space.</p></div>';
    } else {
        usable = total > 2 ? total - 2 : total;
        firstUsable = intToIp(netInt + 1);
        lastUsable  = intToIp(bcastInt - 1);
    }

    var html = '<div class="copy-result-wrap"><button class="copy-result-btn" onclick="copyResultText(this)" title="Copy results to clipboard">📋 Copy</button>';
    html += '<table class="edu-table" style="margin-top:10px">';
    html += '<tr><td><strong>IP Address</strong></td><td>' + ipVal + '</td></tr>';
    html += '<tr><td><strong>CIDR</strong></td><td>/' + cidrVal + '</td></tr>';
    html += '<tr><td><strong>Subnet Mask</strong></td><td>' + cidrToMask(cidrVal) + '</td></tr>';
    html += '<tr><td><strong>Wildcard</strong></td><td>' + wildcard + '</td></tr>';
    html += '<tr><td><strong>Network Address</strong></td><td>' + intToIp(netInt) + (cidrVal === 32 ? ' <em>(host route)</em>' : '') + '</td></tr>';
    if (cidrVal === 32) {
        html += '<tr><td><strong>Broadcast</strong></td><td>N/A <em>(single host)</em></td></tr>';
    } else if (cidrVal === 31) {
        html += '<tr><td><strong>Broadcast</strong></td><td>N/A <em>(point-to-point)</em></td></tr>';
    } else {
        html += '<tr><td><strong>Broadcast</strong></td><td>' + intToIp(bcastInt) + '</td></tr>';
    }
    html += '<tr><td><strong>First Usable</strong></td><td>' + firstUsable + '</td></tr>';
    html += '<tr><td><strong>Last Usable</strong></td><td>' + lastUsable + '</td></tr>';
    html += '<tr><td><strong>Total IPs</strong></td><td>' + total.toLocaleString() + '</td></tr>';
    html += '<tr><td><strong>Usable Hosts</strong></td><td>' + usable.toLocaleString() + '</td></tr>';
    html += '</table>';
    html += edgeNote;

    /* Subnet context bar (shows subnet within parent block) */
    html += buildSubnetContextBar(netInt, cidrVal);
    html += '</div>';

    out.innerHTML = html;
}

/* ---------- Subnet Context Bar (shows subnet within parent block) ---------- */
function buildSubnetContextBar(netInt, cidr) {
    /* Choose a parent CIDR that is 4–8 bits larger, clamped to /8 minimum */
    var parentCIDR;
    if (cidr <= 8) return ''; /* No meaningful parent to show */
    if (cidr <= 16) parentCIDR = 8;
    else if (cidr <= 24) parentCIDR = 16;
    else parentCIDR = 24;

    var parentMask = (0xFFFFFFFF << (32 - parentCIDR)) >>> 0;
    var parentNet = (netInt & parentMask) >>> 0;
    var parentSize = Math.pow(2, 32 - parentCIDR);
    var subnetSize = Math.pow(2, 32 - cidr);
    var subnetOffset = netInt - parentNet;
    var fraction = subnetSize / parentSize;
    var offsetFraction = subnetOffset / parentSize;
    var remainFraction = 1 - offsetFraction - fraction;

    /* Subnet index within parent (0-based) */
    var subBits = cidr - parentCIDR;
    var subnetCount = Math.pow(2, subBits);
    var subnetIndex = Math.floor(subnetOffset / subnetSize);

    var html = '<div class="subnet-visual subnet-context-visual" style="margin-top:16px">';
    html += '<h4>📊 Subnet in Context — /' + cidr + ' within /' + parentCIDR + ' block</h4>';

    /* Bit strip: N / S / H */
    var hostBits = 32 - cidr;
    html += '<div class="bit-strip-labels">';
    html += '<span class="bit-label bit-label--network">Network: ' + parentCIDR + ' bits</span>';
    html += '<span class="bit-label bit-label--subnet">Subnet: ' + subBits + ' bits</span>';
    html += '<span class="bit-label bit-label--host">Host: ' + hostBits + ' bits</span>';
    html += '</div>';
    html += '<div class="bit-strip" role="img" aria-label="32-bit address layout: ' + parentCIDR + ' network bits, ' + subBits + ' subnet bits, ' + hostBits + ' host bits">';
    for (var b = 0; b < 32; b++) {
        var cls, letter, srLabel, tipText;
        if (b < parentCIDR) {
            cls = 'bit-cell--network'; letter = 'N'; srLabel = 'Network';
            tipText = 'Network bit ' + (b + 1) + ' — Identifies the network (fixed by ISP/admin)';
        } else if (b < cidr) {
            cls = 'bit-cell--subnet'; letter = 'S'; srLabel = 'Subnet';
            tipText = 'Subnet bit ' + (b + 1 - parentCIDR) + ' of ' + subBits + ' — Borrowed to create ' + Math.pow(2, subBits) + ' subnets';
        } else {
            cls = 'bit-cell--host'; letter = 'H'; srLabel = 'Host';
            tipText = 'Host bit ' + (b + 1 - cidr) + ' of ' + hostBits + ' — Identifies hosts (' + (Math.pow(2, hostBits) - 2) + ' usable)';
        }
        html += '<div class="bit-cell ' + cls + '" data-bit-tooltip="' + tipText + '" aria-hidden="true">' + letter + '</div>';
    }
    html += '</div>';

    /* Bit-strip color legend */
    html += '<div class="bit-color-legend">';
    html += '<div class="bit-color-legend-item"><span class="bit-color-swatch" style="background:#3730a3"></span><strong>N</strong> — Network bits: Fixed portion that identifies which network this address belongs to</div>';
    html += '<div class="bit-color-legend-item"><span class="bit-color-swatch" style="background:#047857"></span><strong>S</strong> — Subnet bits: Bits borrowed from host space to divide the network into ' + Math.pow(2, subBits) + ' smaller subnets</div>';
    html += '<div class="bit-color-legend-item"><span class="bit-color-swatch" style="background:#E2E8F0;border:1px solid #CBD5E1"></span><strong>H</strong> — Host bits: Identify individual devices within each subnet (' + (Math.pow(2, hostBits) - 2) + ' usable hosts)</div>';
    html += '</div>';

    /* --- Proportional position bar --- */
    /* Ensure subnet segment is always visible (min 6% width) */
    var minPct = 6;
    var rawSubnetPct = fraction * 100;
    var subnetPct = Math.max(rawSubnetPct, minPct);
    /* Scale the remaining fractions proportionally if we boosted the subnet */
    var scale = rawSubnetPct < minPct && (offsetFraction + remainFraction) > 0
        ? (100 - minPct) / ((offsetFraction + remainFraction) * 100)
        : 1;
    var pctBefore = (offsetFraction * 100 * scale).toFixed(2);
    var pctAfter  = (remainFraction * 100 * scale).toFixed(2);
    var pctSubnetStr = subnetPct.toFixed(2);

    /* Parent block range labels */
    var parentEnd = (parentNet + parentSize - 1) >>> 0;
    html += '<div class="ctx-bar-range">';
    html += '<span>' + intToIp(parentNet) + '</span>';
    html += '<span>' + intToIp(parentEnd) + '</span>';
    html += '</div>';

    html += '<div class="subnet-bar-container ctx-bar" style="height:52px;position:relative">';
    if (offsetFraction > 0) {
        var beforeStartIp = intToIp(parentNet);
        var beforeEndIp = intToIp(netInt - 1);
        html += '<div class="ctx-segment ctx-segment--before" style="flex:' + pctBefore + '"';
        html += ' data-pop-title="Preceding Address Space"';
        html += ' data-pop-line1="' + subnetIndex + ' subnet' + (subnetIndex > 1 ? 's' : '') + ' exist before yours in this /' + parentCIDR + ' block"';
        html += ' data-pop-line2="Range: ' + beforeStartIp + ' – ' + beforeEndIp + '"';
        html += ' data-pop-line3="Contains ' + (subnetIndex * subnetSize).toLocaleString() + ' total IPs"';
        html += '>';
        html += '<span class="ctx-segment-label">' + subnetIndex + ' before</span>';
        html += '</div>';
    }
    html += '<div class="ctx-segment ctx-segment--active" style="flex:' + pctSubnetStr + '"';
    html += ' data-pop-title="✦ Your Subnet"';
    html += ' data-pop-line1="' + intToIp(netInt) + '/' + cidr + '"';
    html += ' data-pop-line2="Size: ' + subnetSize.toLocaleString() + ' total IPs (' + (subnetSize > 2 ? subnetSize - 2 : subnetSize).toLocaleString() + ' usable)"';
    html += ' data-pop-line3="Subnet #' + (subnetIndex + 1) + ' of ' + subnetCount + ' in the /' + parentCIDR + ' block"';
    html += '>';
    html += '<span class="ctx-active-label">' + intToIp(netInt) + '/' + cidr + '</span>';
    html += '</div>';
    if (remainFraction > 0.001) {
        var followCount = subnetCount - subnetIndex - 1;
        var afterStartIp = intToIp((netInt + subnetSize) >>> 0);
        var afterEndIp = intToIp(parentEnd);
        html += '<div class="ctx-segment ctx-segment--after" style="flex:' + pctAfter + '"';
        html += ' data-pop-title="Following Address Space"';
        html += ' data-pop-line1="' + followCount + ' subnet' + (followCount > 1 ? 's' : '') + ' exist after yours in this /' + parentCIDR + ' block"';
        html += ' data-pop-line2="Range: ' + afterStartIp + ' – ' + afterEndIp + '"';
        html += ' data-pop-line3="Contains ' + (followCount * subnetSize).toLocaleString() + ' total IPs"';
        html += '>';
        html += '<span class="ctx-segment-label">' + followCount + ' after</span>';
        html += '</div>';
    }
    html += '</div>';

    /* --- Legend --- */
    html += '<div class="ctx-legend">';
    html += '<div class="ctx-legend-item"><span class="ctx-legend-swatch" style="background:#4f46e5"></span>Your subnet (/' + cidr + ')</div>';
    html += '<div class="ctx-legend-item"><span class="ctx-legend-swatch" style="background:#E2E8F0"></span>Other /' + cidr + ' subnets in the /' + parentCIDR + ' block</div>';
    html += '</div>';

    /* Caption */
    html += '<p class="ctx-caption">';
    html += 'Your /' + cidr + ' is <strong>subnet #' + (subnetIndex + 1) + ' of ' + subnetCount + '</strong> in the /' + parentCIDR + ' block ';
    html += '(' + intToIp(parentNet) + '/' + parentCIDR + ') — each holds <strong>' + subnetSize.toLocaleString() + ' IPs</strong>';
    html += '</p>';

    html += '</div>';
    return html;
}

function getSubnetColor(index) {
    var colors = [
        '#e8f5e9', '#e3f2fd', '#fff3e0', '#f3e5f5',
        '#e0f7fa', '#fce4ec', '#f1f8e9', '#ede7f6',
        '#fff8e1', '#e8eaf6', '#e0f2f1', '#fbe9e7',
        '#f9fbe7', '#e1f5fe', '#fff9c4', '#f3e5f5'
    ];
    return colors[index % colors.length];
}

/* ---------- Block Divider (Intervals Tab) ---------- */
function updateBlockDivider() {
    var ipEl = document.getElementById('dividerBaseIP');
    var baseCIDR = parseInt(document.getElementById('dividerBaseCIDR').value, 10);
    var slider = document.getElementById('dividerSlider');
    var label = document.getElementById('dividerTargetLabel');
    var statsEl = document.getElementById('dividerStats');
    var visualEl = document.getElementById('dividerVisual');
    if (!ipEl || !slider || !visualEl) return;

    /* Recalculate slider max whenever baseCIDR changes */
    var maxBorrow = 30 - baseCIDR;
    if (maxBorrow < 0) maxBorrow = 0;
    slider.max = maxBorrow;
    if (parseInt(slider.value, 10) > maxBorrow) slider.value = maxBorrow;

    /* Build tick labels */
    var ticksEl = document.getElementById('dividerTicks');
    if (ticksEl) {
        var tickHtml = '';
        for (var t = 0; t <= maxBorrow; t++) {
            tickHtml += '<span>/' + (baseCIDR + t) + '</span>';
        }
        ticksEl.innerHTML = tickHtml;
    }

    var bitsNeeded = parseInt(slider.value, 10);
    var newCIDR = baseCIDR + bitsNeeded;
    var actualCount = Math.pow(2, bitsNeeded);
    var blockSize = Math.pow(2, 32 - newCIDR);
    var usable = blockSize > 2 ? blockSize - 2 : blockSize;

    /* Label */
    if (bitsNeeded === 0) {
        label.textContent = '/' + baseCIDR + ' (no split)';
    } else {
        label.textContent = '/' + newCIDR + ' (' + actualCount + ' subnets)';
    }

    /* IP handling */
    var ipVal = (ipEl.value || '').trim();
    if (!validateIP(ipVal)) {
        statsEl.innerHTML = '';
        visualEl.innerHTML = '<p style="color:var(--danger);text-align:center">Enter a valid base IP above</p>';
        return;
    }
    var baseInt = ipToInt(ipVal);
    baseInt = (baseInt & ((0xFFFFFFFF << (32 - baseCIDR)) >>> 0)) >>> 0;

    /* Stats */
    var shtml = '<div class="divider-stats-grid">';
    shtml += '<div class="divider-stat"><span class="divider-stat-val">' + actualCount + '</span><span class="divider-stat-lbl">Subnets</span></div>';
    shtml += '<div class="divider-stat"><span class="divider-stat-val">' + blockSize.toLocaleString() + '</span><span class="divider-stat-lbl">IPs each</span></div>';
    shtml += '<div class="divider-stat"><span class="divider-stat-val">' + usable.toLocaleString() + '</span><span class="divider-stat-lbl">Usable each</span></div>';
    shtml += '<div class="divider-stat"><span class="divider-stat-val">' + bitsNeeded + '</span><span class="divider-stat-lbl">Bits borrowed</span></div>';
    shtml += '</div>';
    statsEl.innerHTML = shtml;

    /* No split: show entire block as one bar */
    if (bitsNeeded === 0) {
        var totalIPs = Math.pow(2, 32 - baseCIDR);
        var vhtml = '<div class="subnet-visual">';
        vhtml += '<h4>Entire /' + baseCIDR + ' block \u2014 ' + totalIPs.toLocaleString() + ' IPs</h4>';
        vhtml += '<div class="subnet-bar-container" style="height:70px">';
        vhtml += '<div class="subnet-segment" style="flex:1;background:' + getSubnetBarColor(0) + '" data-tooltip="' + intToIp(baseInt) + ' \u2013 ' + intToIp((baseInt + totalIPs - 1) >>> 0) + '">';
        vhtml += '<span>' + intToIp(baseInt) + '/' + baseCIDR + '</span>';
        vhtml += '<span class="subnet-segment-label">' + totalIPs.toLocaleString() + ' IPs (whole block)</span>';
        vhtml += '</div></div></div>';
        visualEl.innerHTML = vhtml;
        return;
    }

    /* Build visual using existing helper */
    visualEl.innerHTML = buildSubnetVisual(baseInt, baseCIDR, newCIDR, actualCount, blockSize, bitsNeeded);
}


/* ---------- Subnet Bar Color (vibrant, for visualization) ---------- */
function getSubnetBarColor(index) {
    var colors = [
        '#4f46e5', '#059669', '#b45309', '#dc2626',
        '#0891b2', '#7c3aed', '#0d9488', '#c2410c',
        '#2563eb', '#db2777', '#4d7c0f', '#a21caf',
        '#0369a1', '#be123c', '#6d28d9', '#475569'
    ];
    return colors[index % colors.length];
}

/* ---------- Build Subnet Visualization ---------- */
function buildSubnetVisual(baseInt, baseCIDR, newCIDR, actualCount, blockSize, bitsNeeded) {
    var html = '<div class="subnet-visual">';
    html += '<h4>📊 Network Division Visualization</h4>';

    /* 32-bit strip */
    var hostBits = 32 - newCIDR;
    html += '<div class="bit-strip-labels">';
    html += '<span class="bit-label bit-label--network">Network: ' + baseCIDR + ' bits</span>';
    html += '<span class="bit-label bit-label--subnet">Subnet: ' + bitsNeeded + ' bits</span>';
    html += '<span class="bit-label bit-label--host">Host: ' + hostBits + ' bits</span>';
    html += '</div>';
    html += '<div class="bit-strip" role="img" aria-label="32-bit address layout: ' + baseCIDR + ' network bits, ' + bitsNeeded + ' subnet bits, ' + hostBits + ' host bits">';
    for (var b = 0; b < 32; b++) {
        var cls, letter, srLabel, tipText;
        if (b < baseCIDR) {
            cls = 'bit-cell--network'; letter = 'N'; srLabel = 'Network';
            tipText = 'Network bit ' + (b + 1) + ' — Identifies the network (fixed by ISP/admin)';
        } else if (b < newCIDR) {
            cls = 'bit-cell--subnet'; letter = 'S'; srLabel = 'Subnet';
            tipText = 'Subnet bit ' + (b + 1 - baseCIDR) + ' of ' + bitsNeeded + ' — Borrowed to create ' + Math.pow(2, bitsNeeded) + ' subnets';
        } else {
            cls = 'bit-cell--host'; letter = 'H'; srLabel = 'Host';
            tipText = 'Host bit ' + (b + 1 - newCIDR) + ' of ' + hostBits + ' — Identifies hosts (' + (Math.pow(2, hostBits) - 2) + ' usable)';
        }
        html += '<div class="bit-cell ' + cls + '" data-bit-tooltip="' + tipText + '" aria-hidden="true">' + letter + '</div>';
    }
    html += '</div>';

    /* Bit-strip color legend */
    html += '<div class="bit-color-legend">';
    html += '<div class="bit-color-legend-item"><span class="bit-color-swatch" style="background:#3730a3"></span><strong>N</strong> — Network bits: Fixed portion that identifies which network this address belongs to</div>';
    html += '<div class="bit-color-legend-item"><span class="bit-color-swatch" style="background:#047857"></span><strong>S</strong> — Subnet bits: Bits borrowed from host space to divide the network into ' + Math.pow(2, bitsNeeded) + ' smaller subnets</div>';
    html += '<div class="bit-color-legend-item"><span class="bit-color-swatch" style="background:#E2E8F0;border:1px solid #CBD5E1"></span><strong>H</strong> — Host bits: Identify individual devices within each subnet (' + (Math.pow(2, hostBits) - 2) + ' usable hosts)</div>';
    html += '</div>';

    /* Proportional bar */
    var maxVisible = 16;
    var showCount = Math.min(actualCount, maxVisible);
    var overflow = actualCount - showCount;
    html += '<div class="subnet-bar-container">';
    var usableHosts = blockSize > 2 ? blockSize - 2 : blockSize;
    for (var i = 0; i < showCount; i++) {
        var netAddr = (baseInt + i * blockSize) >>> 0;
        var bcast = (netAddr + blockSize - 1) >>> 0;
        var firstUsable = blockSize > 2 ? intToIp((netAddr + 1) >>> 0) : intToIp(netAddr);
        var lastUsable  = blockSize > 2 ? intToIp((bcast - 1) >>> 0) : intToIp(bcast);
        html += '<div class="subnet-segment" style="flex:1;background:' + getSubnetBarColor(i) + '"';
        html += ' data-pop-title="Subnet #' + (i + 1) + ' of ' + actualCount + '"';
        html += ' data-pop-line1="Network: ' + intToIp(netAddr) + '/' + newCIDR + '"';
        html += ' data-pop-line2="Usable: ' + firstUsable + ' – ' + lastUsable + '"';
        html += ' data-pop-line3="' + usableHosts.toLocaleString() + ' usable hosts · Broadcast: ' + intToIp(bcast) + '"';
        html += '>';
        html += '<span>#' + (i + 1) + '</span>';
        html += '<span class="subnet-segment-label">' + intToIp(netAddr) + '</span>';
        html += '</div>';
    }
    if (overflow > 0) {
        var ovStart = (baseInt + showCount * blockSize) >>> 0;
        var ovEnd   = (baseInt + actualCount * blockSize - 1) >>> 0;
        var ovIPs   = overflow * blockSize;
        html += '<div class="subnet-segment subnet-segment--overflow" style="flex:1;background:#94a3b8"';
        html += ' data-pop-title="+' + overflow + ' more subnets"';
        html += ' data-pop-line1="Subnets #' + (showCount + 1) + ' – #' + actualCount + '"';
        html += ' data-pop-line2="Range: ' + intToIp(ovStart) + ' – ' + intToIp(ovEnd) + '"';
        html += ' data-pop-line3="Contains ' + ovIPs.toLocaleString() + ' total IPs"';
        html += '>';
        html += '<span>+' + overflow + '</span>';
        html += '<span class="subnet-segment-label">more</span>';
        html += '</div>';
    }
    html += '</div>';

    /* Legend */
    html += '<div class="subnet-legend">';
    var legendCount = Math.min(actualCount, maxVisible);
    for (var j = 0; j < legendCount; j++) {
        var netAddr2 = (baseInt + j * blockSize) >>> 0;
        html += '<div class="subnet-legend-item">';
        html += '<div class="subnet-legend-color" style="background:' + getSubnetBarColor(j) + '"></div>';
        html += '<span>Subnet ' + (j + 1) + ': ' + intToIp(netAddr2) + '/' + newCIDR + '</span>';
        html += '</div>';
    }
    if (overflow > 0) {
        html += '<div class="subnet-legend-item">';
        html += '<div class="subnet-legend-color" style="background:#94a3b8"></div>';
        html += '<span>+ ' + overflow + ' more subnets</span>';
        html += '</div>';
    }
    html += '</div>';

    html += '</div>';
    return html;
}

/* ---------- Create Subnets (Tab 6) ---------- */
function createSubnets() {
    var baseIP = (document.getElementById('subnetBaseIP').value || '').trim();
    var baseCIDR = clampInt(document.getElementById('subnetBaseCIDR').value, 0, 32);
    var count = clampInt(document.getElementById('subnetCount').value, 2, 256);
    var out = document.getElementById('subnetResults');
    if (!out) return;

    if (!validateIP(baseIP)) {
        out.innerHTML = '<p style="color:var(--danger)">Enter a valid base network IP</p>';
        return;
    }

    var bitsNeeded = Math.ceil(Math.log(count) / Math.log(2));
    var newCIDR = baseCIDR + bitsNeeded;
    if (newCIDR > 30) {
        out.innerHTML = '<p style="color:var(--danger)">Cannot create that many subnets from /' + baseCIDR + '</p>';
        return;
    }

    var actualCount = Math.pow(2, bitsNeeded);
    var blockSize = Math.pow(2, 32 - newCIDR);
    var usable = blockSize - 2;
    var baseInt = ipToInt(baseIP);
    var maskInt = newCIDR === 0 ? 0 : (0xFFFFFFFF << (32 - newCIDR)) >>> 0;
    baseInt = (baseInt & ((0xFFFFFFFF << (32 - baseCIDR)) >>> 0)) >>> 0;

    var html = '<div style="margin-bottom:15px">';
    html += '<p><strong>Original:</strong> ' + intToIp(baseInt) + '/' + baseCIDR + '</p>';
    html += '<p><strong>New CIDR:</strong> /' + newCIDR + ' (borrowed ' + bitsNeeded + ' bits)</p>';
    html += '<p><strong>Subnets created:</strong> ' + actualCount + ' (you asked for ' + count + ')</p>';
    html += '<p><strong>Hosts per subnet:</strong> ' + usable + ' usable (' + blockSize + ' total)</p>';
    html += '<p><strong>New Mask:</strong> ' + cidrToMask(newCIDR) + '</p>';
    html += '</div>';

    html += buildSubnetVisual(baseInt, baseCIDR, newCIDR, actualCount, blockSize, bitsNeeded);

    html += '<table class="edu-table"><thead><tr>';
    html += '<th>#</th><th>Network</th><th>First Usable</th><th>Last Usable</th><th>Broadcast</th><th>Hosts</th>';
    html += '</tr></thead><tbody>';

    for (var i = 0; i < actualCount && i < 64; i++) {
        var netAddr = (baseInt + i * blockSize) >>> 0;
        var bcast = (netAddr + blockSize - 1) >>> 0;
        html += '<tr style="background:' + getSubnetColor(i) + '">';
        html += '<td>' + (i + 1) + '</td>';
        html += '<td>' + intToIp(netAddr) + '/' + newCIDR + '</td>';
        html += '<td>' + intToIp(netAddr + 1) + '</td>';
        html += '<td>' + intToIp(bcast - 1) + '</td>';
        html += '<td>' + intToIp(bcast) + '</td>';
        html += '<td>' + usable + '</td>';
        html += '</tr>';
    }
    if (actualCount > 64) {
        html += '<tr><td colspan="6" style="text-align:center">... showing first 64 of ' + actualCount + ' subnets</td></tr>';
    }
    html += '</tbody></table>';
    out.innerHTML = html;
}

/* =============================================
   Unified Network Assistant – parseUnifiedInput
   Reads from individual form fields
   ============================================= */
function parseUnifiedInput() {
    var ipVal    = (document.getElementById('uniIP').value || '').trim();
    var maskVal  = (document.getElementById('uniMask').value || '').trim();
    var cidrVal  = (document.getElementById('uniCIDR').value || '').trim().replace(/^\//, '');
    var subCount = parseInt(document.getElementById('uniSubnets').value, 10) || 0;
    var decVal   = (document.getElementById('uniDecimal').value || '').trim();
    var out      = document.getElementById('unifiedResults');
    if (!out) return;

    /* Nothing entered? */
    if (!ipVal && !maskVal && !cidrVal && !subCount && !decVal) {
        out.innerHTML = '<p class="empty-state">💡 Fill in one or more fields above, then press Analyze &amp; Solve</p>';
        return;
    }

    var sections = [];
    var cidrNum = cidrVal !== '' ? clampInt(cidrVal, 0, 32) : null;

    /* --- 1. IP Analysis --- */
    if (ipVal && validateIP(ipVal)) {
        var parts = ipVal.split('.').map(Number);
        var first = parts[0];
        var cls = getIpClass(first);
        var priv = isPrivate(ipVal);
        var binOctets = parts.map(function(o) { return decToBinStr(o); });

        /* Determine effective CIDR: explicit field > mask field > null */
        var effCIDR = cidrNum;
        if (effCIDR === null && maskVal && validateIP(maskVal)) {
            var mInt = ipToInt(maskVal);
            var bc = 0;
            for (var b = 31; b >= 0; b--) { if ((mInt >>> b) & 1) bc++; else break; }
            effCIDR = bc;
        }

        var s = '<div style="margin-bottom:15px;padding:12px;background:var(--primary-tint-light);border-radius:8px;border-left:4px solid var(--primary)">';
        s += '<h3 style="margin:0 0 8px 0;color:var(--primary)">📍 IP Address: ' + ipVal;
        if (effCIDR !== null) s += ' /' + effCIDR;
        s += '</h3>';
        s += '<table class="edu-table" style="margin:0"><tbody>';
        s += '<tr><td><strong>Class</strong></td><td>' + cls + '</td></tr>';
        s += '<tr><td><strong>Type</strong></td><td>' + (priv ? '🔒 Private' : '🌐 Public') + '</td></tr>';
        s += '<tr><td><strong>Binary</strong></td><td style="font-family:monospace">' + binOctets.join('.') + '</td></tr>';

        if (effCIDR !== null) {
            var maskInt = effCIDR === 0 ? 0 : (0xFFFFFFFF << (32 - effCIDR)) >>> 0;
            var ipInt = ipToInt(ipVal);
            var netInt = (ipInt & maskInt) >>> 0;
            var bcastInt = (netInt | (~maskInt >>> 0)) >>> 0;
            var total = Math.pow(2, 32 - effCIDR);
            var wildcard = intToIp((~maskInt) >>> 0);

            /* /31 and /32 edge cases */
            var usableH, fuIP, luIP;
            if (effCIDR === 32) {
                usableH = 1; fuIP = intToIp(netInt); luIP = intToIp(netInt);
            } else if (effCIDR === 31) {
                usableH = 2; fuIP = intToIp(netInt); luIP = intToIp(bcastInt);
            } else {
                usableH = total > 2 ? total - 2 : total;
                fuIP = intToIp(netInt + 1); luIP = intToIp(bcastInt - 1);
            }

            s += '<tr><td><strong>Subnet Mask</strong></td><td>' + cidrToMask(effCIDR) + '</td></tr>';
            s += '<tr><td><strong>Wildcard</strong></td><td>' + wildcard + '</td></tr>';
            s += '<tr><td><strong>Network</strong></td><td>' + intToIp(netInt) + (effCIDR === 32 ? ' <em>(host route)</em>' : '') + '</td></tr>';
            if (effCIDR === 32) {
                s += '<tr><td><strong>Broadcast</strong></td><td>N/A <em>(single host)</em></td></tr>';
            } else if (effCIDR === 31) {
                s += '<tr><td><strong>Broadcast</strong></td><td>N/A <em>(point-to-point)</em></td></tr>';
            } else {
                s += '<tr><td><strong>Broadcast</strong></td><td>' + intToIp(bcastInt) + '</td></tr>';
            }
            s += '<tr><td><strong>First Usable</strong></td><td>' + fuIP + '</td></tr>';
            s += '<tr><td><strong>Last Usable</strong></td><td>' + luIP + '</td></tr>';
            s += '<tr><td><strong>Total IPs</strong></td><td>' + total.toLocaleString() + '</td></tr>';
            s += '<tr><td><strong>Usable Hosts</strong></td><td>' + usableH.toLocaleString() + '</td></tr>';
            if (effCIDR === 32) {
                s += '</tbody></table><div class="note-box" style="margin-top:8px"><p><strong>\u{1F4CC} Host Route (/32)</strong> — Single host, no network/broadcast. Used in routing tables and ACLs.</p></div>';
            } else if (effCIDR === 31) {
                s += '</tbody></table><div class="note-box" style="margin-top:8px"><p><strong>\u{1F4CC} Point-to-Point (/31 — RFC 3021)</strong> — Both addresses usable, no reserved network/broadcast.</p></div>';
            }
        }
        if (effCIDR === null || (effCIDR !== 32 && effCIDR !== 31)) {
            s += '</tbody></table>';
        }
        s += '</div>';
        sections.push(s);
    } else if (ipVal) {
        sections.push('<div style="padding:12px;background:var(--danger-tint);border-radius:8px;border-left:4px solid var(--danger)"><p style="color:var(--danger-tint-text)">⚠️ Invalid IP address: ' + ipVal + '</p></div>');
    }

    /* --- 2. Standalone mask (no IP given) --- */
    if (!ipVal && maskVal && validateIP(maskVal)) {
        var mInt = ipToInt(maskVal);
        var bits = 0;
        for (var b = 31; b >= 0; b--) { if ((mInt >>> b) & 1) bits++; else break; }
        var interval = 256 - (mInt & 255);
        if ((mInt & 255) === 0 && ((mInt >>> 8) & 255) !== 255) {
            interval = 256 - ((mInt >>> 8) & 255);
        }
        var wc = intToIp((~mInt) >>> 0);
        var s = '<div style="margin-bottom:15px;padding:12px;background:var(--primary-tint-light);border-radius:8px;border-left:4px solid var(--primary)">';
        s += '<h3 style="margin:0 0 8px 0;color:var(--primary)">🎭 Subnet Mask: ' + maskVal + '</h3>';
        s += '<table class="edu-table" style="margin:0"><tbody>';
        s += '<tr><td><strong>CIDR</strong></td><td>/' + bits + '</td></tr>';
        s += '<tr><td><strong>Wildcard</strong></td><td>' + wc + '</td></tr>';
        s += '<tr><td><strong>Total IPs</strong></td><td>' + Math.pow(2, 32 - bits).toLocaleString() + '</td></tr>';
        s += '<tr><td><strong>Usable Hosts</strong></td><td>' + (Math.pow(2, 32 - bits) - 2).toLocaleString() + '</td></tr>';
        s += '<tr><td><strong>Block Size</strong></td><td>' + interval + '</td></tr>';
        s += '</tbody></table></div>';
        sections.push(s);
    }

    /* --- 3. Standalone CIDR (no IP given) --- */
    if (!ipVal && cidrNum !== null) {
        var mask = cidrToMask(cidrNum);
        var total = Math.pow(2, 32 - cidrNum);
        var s = '<div style="margin-bottom:15px;padding:12px;background:var(--primary-tint-light);border-radius:8px;border-left:4px solid var(--primary)">';
        s += '<h3 style="margin:0 0 8px 0;color:var(--primary)">📏 CIDR /' + cidrNum + '</h3>';
        s += '<table class="edu-table" style="margin:0"><tbody>';
        s += '<tr><td><strong>Subnet Mask</strong></td><td>' + mask + '</td></tr>';
        s += '<tr><td><strong>Wildcard</strong></td><td>' + intToIp((~ipToInt(mask)) >>> 0) + '</td></tr>';
        s += '<tr><td><strong>Total IPs</strong></td><td>' + total.toLocaleString() + '</td></tr>';
        s += '<tr><td><strong>Usable Hosts</strong></td><td>' + (total > 2 ? total - 2 : total).toLocaleString() + '</td></tr>';
        s += '</tbody></table></div>';
        sections.push(s);
    }

    /* --- 4. Subnetting --- */
    if (subCount >= 2 && ipVal && validateIP(ipVal)) {
        var baseCIDR = cidrNum;
        if (baseCIDR === null && maskVal && validateIP(maskVal)) {
            var mm = ipToInt(maskVal);
            var bc2 = 0;
            for (var b2 = 31; b2 >= 0; b2--) { if ((mm >>> b2) & 1) bc2++; else break; }
            baseCIDR = bc2;
        }
        if (baseCIDR === null) baseCIDR = 24; /* default */

        var bitsNeeded = Math.ceil(Math.log(subCount) / Math.log(2));
        var newCIDR = baseCIDR + bitsNeeded;

        if (newCIDR > 30) {
            sections.push('<div style="padding:12px;background:var(--danger-tint);border-radius:8px;border-left:4px solid var(--danger)"><p style="color:var(--danger-tint-text)">❌ Cannot create ' + subCount + ' subnets from /' + baseCIDR + '</p></div>');
        } else {
            var actualCount = Math.pow(2, bitsNeeded);
            var blockSize = Math.pow(2, 32 - newCIDR);
            var usableSub = blockSize - 2;
            var baseInt = ipToInt(ipVal);
            baseInt = (baseInt & ((0xFFFFFFFF << (32 - baseCIDR)) >>> 0)) >>> 0;

            var s = '<div style="margin-bottom:15px;padding:12px;background:var(--secondary-tint);border-radius:8px;border-left:4px solid var(--secondary)">';
            s += '<h3 style="margin:0 0 8px 0;color:var(--secondary-tint-text)">🔪 Subnetting: ' + intToIp(baseInt) + '/' + baseCIDR + ' into ' + subCount + ' subnets</h3>';
            s += '<p><strong>Bits borrowed:</strong> ' + bitsNeeded + ' | <strong>New CIDR:</strong> /' + newCIDR + ' | <strong>Actual subnets:</strong> ' + actualCount + '</p>';
            s += '<p><strong>New Mask:</strong> ' + cidrToMask(newCIDR) + ' | <strong>Hosts/subnet:</strong> ' + usableSub + '</p>';
            s += buildSubnetVisual(baseInt, baseCIDR, newCIDR, actualCount, blockSize, bitsNeeded);
            s += '<table class="edu-table"><thead><tr><th>#</th><th>Network</th><th>First Usable</th><th>Last Usable</th><th>Broadcast</th><th>Hosts</th></tr></thead><tbody>';

            var limit = Math.min(actualCount, 32);
            for (var si = 0; si < limit; si++) {
                var netAddr = (baseInt + si * blockSize) >>> 0;
                var bcast = (netAddr + blockSize - 1) >>> 0;
                s += '<tr style="background:' + getSubnetColor(si) + '">';
                s += '<td>' + (si + 1) + '</td>';
                s += '<td>' + intToIp(netAddr) + '/' + newCIDR + '</td>';
                s += '<td>' + intToIp(netAddr + 1) + '</td>';
                s += '<td>' + intToIp(bcast - 1) + '</td>';
                s += '<td>' + intToIp(bcast) + '</td>';
                s += '<td>' + usableSub + '</td>';
                s += '</tr>';
            }
            if (actualCount > 32) {
                s += '<tr><td colspan="6" style="text-align:center;font-style:italic">Showing 32 of ' + actualCount + ' subnets</td></tr>';
            }
            s += '</tbody></table></div>';
            sections.push(s);
        }
    }

    /* --- 5. Decimal → Binary --- */
    if (decVal) {
        var nums = decVal.split(/[,\s]+/);
        var validNums = [];
        for (var di = 0; di < nums.length; di++) {
            var n = parseInt(nums[di], 10);
            if (!isNaN(n) && n >= 0 && n <= 255) validNums.push(n);
        }
        if (validNums.length > 0) {
            var s = '<div style="margin-bottom:15px;padding:12px;background:var(--neutral-tint);border-radius:8px;border-left:4px solid var(--secondary)">';
            s += '<h3 style="margin:0 0 8px 0;color:var(--secondary)">🔢 Decimal → Binary Conversions</h3>';
            s += '<table class="edu-table"><thead><tr><th>Decimal</th><th>Binary</th><th>Hex</th></tr></thead><tbody>';
            for (var j = 0; j < validNums.length; j++) {
                var d = validNums[j];
                var hex = d.toString(16).toUpperCase();
                if (hex.length < 2) hex = '0' + hex;
                s += '<tr><td>' + d + '</td><td style="font-family:monospace">' + decToBinStr(d) + '</td><td>0x' + hex + '</td></tr>';
            }
            s += '</tbody></table></div>';
            sections.push(s);
        }
    }

    /* --- Final output --- */
    if (sections.length === 0) {
        out.innerHTML = '<p style="color:var(--danger);padding:10px">⚠️ No valid networking data detected. Check your inputs and try again.</p>';
    } else {
        out.innerHTML = '<div class="copy-result-wrap"><button class="copy-result-btn" onclick="copyResultText(this)" title="Copy results to clipboard">📋 Copy</button>' +
            '<h3 style="margin:0 0 15px 0;color:var(--text-main)">📊 Analysis Results</h3>' + sections.join('') + '</div>';
    }
}

/* =============================================
   Challenge / Quiz Mode
   ============================================= */
var challengeState = {
    difficulty: 'easy',
    streak: 0,
    _bestStreak: 0,
    correct: 0,
    total: 0,
    currentAnswer: null,
    currentType: null,
    currentCategory: null,
    answered: false,
    timerInterval: null,
    timeRemaining: 30,
    timerEnabled: true,
    hintUsed: false,
    started: false,
    currentIP: null,
    currentCIDR: null,
    allAnswers: null,
    binaryValue: null,
    decimalValue: null,
    binaryDirection: null
};

function setChallengeDifficulty(level, btn) {
    challengeState.difficulty = level;
    var btns = document.querySelectorAll('.challenge-diff-btn');
    for (var i = 0; i < btns.length; i++) {
        btns[i].classList.remove('active');
        btns[i].setAttribute('aria-pressed', 'false');
    }
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
    if (challengeState.started) {
        generateChallenge();
    }
}

function toggleChallengeTimer(enabled) {
    challengeState.timerEnabled = enabled;
    if (!enabled) {
        stopChallengeTimer();
        document.getElementById('challengeTimerWrap').style.display = 'none';
    } else if (challengeState.started && !challengeState.answered) {
        startChallengeTimer();
    }
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/* ---------- Timer ---------- */
function startChallengeTimer() {
    stopChallengeTimer();
    challengeState.timeRemaining = 30;
    var wrap = document.getElementById('challengeTimerWrap');
    var fill = document.getElementById('challengeTimerFill');
    var text = document.getElementById('challengeTimerText');
    wrap.style.display = 'flex';
    fill.style.width = '100%';
    fill.className = 'challenge-timer-fill';
    text.className = 'challenge-timer-text';
    text.textContent = '30s';

    challengeState.timerInterval = setInterval(function() {
        challengeState.timeRemaining--;
        var t = challengeState.timeRemaining;
        text.textContent = t + 's';
        fill.style.width = ((t / 30) * 100) + '%';

        /* Color transitions */
        if (t <= 5) {
            fill.className = 'challenge-timer-fill timer-danger';
            text.className = 'challenge-timer-text timer-danger';
        } else if (t <= 10) {
            fill.className = 'challenge-timer-fill timer-warning';
            text.className = 'challenge-timer-text timer-warning';
        }

        if (t <= 0) {
            challengeTimeout();
        }
    }, 1000);
}

function stopChallengeTimer() {
    if (challengeState.timerInterval) {
        clearInterval(challengeState.timerInterval);
        challengeState.timerInterval = null;
    }
}

function challengeTimeout() {
    stopChallengeTimer();
    if (challengeState.answered) return;
    challengeState.answered = true;

    /* Streak resets, total increments */
    challengeState.streak = 0;
    challengeState.total++;
    updateChallengeScoreDisplay();

    /* Build timeout feedback */
    var fb = document.getElementById('challengeFeedback');
    var correctAns = challengeState.currentAnswer;
    var html = '<div class="challenge-feedback challenge-feedback--incorrect">';
    html += '<p style="font-size:1.15rem;font-weight:700;margin-bottom:0.75rem">\u23f0 Time\'s Up!</p>';
    html += '<p>The correct answer was: <strong>' + correctAns + '</strong></p>';
    html += buildAnswerBreakdown();
    html += '<button class="btn-next" onclick="generateChallenge()">Next Question \u2192</button>';
    html += '</div>';
    fb.innerHTML = html;

    /* Disable input */
    document.getElementById('challengeAnswer').disabled = true;
    document.getElementById('challengeHintBtn').disabled = true;
    document.getElementById('challengeSkipBtn').disabled = true;
}

function updateChallengeScoreDisplay() {
    if (challengeState.streak > challengeState._bestStreak) {
        challengeState._bestStreak = challengeState.streak;
    }
    document.getElementById('challengeStreak').textContent = challengeState.streak;
    document.getElementById('challengeCorrect').textContent = challengeState.correct;
    document.getElementById('challengeTotal').textContent = challengeState.total;
    /* Auto-save session after every 5 questions */
    if (challengeState.total > 0 && challengeState.total % 5 === 0) {
        saveChallengeSession();
    }
}

/* ---------- Skip Question ---------- */
function skipChallengeQuestion() {
    if (!challengeState.currentAnswer || challengeState.answered) return;
    stopChallengeTimer();
    challengeState.answered = true;

    /* Streak resets, total increments */
    challengeState.streak = 0;
    challengeState.total++;
    updateChallengeScoreDisplay();

    /* Build skip feedback */
    var fb = document.getElementById('challengeFeedback');
    var correctAns = challengeState.currentAnswer;
    var html = '<div class="challenge-feedback challenge-feedback--skipped">';
    html += '<p style="font-size:1.15rem;font-weight:700;margin-bottom:0.75rem">\u23ed Skipped</p>';
    html += '<p>The correct answer was: <strong>' + correctAns + '</strong></p>';
    html += buildAnswerBreakdown();
    html += '<button class="btn-next" onclick="generateChallenge()">Next Question \u2192</button>';
    html += '</div>';
    fb.innerHTML = html;

    /* Disable input */
    document.getElementById('challengeAnswer').disabled = true;
    document.getElementById('challengeHintBtn').disabled = true;
    document.getElementById('challengeSkipBtn').disabled = true;
}

/* ---------- Extend Timer ---------- */
function extendChallengeTimer() {
    if (!challengeState.timerEnabled || challengeState.answered) return;
    challengeState.timeRemaining += 15;
    var t = challengeState.timeRemaining;
    var text = document.getElementById('challengeTimerText');
    var fill = document.getElementById('challengeTimerFill');
    text.textContent = t + 's';
    /* Recalculate fill width — cap at 100% */
    var pct = Math.min((t / 30) * 100, 100);
    fill.style.width = pct + '%';
    /* Reset color classes if we're back above thresholds */
    if (t > 10) {
        fill.className = 'challenge-timer-fill';
        text.className = 'challenge-timer-text';
    } else if (t > 5) {
        fill.className = 'challenge-timer-fill timer-warning';
        text.className = 'challenge-timer-text timer-warning';
    }
}

/* ---------- Hint System ---------- */
function showChallengeHint() {
    if (challengeState.answered || !challengeState.currentAnswer) return;
    challengeState.hintUsed = true;

    var hintEl = document.getElementById('challengeHint');
    var hintBtn = document.getElementById('challengeHintBtn');
    var hint = '';

    var cat = challengeState.currentCategory;
    var cidr = challengeState.currentCIDR;

    if (cat === 'binaryConversion') {
        if (challengeState.binaryDirection === 'binToDec') {
            hint = '\ud83d\udca1 <strong>Place values (left to right):</strong> 128 \u2502 64 \u2502 32 \u2502 16 \u2502 8 \u2502 4 \u2502 2 \u2502 1<br>Add together only the values where the bit is <strong>1</strong>.';
        } else {
            hint = '\ud83d\udca1 <strong>Subtract the largest power of 2 that fits,</strong> then repeat.<br>Powers: 128, 64, 32, 16, 8, 4, 2, 1. Mark each used power as <strong>1</strong>, unused as <strong>0</strong>.';
        }
    } else if (cat === 'networkAddress') {
        var magicOctet = getMagicOctetInfo(cidr);
        hint = '\ud83d\udca1 <strong>AND</strong> each IP octet with the corresponding mask octet.<br>';
        hint += 'For <strong>/' + cidr + '</strong>, the magic number (increment) is <strong>' + magicOctet.increment + '</strong> in the <strong>' + magicOctet.octetName + '</strong> octet.<br>';
        hint += 'Find the largest multiple of ' + magicOctet.increment + ' that is \u2264 the IP\u2019s octet value.';
    } else if (cat === 'broadcastAddress') {
        var magicOctet = getMagicOctetInfo(cidr);
        hint = '\ud83d\udca1 Start from the <strong>Network Address</strong> and set all host bits to <strong>1</strong>.<br>';
        hint += 'The broadcast is the <strong>last address</strong> in a block of <strong>' + magicOctet.increment + '</strong> (Network Address + ' + (magicOctet.increment - 1) + ' in the ' + magicOctet.octetName + ' octet).';
    } else if (cat === 'usableHostRange') {
        hint = '\ud83d\udca1 <strong>First usable</strong> = Network Address + 1<br>';
        hint += '<strong>Last usable</strong> = Broadcast Address \u2212 1<br>';
        if (cidr) {
            var magicOctet = getMagicOctetInfo(cidr);
            hint += 'For <strong>/' + cidr + '</strong>, the magic number is <strong>' + magicOctet.increment + '</strong> in the <strong>' + magicOctet.octetName + '</strong> octet.';
        }
    } else if (cat === 'maskConversion') {
        var bitsInOctet = cidr % 8;
        var fullOctets = Math.floor(cidr / 8);
        var octetNames = ['1st', '2nd', '3rd', '4th'];
        var significantOctet = fullOctets < 4 ? octetNames[fullOctets] : '4th';
        var maskVal = bitsInOctet === 0 ? (fullOctets === 4 ? 255 : 0) : (256 - Math.pow(2, 8 - bitsInOctet));
        hint = '\ud83d\udca1 A <strong>/' + cidr + '</strong> mask has <strong>' + cidr + '</strong> consecutive 1-bits.<br>';
        hint += 'That\u2019s <strong>' + fullOctets + '</strong> full octets (255) + <strong>' + bitsInOctet + '</strong> bits in the <strong>' + significantOctet + '</strong> octet.<br>';
        if (bitsInOctet > 0) {
            hint += 'Mask value for that octet: 256 \u2212 2<sup>' + (8 - bitsInOctet) + '</sup> = 256 \u2212 ' + Math.pow(2, 8 - bitsInOctet) + ' = <strong>' + maskVal + '</strong>. Magic number: <strong>' + Math.pow(2, 8 - bitsInOctet) + '</strong>.';
        }
    }

    hintEl.innerHTML = hint;
    hintEl.style.display = 'block';
    hintBtn.disabled = true;
}

function getMagicOctetInfo(cidr) {
    var octetNames = ['1st', '2nd', '3rd', '4th'];
    var octetIndex = Math.floor(cidr / 8);
    if (octetIndex > 3) octetIndex = 3;
    var bitsInOctet = cidr - (octetIndex * 8);
    var increment = Math.pow(2, 8 - bitsInOctet);
    if (bitsInOctet === 0 && octetIndex > 0) {
        /* /8, /16, /24 — the "interesting" octet is actually the one we stepped into */
        increment = 256;
    }
    return {
        octetName: octetNames[octetIndex],
        increment: increment,
        octetIndex: octetIndex
    };
}

/* ---------- Answer Breakdown Table ---------- */
function buildAnswerBreakdown() {
    var cat = challengeState.currentCategory;
    if (cat === 'binaryConversion') {
        var html = '<table class="edu-table" style="margin-top:10px"><tbody>';
        html += '<tr><td><strong>Binary</strong></td><td>' + challengeState.binaryValue + '</td></tr>';
        html += '<tr><td><strong>Decimal</strong></td><td>' + challengeState.decimalValue + '</td></tr>';
        html += '</tbody></table>';
        return html;
    }
    if (cat === 'maskConversion') {
        var html = '<table class="edu-table" style="margin-top:10px"><tbody>';
        html += '<tr><td><strong>CIDR</strong></td><td>/' + challengeState.currentCIDR + '</td></tr>';
        html += '<tr><td><strong>Dotted Decimal Mask</strong></td><td>' + challengeState.currentAnswer + '</td></tr>';
        html += '</tbody></table>';
        return html;
    }
    /* Subnet question — full breakdown */
    var a = challengeState.allAnswers;
    if (!a) return '';
    var html = '<table class="edu-table" style="margin-top:10px"><tbody>';
    html += '<tr><td><strong>Network Address</strong></td><td>' + a.networkAddress + '</td></tr>';
    html += '<tr><td><strong>Broadcast Address</strong></td><td>' + a.broadcastAddress + '</td></tr>';
    html += '<tr><td><strong>First Usable IP</strong></td><td>' + a.firstUsableIP + '</td></tr>';
    html += '<tr><td><strong>Last Usable IP</strong></td><td>' + a.lastUsableIP + '</td></tr>';
    html += '<tr><td><strong>Subnet Mask</strong></td><td>' + a.subnetMask + '</td></tr>';
    html += '</tbody></table>';
    return html;
}

/* ---------- Question Generator ---------- */
function generateChallenge() {
    stopChallengeTimer();
    challengeState.started = true;
    challengeState.answered = false;
    challengeState.hintUsed = false;
    challengeState.binaryValue = null;
    challengeState.decimalValue = null;
    challengeState.binaryDirection = null;
    challengeState.allAnswers = null;

    /* Hide start button, enable inputs */
    document.getElementById('challengeStartWrap').style.display = 'none';
    var input = document.getElementById('challengeAnswer');
    input.disabled = false;
    input.value = '';
    var hintBtn = document.getElementById('challengeHintBtn');
    hintBtn.disabled = false;
    var skipBtn = document.getElementById('challengeSkipBtn');
    skipBtn.disabled = false;
    document.getElementById('challengeHint').style.display = 'none';
    document.getElementById('challengeFeedback').innerHTML = '';

    var difficulty = challengeState.difficulty;
    var category, questionHtml, answer;

    if (difficulty === 'easy') {
        /* 50% binary, 50% subnet /24-/30 */
        if (Math.random() < 0.5) {
            category = 'binaryConversion';
        } else {
            var subnetTypes = ['networkAddress', 'broadcastAddress', 'usableHostRange', 'maskConversion'];
            category = subnetTypes[randomInt(0, subnetTypes.length - 1)];
        }
    } else if (difficulty === 'medium') {
        /* No binary. Subnet /16-/23 with all 5 types */
        var medTypes = ['networkAddress', 'broadcastAddress', 'usableHostRange', 'maskConversion'];
        category = medTypes[randomInt(0, medTypes.length - 1)];
    } else {
        /* Hard: /8-/32 all types including binary */
        var hardTypes = ['binaryConversion', 'networkAddress', 'broadcastAddress', 'usableHostRange', 'maskConversion'];
        category = hardTypes[randomInt(0, hardTypes.length - 1)];
    }

    challengeState.currentCategory = category;

    if (category === 'binaryConversion') {
        generateBinaryQuestion();
    } else if (category === 'maskConversion') {
        generateMaskQuestion(difficulty);
    } else {
        generateSubnetQuestion(category, difficulty);
    }

    /* Start timer (if enabled) */
    if (challengeState.timerEnabled) {
        startChallengeTimer();
    } else {
        document.getElementById('challengeTimerWrap').style.display = 'none';
    }
    input.focus();
}

function generateBinaryQuestion() {
    var dec = randomInt(0, 255);
    var bin = decToBinStr(dec);
    challengeState.binaryValue = bin;
    challengeState.decimalValue = String(dec);

    /* Randomly pick direction */
    var direction = Math.random() < 0.5 ? 'binToDec' : 'decToBin';
    challengeState.binaryDirection = direction;

    var area = document.getElementById('challengeQuestionArea');
    var html = '';
    if (direction === 'binToDec') {
        challengeState.currentAnswer = String(dec);
        challengeState.currentType = { key: 'binaryToDec', label: 'Binary \u2192 Decimal' };
        html += '<span class="challenge-question-type">Binary \u2192 Decimal</span>';
        html += '<h3 style="font-family:monospace;letter-spacing:0.15em;margin-top:0.75rem">' + bin + '</h3>';
        html += '<p>Convert this <strong>8-bit binary</strong> number to <strong>decimal</strong>.</p>';
    } else {
        challengeState.currentAnswer = bin;
        challengeState.currentType = { key: 'decToBin', label: 'Decimal \u2192 Binary' };
        html += '<span class="challenge-question-type">Decimal \u2192 Binary</span>';
        html += '<h3>' + dec + '</h3>';
        html += '<p>Convert this decimal to an <strong>8-bit binary</strong> string.</p>';
    }
    area.innerHTML = html;
}

function generateMaskQuestion(difficulty) {
    var cidr;
    if (difficulty === 'easy') { cidr = randomInt(24, 30); }
    else if (difficulty === 'medium') { cidr = randomInt(16, 23); }
    else { cidr = randomInt(8, 32); }

    var mask = cidrToMask(cidr);
    challengeState.currentCIDR = cidr;
    challengeState.currentAnswer = mask;
    challengeState.currentType = { key: 'maskConversion', label: 'Mask Conversion' };

    var area = document.getElementById('challengeQuestionArea');
    var html = '<span class="challenge-question-type">Mask Conversion</span>';
    html += '<h3>/' + cidr + '</h3>';
    html += '<p>Convert this CIDR prefix to a <strong>Dotted Decimal Subnet Mask</strong>.</p>';
    area.innerHTML = html;
}

function generateSubnetQuestion(category, difficulty) {
    var minCIDR, maxCIDR;
    if (difficulty === 'easy')   { minCIDR = 24; maxCIDR = 30; }
    else if (difficulty === 'medium') { minCIDR = 16; maxCIDR = 23; }
    else { minCIDR = 8; maxCIDR = 32; }

    var cidr = randomInt(minCIDR, maxCIDR);
    var ip = randomInt(1, 223) + '.' + randomInt(0, 255) + '.' + randomInt(0, 255) + '.' + randomInt(0, 255);

    /* Compute all answers */
    var ipInt = ipToInt(ip);
    var maskInt = cidr === 0 ? 0 : (0xFFFFFFFF << (32 - cidr)) >>> 0;
    var netInt = (ipInt & maskInt) >>> 0;
    var bcastInt = (netInt | (~maskInt >>> 0)) >>> 0;

    var answers = {};
    answers.networkAddress = intToIp(netInt);
    answers.subnetMask = cidrToMask(cidr);

    if (cidr === 32) {
        answers.broadcastAddress = 'N/A';
        answers.firstUsableIP = intToIp(netInt);
        answers.lastUsableIP = intToIp(netInt);
    } else if (cidr === 31) {
        answers.broadcastAddress = 'N/A';
        answers.firstUsableIP = intToIp(netInt);
        answers.lastUsableIP = intToIp(bcastInt);
    } else {
        answers.broadcastAddress = intToIp(bcastInt);
        answers.firstUsableIP = intToIp(netInt + 1);
        answers.lastUsableIP = intToIp(bcastInt - 1);
    }

    challengeState.currentIP = ip;
    challengeState.currentCIDR = cidr;
    challengeState.allAnswers = answers;

    /* Determine question type based on category */
    var questionLabel, answerKey;
    if (category === 'networkAddress') {
        questionLabel = 'Network Address';
        answerKey = 'networkAddress';
    } else if (category === 'broadcastAddress') {
        /* skip for /31+ */
        if (cidr >= 31) {
            category = 'networkAddress';
            questionLabel = 'Network Address';
            answerKey = 'networkAddress';
        } else {
            questionLabel = 'Broadcast Address';
            answerKey = 'broadcastAddress';
        }
    } else if (category === 'usableHostRange') {
        /* Randomly first or last */
        if (Math.random() < 0.5) {
            questionLabel = 'First Usable Host';
            answerKey = 'firstUsableIP';
        } else {
            questionLabel = 'Last Usable Host';
            answerKey = 'lastUsableIP';
        }
    }

    challengeState.currentAnswer = answers[answerKey];
    challengeState.currentType = { key: answerKey, label: questionLabel };

    /* Render */
    var area = document.getElementById('challengeQuestionArea');
    var html = '<span class="challenge-question-type">' + questionLabel + '</span>';
    html += '<h3>' + ip + ' / ' + cidr + '</h3>';
    html += '<p>What is the <strong>' + questionLabel + '</strong>?</p>';
    area.innerHTML = html;
}

/* ---------- Answer Checker ---------- */
function checkChallengeAnswer() {
    if (!challengeState.currentAnswer || challengeState.answered) return;
    stopChallengeTimer();
    challengeState.answered = true;

    var userAns = (document.getElementById('challengeAnswer').value || '').trim();
    var correctAns = challengeState.currentAnswer;

    /* Normalize: strip leading zeros in each octet, lowercase, trim spaces */
    var normalize = function(val) {
        return val.replace(/\s+/g, '').toLowerCase()
            .replace(/\b0+(\d)/g, '$1');
    };

    var isCorrect = normalize(userAns) === normalize(correctAns);

    /* For binary answers (decToBin), also accept without leading zeros stripped */
    if (!isCorrect && challengeState.currentCategory === 'binaryConversion') {
        if (challengeState.binaryDirection === 'decToBin') {
            /* Must match the full 8-bit string */
            isCorrect = userAns.replace(/\s/g, '') === correctAns;
        }
    }

    /* Update score */
    challengeState.total++;
    if (isCorrect) {
        challengeState.correct++;
        challengeState.streak++;
    } else {
        challengeState.streak = 0;
    }
    updateChallengeScoreDisplay();

    /* Build feedback */
    var fb = document.getElementById('challengeFeedback');
    var cls = isCorrect ? 'challenge-feedback--correct' : 'challenge-feedback--incorrect';
    var icon = isCorrect ? '\u2705' : '\u274c';

    var html = '<div class="challenge-feedback ' + cls + '">';
    html += '<p style="font-size:1.15rem;font-weight:700;margin-bottom:0.75rem">' + icon + ' ' + (isCorrect ? 'Correct!' : 'Incorrect') + '</p>';
    if (!isCorrect) {
        html += '<p>Your answer: <strong>' + (userAns || '<em>empty</em>') + '</strong></p>';
        html += '<p>Correct answer: <strong>' + correctAns + '</strong></p>';
    }
    html += buildAnswerBreakdown();
    html += '<button class="btn-next" onclick="generateChallenge()">Next Question \u2192</button>';
    html += '</div>';
    fb.innerHTML = html;

    /* Disable input + hint + skip */
    document.getElementById('challengeAnswer').disabled = true;
    document.getElementById('challengeHintBtn').disabled = true;
    document.getElementById('challengeSkipBtn').disabled = true;
}

/* =============================================
   Network Diagram Generator
   ============================================= */
function generateDiagram() {
    var baseIP = (document.getElementById('diagramBaseIP').value || '').trim();
    var baseCIDR = clampInt(document.getElementById('diagramCIDR').value, 0, 32);
    var count = clampInt(document.getElementById('diagramCount').value, 2, 256);
    var outEl = document.getElementById('diagramOutput');
    var infoEl = document.getElementById('diagramInfo');

    if (!validateIP(baseIP)) {
        outEl.innerHTML = '<div class="card" style="text-align:center;color:var(--danger)"><p>⚠️ Enter a valid base network IP address.</p></div>';
        infoEl.innerHTML = '';
        return;
    }
    if (isNaN(baseCIDR) || baseCIDR < 0 || baseCIDR > 32) {
        outEl.innerHTML = '<div class="card" style="text-align:center;color:var(--danger)"><p>⚠️ Enter a valid CIDR prefix (0–32).</p></div>';
        infoEl.innerHTML = '';
        return;
    }
    if (isNaN(count) || count < 2) {
        outEl.innerHTML = '<div class="card" style="text-align:center;color:var(--danger)"><p>⚠️ Enter at least 2 subnets.</p></div>';
        infoEl.innerHTML = '';
        return;
    }

    var bitsNeeded = Math.ceil(Math.log(count) / Math.log(2));
    var newCIDR = baseCIDR + bitsNeeded;
    if (newCIDR > 30) {
        outEl.innerHTML = '<div class="card" style="text-align:center;color:var(--danger)"><p>⚠️ Cannot create ' + count + ' subnets from /' + baseCIDR + '. Not enough host bits.</p></div>';
        infoEl.innerHTML = '';
        return;
    }

    var actualCount = Math.pow(2, bitsNeeded);
    var blockSize = Math.pow(2, 32 - newCIDR);
    var usablePerSubnet = blockSize - 2;
    var baseInt = ipToInt(baseIP);
    var parentMaskInt = baseCIDR === 0 ? 0 : (0xFFFFFFFF << (32 - baseCIDR)) >>> 0;
    baseInt = (baseInt & parentMaskInt) >>> 0;
    var mask = cidrToMask(newCIDR);

    var subnets = [];
    for (var i = 0; i < actualCount; i++) {
        var netAddr = (baseInt + i * blockSize) >>> 0;
        var bcastAddr = (netAddr + blockSize - 1) >>> 0;
        subnets.push({
            index: i,
            network: intToIp(netAddr),
            broadcast: intToIp(bcastAddr),
            firstUsable: intToIp(netAddr + 1),
            lastUsable: intToIp(bcastAddr - 1),
            gateway: intToIp(netAddr + 1),
            hosts: usablePerSubnet,
            cidr: newCIDR,
            color: getSubnetBarColor(i)
        });
    }

    outEl.innerHTML = '<div class="diagram-container">' + buildDiagramSVG(subnets, intToIp(baseInt), baseCIDR) + '</div>';
    infoEl.innerHTML = buildDiagramInfoTable(subnets, baseCIDR, newCIDR, mask);
}

function buildDiagramSVG(subnets, baseNetwork, baseCIDR) {
    var count = subnets.length;
    /* Dynamic sizing */
    var svgSize = 800;
    var cx = svgSize / 2;
    var cy = svgSize / 2;
    var routerRadius = 45;

    /* Detail level */
    var detail; /* 'full', 'medium', 'simple', 'compact' */
    if (count <= 4) { detail = 'full'; }
    else if (count <= 8) { detail = 'medium'; }
    else if (count <= 16) { detail = 'simple'; }
    else { detail = 'compact'; }

    /* Orbit radius and node sizing based on detail */
    var orbitR, nodeW, nodeH, fontSize;
    if (detail === 'full') {
        orbitR = 300; nodeW = 200; nodeH = 155; fontSize = 11;
    } else if (detail === 'medium') {
        orbitR = 310; nodeW = 175; nodeH = 130; fontSize = 10;
    } else if (detail === 'simple') {
        orbitR = 320; nodeW = 150; nodeH = 90; fontSize = 9;
    } else {
        orbitR = 330; nodeW = 130; nodeH = 60; fontSize = 8;
    }

    /* For many subnets, increase SVG size */
    if (count > 12) { svgSize = 900; cx = 450; cy = 450; orbitR = 370; }
    if (count > 20) { svgSize = 1000; cx = 500; cy = 500; orbitR = 420; }

    var svg = '<svg class="diagram-svg" viewBox="0 0 ' + svgSize + ' ' + svgSize + '" xmlns="http://www.w3.org/2000/svg" font-family="Inter, sans-serif">';

    /* Defs for drop shadow */
    svg += '<defs>';
    svg += '<filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">';
    svg += '<feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.1"/>';
    svg += '</filter>';
    svg += '</defs>';

    /* Connection lines (drawn first so they're behind nodes) */
    for (var i = 0; i < count; i++) {
        var angle = (i / count) * 2 * Math.PI - Math.PI / 2;
        var nx = cx + orbitR * Math.cos(angle);
        var ny = cy + orbitR * Math.sin(angle);
        /* Gateway label position (midpoint of line) */
        var mx = cx + (orbitR * 0.52) * Math.cos(angle);
        var my = cy + (orbitR * 0.52) * Math.sin(angle);

        svg += '<line x1="' + cx + '" y1="' + cy + '" x2="' + nx + '" y2="' + ny + '" stroke="' + subnets[i].color + '" stroke-width="2" stroke-opacity="0.45"/>';

        /* Gateway label on line */
        if (detail !== 'compact') {
            svg += '<rect x="' + (mx - 38) + '" y="' + (my - 8) + '" width="76" height="16" rx="4" fill="' + getCSSVar('--surface') + '" fill-opacity="0.9" stroke="' + subnets[i].color + '" stroke-width="0.5"/>';
            svg += '<text x="' + mx + '" y="' + (my + 4) + '" text-anchor="middle" font-size="7.5" fill="' + subnets[i].color + '" font-weight="600">' + subnets[i].gateway + '</text>';
        }
    }

    /* Central Router */
    svg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + routerRadius + '" fill="#4f46e5" filter="url(#shadow)"/>';
    svg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (routerRadius - 3) + '" fill="none" stroke="#fff" stroke-width="1.5" stroke-opacity="0.3"/>';
    /* Router icon — simple crosshair/arrows */
    svg += '<g transform="translate(' + cx + ',' + (cy - 6) + ')" fill="#fff">';
    svg += '<rect x="-12" y="-3" width="24" height="6" rx="1.5"/>';
    svg += '<rect x="-3" y="-12" width="6" height="24" rx="1.5"/>';
    svg += '<circle cx="-12" cy="0" r="3" fill="none" stroke="#fff" stroke-width="1.5"/>';
    svg += '<circle cx="12" cy="0" r="3" fill="none" stroke="#fff" stroke-width="1.5"/>';
    svg += '<circle cx="0" cy="-12" r="3" fill="none" stroke="#fff" stroke-width="1.5"/>';
    svg += '<circle cx="0" cy="12" r="3" fill="none" stroke="#fff" stroke-width="1.5"/>';
    svg += '</g>';
    /* Router label */
    svg += '<text x="' + cx + '" y="' + (cy + routerRadius + 16) + '" text-anchor="middle" font-size="12" font-weight="700" fill="' + getCSSVar('--primary') + '">' + baseNetwork + '/' + baseCIDR + '</text>';
    svg += '<text x="' + cx + '" y="' + (cy + routerRadius + 30) + '" text-anchor="middle" font-size="9" fill="' + getCSSVar('--text-muted') + '">Router / Gateway</text>';

    /* Subnet nodes */
    for (var i = 0; i < count; i++) {
        var s = subnets[i];
        var angle = (i / count) * 2 * Math.PI - Math.PI / 2;
        var nx = cx + orbitR * Math.cos(angle);
        var ny = cy + orbitR * Math.sin(angle);
        var x = nx - nodeW / 2;
        var y = ny - nodeH / 2;

        svg += buildSubnetNode(s, x, y, nodeW, nodeH, fontSize, detail);
    }

    svg += '</svg>';
    return svg;
}

function buildSubnetNode(s, x, y, w, h, fontSize, detail) {
    var svg = '';
    var color = s.color;
    var headerH = 22;

    /* Node card background */
    svg += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="8" fill="' + getCSSVar('--surface') + '" stroke="' + color + '" stroke-width="2" filter="url(#shadow)"/>';
    /* Header bar */
    svg += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + headerH + '" rx="8" fill="' + color + '"/>';
    svg += '<rect x="' + x + '" y="' + (y + headerH - 8) + '" width="' + w + '" height="8" fill="' + color + '"/>';
    /* Header text */
    svg += '<text x="' + (x + w / 2) + '" y="' + (y + 15) + '" text-anchor="middle" font-size="' + (fontSize + 1) + '" font-weight="700" fill="#fff">Subnet ' + (s.index + 1) + '</text>';

    var ty = y + headerH + 14;
    var lineH = fontSize + 5;

    if (detail === 'compact') {
        /* Just network/CIDR and host count */
        svg += '<text x="' + (x + w / 2) + '" y="' + ty + '" text-anchor="middle" font-size="' + fontSize + '" font-weight="600" fill="#111827">' + s.network + '/' + s.cidr + '</text>';
        ty += lineH;
        svg += '<text x="' + (x + w / 2) + '" y="' + ty + '" text-anchor="middle" font-size="' + (fontSize - 1) + '" fill="#6b7280">' + s.hosts + ' hosts</text>';
    } else if (detail === 'simple') {
        /* Network, range, hosts */
        svg += '<text x="' + (x + w / 2) + '" y="' + ty + '" text-anchor="middle" font-size="' + fontSize + '" font-weight="600" fill="#111827">' + s.network + '/' + s.cidr + '</text>';
        ty += lineH;
        svg += '<text x="' + (x + w / 2) + '" y="' + ty + '" text-anchor="middle" font-size="' + (fontSize - 1) + '" fill="#6b7280">Range: ' + s.firstUsable + ' – ' + s.lastUsable + '</text>';
        ty += lineH;
        svg += '<text x="' + (x + w / 2) + '" y="' + ty + '" text-anchor="middle" font-size="' + (fontSize - 1) + '" fill="#6b7280">Broadcast: ' + s.broadcast + '</text>';
        ty += lineH;
        svg += '<text x="' + (x + w / 2) + '" y="' + ty + '" text-anchor="middle" font-size="' + (fontSize - 1) + '" fill="#6b7280">' + s.hosts + ' usable hosts</text>';
    } else {
        /* Medium / Full — show all details + device icons */
        svg += '<text x="' + (x + w / 2) + '" y="' + ty + '" text-anchor="middle" font-size="' + fontSize + '" font-weight="600" fill="#111827">' + s.network + '/' + s.cidr + '</text>';
        ty += lineH;
        svg += '<text x="' + (x + w / 2) + '" y="' + ty + '" text-anchor="middle" font-size="' + (fontSize - 1) + '" fill="#6b7280">GW: ' + s.gateway + '</text>';
        ty += lineH;
        svg += '<text x="' + (x + w / 2) + '" y="' + ty + '" text-anchor="middle" font-size="' + (fontSize - 1) + '" fill="#6b7280">' + s.firstUsable + ' – ' + s.lastUsable + '</text>';
        ty += lineH;
        svg += '<text x="' + (x + w / 2) + '" y="' + ty + '" text-anchor="middle" font-size="' + (fontSize - 1) + '" fill="#6b7280">Bcast: ' + s.broadcast + ' | ' + s.hosts + ' hosts</text>';
        ty += lineH + 2;

        /* Switch icon */
        var swX = x + w / 2 - 18;
        var swY = ty;
        svg += '<rect x="' + swX + '" y="' + swY + '" width="36" height="14" rx="3" fill="' + color + '" fill-opacity="0.15" stroke="' + color + '" stroke-width="1"/>';
        svg += '<text x="' + (swX + 18) + '" y="' + (swY + 10) + '" text-anchor="middle" font-size="7" font-weight="600" fill="' + color + '">Switch</text>';
        ty = swY + 18;

        /* Host icons */
        var hostCount = detail === 'full' ? 3 : 1;
        var hostW = 30;
        var totalHostsW = hostCount * hostW + (hostCount - 1) * 6;
        var hostStartX = x + w / 2 - totalHostsW / 2;

        for (var h = 0; h < hostCount; h++) {
            var hx = hostStartX + h * (hostW + 6);
            var hy = ty + 4;
            /* Line from switch to host */
            svg += '<line x1="' + (hx + hostW / 2) + '" y1="' + (swY + 14) + '" x2="' + (hx + hostW / 2) + '" y2="' + hy + '" stroke="' + color + '" stroke-width="1" stroke-opacity="0.4"/>';
            /* Host box */
            svg += '<rect x="' + hx + '" y="' + hy + '" width="' + hostW + '" height="16" rx="3" fill="' + getCSSVar('--neutral-tint') + '" stroke="' + getCSSVar('--border') + '" stroke-width="0.75"/>';
            /* Screen line */
            svg += '<rect x="' + (hx + 3) + '" y="' + (hy + 2) + '" width="' + (hostW - 6) + '" height="8" rx="1" fill="' + color + '" fill-opacity="0.2"/>';
            svg += '<text x="' + (hx + hostW / 2) + '" y="' + (hy + 7.5) + '" text-anchor="middle" font-size="5" fill="' + color + '" font-weight="600">PC' + (h + 1) + '</text>';
        }
    }

    return svg;
}

function buildDiagramInfoTable(subnets, baseCIDR, newCIDR, mask) {
    var html = '<div class="diagram-info-card">';
    html += '<h3 style="margin:0 0 0.5rem 0">📋 Subnet Summary</h3>';
    html += '<p style="color:var(--text-muted);margin-bottom:1rem;font-size:0.9rem">Parent /' + baseCIDR + ' divided into <strong>' + subnets.length + '</strong> subnets → /' + newCIDR + ' (Mask: ' + mask + ') — <strong>' + subnets[0].hosts + '</strong> usable hosts each</p>';
    html += '<table class="edu-table"><thead><tr>';
    html += '<th>#</th><th>Network</th><th>Gateway</th><th>Usable Range</th><th>Broadcast</th><th>Hosts</th>';
    html += '</tr></thead><tbody>';

    for (var i = 0; i < subnets.length; i++) {
        var s = subnets[i];
        html += '<tr>';
        html += '<td><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:' + s.color + ';margin-right:6px;vertical-align:middle"></span>' + (i + 1) + '</td>';
        html += '<td>' + s.network + '/' + s.cidr + '</td>';
        html += '<td>' + s.gateway + '</td>';
        html += '<td>' + s.firstUsable + ' – ' + s.lastUsable + '</td>';
        html += '<td>' + s.broadcast + '</td>';
        html += '<td>' + s.hosts + '</td>';
        html += '</tr>';
    }

    html += '</tbody></table></div>';
    return html;
}

/* =============================================
   Theme Toggle (Dark Mode)
   ============================================= */
function toggleTheme() {
    var html = document.documentElement;
    var current = html.getAttribute('data-theme');
    var next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateThemeIcon(next);
}

function updateThemeIcon(theme) {
    var btn = document.getElementById('themeToggle');
    if (btn) {
        btn.textContent = theme === 'dark' ? '\uD83C\uDF19' : '\u2600\uFE0F';
        btn.title = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    }
}

function applyStoredTheme() {
    var stored = localStorage.getItem('theme');
    if (!stored) {
        /* Check system preference */
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            stored = 'dark';
        } else {
            stored = 'light';
        }
    }
    document.documentElement.setAttribute('data-theme', stored);
    updateThemeIcon(stored);
}

/* Helper: read a CSS custom property value from the document root */
function getCSSVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/* =============================================
   Accessibility — Keyboard Navigation
   ============================================= */
document.addEventListener('DOMContentLoaded', function() {
    applyStoredTheme();
    updateBlockDivider();

    /* --- Menu keyboard handling --- */
    var menuBtn = document.querySelector('.menu-btn');
    var menuDropdown = document.getElementById('mainMenu');
    if (menuBtn && menuDropdown) {
        menuBtn.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                e.preventDefault();
                toggleMenu();
                if (menuDropdown.classList.contains('show')) {
                    var firstItem = menuDropdown.querySelector('.menu-item');
                    if (firstItem) firstItem.focus();
                }
            }
        });

        menuDropdown.addEventListener('keydown', function(e) {
            var items = menuDropdown.querySelectorAll('.menu-item');
            var current = document.activeElement;
            var idx = -1;
            for (var i = 0; i < items.length; i++) {
                if (items[i] === current) { idx = i; break; }
            }

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    if (idx < items.length - 1) items[idx + 1].focus();
                    else items[0].focus();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    if (idx > 0) items[idx - 1].focus();
                    else items[items.length - 1].focus();
                    break;
                case 'Escape':
                    e.preventDefault();
                    menuDropdown.classList.remove('show');
                    menuBtn.setAttribute('aria-expanded', 'false');
                    menuBtn.focus();
                    break;
                case 'Home':
                    e.preventDefault();
                    items[0].focus();
                    break;
                case 'End':
                    e.preventDefault();
                    items[items.length - 1].focus();
                    break;
            }
        });

        /* Close menu on outside click */
        document.addEventListener('click', function(e) {
            if (!menuBtn.contains(e.target) && !menuDropdown.contains(e.target)) {
                menuDropdown.classList.remove('show');
                menuBtn.setAttribute('aria-expanded', 'false');
            }
        });
    }

    /* --- Popup tooltips for Subnet-in-Context bar segments --- */
    var popup = null;

    function createPopup() {
        if (popup) return popup;
        popup = document.createElement('div');
        popup.className = 'ctx-popup';
        popup.innerHTML = '<div class="ctx-popup-title"></div><div class="ctx-popup-body"></div><div class="ctx-popup-arrow"></div>';
        document.body.appendChild(popup);
        return popup;
    }

    function showSegmentPopup(seg) {
        var p = createPopup();
        var title = seg.getAttribute('data-pop-title') || '';
        var line1 = seg.getAttribute('data-pop-line1') || '';
        var line2 = seg.getAttribute('data-pop-line2') || '';
        var line3 = seg.getAttribute('data-pop-line3') || '';
        p.querySelector('.ctx-popup-title').textContent = title;
        var bodyHtml = '';
        if (line1) bodyHtml += '<div class="ctx-popup-line">' + line1 + '</div>';
        if (line2) bodyHtml += '<div class="ctx-popup-line">' + line2 + '</div>';
        if (line3) bodyHtml += '<div class="ctx-popup-line">' + line3 + '</div>';
        p.querySelector('.ctx-popup-body').innerHTML = bodyHtml;

        /* Position: above the segment, centered */
        var rect = seg.getBoundingClientRect();
        p.style.display = 'block';
        p.style.position = 'fixed';
        p.style.opacity = '0';
        /* Temporarily show to measure */
        p.classList.add('show');
        var pw = p.offsetWidth;
        var ph = p.offsetHeight;
        var left = rect.left + rect.width / 2 - pw / 2;
        var top = rect.top - ph - 10;
        /* Clamp horizontally */
        if (left < 8) left = 8;
        if (left + pw > window.innerWidth - 8) left = window.innerWidth - 8 - pw;
        /* If no room above, show below */
        if (top < 8) top = rect.bottom + 10;
        p.style.left = left + 'px';
        p.style.top = top + 'px';
        p.style.bottom = 'auto';
        p.style.transform = 'none';
        p.style.opacity = '';
    }

    function hidePopup() {
        if (popup) {
            popup.classList.remove('show');
        }
    }

    document.addEventListener('mouseover', function(e) {
        var seg = e.target.closest('[data-pop-title]');
        if (seg) {
            showSegmentPopup(seg);
        } else {
            hidePopup();
        }
    });

    document.addEventListener('mouseout', function(e) {
        var seg = e.target.closest('[data-pop-title]');
        if (seg) {
            var related = e.relatedTarget;
            if (!seg.contains(related)) {
                hidePopup();
            }
        }
    });

    /* --- Load challenge history on init --- */
    loadChallengeHistory();
});

/* =============================================
   VLSM Calculator
   ============================================= */
function addVlsmRow() {
    var list = document.getElementById('vlsmSubnetList');
    var rows = list.querySelectorAll('.vlsm-row');
    if (rows.length >= 20) return;
    var idx = rows.length;
    var div = document.createElement('div');
    div.className = 'vlsm-row';
    div.setAttribute('data-vlsm-index', idx);
    div.innerHTML = '<input type="text" class="vlsm-name" placeholder="Subnet name" maxlength="30" aria-label="Subnet name">' +
        '<input type="text" class="vlsm-hosts" placeholder="Hosts needed" inputmode="numeric" maxlength="6" aria-label="Hosts needed">' +
        '<button class="vlsm-remove-btn" onclick="removeVlsmRow(this)" title="Remove this subnet" aria-label="Remove subnet">&times;</button>';
    list.appendChild(div);
}

function removeVlsmRow(btn) {
    var list = document.getElementById('vlsmSubnetList');
    var rows = list.querySelectorAll('.vlsm-row');
    if (rows.length <= 1) return;
    btn.closest('.vlsm-row').remove();
}

function calculateVLSM() {
    var baseIP = (document.getElementById('vlsmBaseIP').value || '').trim();
    var baseCIDR = clampInt(document.getElementById('vlsmBaseCIDR').value, 0, 32);
    var out = document.getElementById('vlsmResults');
    if (!out) return;

    if (!validateIP(baseIP)) {
        out.innerHTML = '<p style="color:var(--danger)">⚠️ Enter a valid base network IP address</p>';
        return;
    }

    /* Collect subnet requirements */
    var rows = document.querySelectorAll('#vlsmSubnetList .vlsm-row');
    var reqs = [];
    for (var i = 0; i < rows.length; i++) {
        var name = rows[i].querySelector('.vlsm-name').value.trim() || ('Subnet ' + (i + 1));
        var hosts = parseInt(rows[i].querySelector('.vlsm-hosts').value, 10);
        if (isNaN(hosts) || hosts < 1) {
            out.innerHTML = '<p style="color:var(--danger)">⚠️ Enter a valid host count for each subnet (minimum 1)</p>';
            return;
        }
        /* Calculate required host bits */
        var hostBits = 1;
        while (Math.pow(2, hostBits) - 2 < hosts) {
            hostBits++;
            if (hostBits > 30) break;
        }
        var cidr = 32 - hostBits;
        reqs.push({
            name: name,
            hostsNeeded: hosts,
            hostBits: hostBits,
            cidr: cidr,
            blockSize: Math.pow(2, hostBits),
            usableHosts: Math.pow(2, hostBits) - 2,
            originalIndex: i
        });
    }

    /* Sort by block size descending (largest first) */
    reqs.sort(function(a, b) { return b.blockSize - a.blockSize; });

    /* Allocate subnets sequentially */
    var baseInt = ipToInt(baseIP);
    var baseMask = baseCIDR === 0 ? 0 : (0xFFFFFFFF << (32 - baseCIDR)) >>> 0;
    baseInt = (baseInt & baseMask) >>> 0;
    var parentEnd = (baseInt + Math.pow(2, 32 - baseCIDR) - 1) >>> 0;
    var totalSpace = Math.pow(2, 32 - baseCIDR);
    var currentAddr = baseInt;
    var allocations = [];
    var totalAllocated = 0;
    var overflow = false;
    var failedReq = null;

    for (var j = 0; j < reqs.length; j++) {
        var r = reqs[j];
        /* Align to block size boundary */
        var remainder = currentAddr % r.blockSize;
        if (remainder !== 0) {
            currentAddr = currentAddr + (r.blockSize - remainder);
        }
        var netAddr = currentAddr >>> 0;
        var bcast = (netAddr + r.blockSize - 1) >>> 0;
        if (bcast > parentEnd) {
            overflow = true;
            failedReq = r;
            break;
        }
        allocations.push({
            name: r.name,
            network: intToIp(netAddr),
            cidr: r.cidr,
            mask: cidrToMask(r.cidr),
            firstUsable: intToIp(netAddr + 1),
            lastUsable: intToIp(bcast - 1),
            broadcast: intToIp(bcast),
            blockSize: r.blockSize,
            usableHosts: r.usableHosts,
            hostsNeeded: r.hostsNeeded,
            wasted: r.usableHosts - r.hostsNeeded
        });
        totalAllocated += r.blockSize;
        currentAddr = bcast + 1;
    }

    if (overflow) {
        out.innerHTML = '<div style="padding:12px;background:var(--danger-tint);border-radius:8px;border-left:4px solid var(--danger)">' +
            '<p style="color:var(--danger-tint-text)">❌ Not enough address space in /' + baseCIDR + ' to fit all subnets. ' +
            'Failed at subnet "' + failedReq.name + '" (' + failedReq.hostsNeeded + ' hosts). ' +
            'Try a larger base network (smaller CIDR) or reduce host requirements.</p></div>';
        return;
    }

    /* Build results */
    var wastedTotal = allocations.reduce(function(sum, a) { return sum + a.wasted; }, 0);
    var unusedIPs = totalSpace - totalAllocated;
    var efficiency = ((totalAllocated / totalSpace) * 100).toFixed(1);

    var html = '<div class="copy-result-wrap"><button class="copy-result-btn" onclick="copyResultText(this)" title="Copy results to clipboard">📋 Copy</button>';
    html += '<h3 style="margin:0 0 12px 0;color:var(--text-main)">📐 VLSM Allocation Results</h3>';

    /* Stats bar */
    html += '<div class="divider-stats-grid" style="margin-bottom:1rem">';
    html += '<div class="divider-stat"><span class="divider-stat-val">' + allocations.length + '</span><span class="divider-stat-lbl">Subnets</span></div>';
    html += '<div class="divider-stat"><span class="divider-stat-val">' + totalAllocated.toLocaleString() + '</span><span class="divider-stat-lbl">IPs Allocated</span></div>';
    html += '<div class="divider-stat"><span class="divider-stat-val">' + unusedIPs.toLocaleString() + '</span><span class="divider-stat-lbl">IPs Remaining</span></div>';
    html += '<div class="divider-stat"><span class="divider-stat-val">' + efficiency + '%</span><span class="divider-stat-lbl">Efficiency</span></div>';
    html += '</div>';

    /* Visual allocation bar */
    html += '<div class="subnet-bar-container" style="margin-bottom:1.25rem">';
    for (var k = 0; k < allocations.length; k++) {
        var pct = (allocations[k].blockSize / totalSpace * 100);
        var tip = allocations[k].name + ': ' + allocations[k].network + '/' + allocations[k].cidr;
        html += '<div class="subnet-segment" style="flex:' + Math.max(pct, 2).toFixed(2) + ';background:' + getSubnetBarColor(k) + '" data-tooltip="' + tip + '">';
        html += '<span>' + allocations[k].name + '</span>';
        html += '<span class="subnet-segment-label">/' + allocations[k].cidr + '</span>';
        html += '</div>';
    }
    if (unusedIPs > 0) {
        var unusedPct = (unusedIPs / totalSpace * 100);
        html += '<div class="subnet-segment" style="flex:' + Math.max(unusedPct, 2).toFixed(2) + ';background:#94a3b8;opacity:0.5">';
        html += '<span>Free</span>';
        html += '<span class="subnet-segment-label">' + unusedIPs.toLocaleString() + ' IPs</span>';
        html += '</div>';
    }
    html += '</div>';

    /* Allocation table */
    html += '<table class="edu-table"><thead><tr>';
    html += '<th>#</th><th>Name</th><th>Network</th><th>Mask</th><th>Range</th><th>Broadcast</th><th>Needed</th><th>Usable</th><th>Wasted</th>';
    html += '</tr></thead><tbody>';

    for (var m = 0; m < allocations.length; m++) {
        var a = allocations[m];
        html += '<tr style="background:' + getSubnetColor(m) + '">';
        html += '<td>' + (m + 1) + '</td>';
        html += '<td><strong>' + a.name + '</strong></td>';
        html += '<td>' + a.network + '/' + a.cidr + '</td>';
        html += '<td>' + a.mask + '</td>';
        html += '<td>' + a.firstUsable + ' – ' + a.lastUsable + '</td>';
        html += '<td>' + a.broadcast + '</td>';
        html += '<td>' + a.hostsNeeded + '</td>';
        html += '<td>' + a.usableHosts + '</td>';
        html += '<td>' + a.wasted + '</td>';
        html += '</tr>';
    }
    html += '</tbody></table>';

    if (unusedIPs > 0) {
        html += '<div class="note-box" style="margin-top:12px"><p><strong>💡 Remaining space:</strong> ' + intToIp(currentAddr >>> 0) + ' – ' + intToIp(parentEnd) + ' (' + unusedIPs.toLocaleString() + ' IPs available for future use)</p></div>';
    }

    html += '</div>';
    out.innerHTML = html;
}

/* =============================================
   Subnet Overlap Checker
   ============================================= */
function addOverlapRow() {
    var list = document.getElementById('overlapInputList');
    var rows = list.querySelectorAll('.overlap-row');
    if (rows.length >= 10) return;
    var idx = rows.length + 1;
    var div = document.createElement('div');
    div.className = 'overlap-row';
    div.innerHTML = '<div class="calc-input-group" style="flex:2"><label>Subnet ' + idx + ' IP</label>' +
        '<input type="text" class="overlap-ip" placeholder="e.g. 10.0.0.0" oninput="sanitizeIpInput(this)" aria-label="Subnet ' + idx + ' IP"></div>' +
        '<div class="calc-input-group" style="flex:1"><label>CIDR</label>' +
        '<input type="text" class="overlap-cidr" placeholder="/24" inputmode="numeric" maxlength="2" oninput="sanitizeCidrInput(this)" aria-label="Subnet ' + idx + ' CIDR"></div>';
    list.appendChild(div);
}

function checkOverlap() {
    var ips = document.querySelectorAll('#overlapInputList .overlap-ip');
    var cidrs = document.querySelectorAll('#overlapInputList .overlap-cidr');
    var out = document.getElementById('overlapResults');
    if (!out) return;

    var subnets = [];
    for (var i = 0; i < ips.length; i++) {
        var ip = (ips[i].value || '').trim();
        var cidr = parseInt((cidrs[i].value || '').trim(), 10);
        if (!validateIP(ip) || isNaN(cidr) || cidr < 0 || cidr > 32) {
            out.innerHTML = '<p style="color:var(--danger)">⚠️ Enter valid IP and CIDR for all subnets</p>';
            return;
        }
        var maskInt = cidr === 0 ? 0 : (0xFFFFFFFF << (32 - cidr)) >>> 0;
        var ipInt = ipToInt(ip);
        var netInt = (ipInt & maskInt) >>> 0;
        var bcastInt = (netInt | (~maskInt >>> 0)) >>> 0;
        subnets.push({
            label: 'Subnet ' + (i + 1),
            ip: ip,
            cidr: cidr,
            network: netInt,
            broadcast: bcastInt,
            networkStr: intToIp(netInt),
            broadcastStr: intToIp(bcastInt),
            size: Math.pow(2, 32 - cidr)
        });
    }

    /* Check all pairs for overlap */
    var overlaps = [];
    for (var a = 0; a < subnets.length; a++) {
        for (var b = a + 1; b < subnets.length; b++) {
            var s1 = subnets[a], s2 = subnets[b];
            if (s1.network <= s2.broadcast && s2.network <= s1.broadcast) {
                overlaps.push({ a: a, b: b, s1: s1, s2: s2 });
            }
        }
    }

    var html = '<div class="copy-result-wrap"><button class="copy-result-btn" onclick="copyResultText(this)" title="Copy results to clipboard">📋 Copy</button>';
    html += '<h3 style="margin:0 0 12px 0;color:var(--text-main)">🔍 Overlap Analysis</h3>';

    html += '<table class="edu-table"><thead><tr>';
    html += '<th>#</th><th>Subnet</th><th>Network</th><th>Broadcast</th><th>Size</th>';
    html += '</tr></thead><tbody>';
    for (var s = 0; s < subnets.length; s++) {
        html += '<tr>';
        html += '<td>' + (s + 1) + '</td>';
        html += '<td>' + subnets[s].ip + '/' + subnets[s].cidr + '</td>';
        html += '<td>' + subnets[s].networkStr + '</td>';
        html += '<td>' + subnets[s].broadcastStr + '</td>';
        html += '<td>' + subnets[s].size.toLocaleString() + ' IPs</td>';
        html += '</tr>';
    }
    html += '</tbody></table>';

    if (overlaps.length === 0) {
        html += '<div style="padding:14px;background:var(--secondary-tint);border-radius:8px;border-left:4px solid var(--secondary);margin-top:12px">';
        html += '<p style="color:var(--secondary-tint-text);font-weight:600;font-size:1.05rem">✅ No overlaps detected — all subnets have distinct address ranges.</p>';
        html += '</div>';
    } else {
        html += '<div style="padding:14px;background:var(--danger-tint);border-radius:8px;border-left:4px solid var(--danger);margin-top:12px">';
        html += '<p style="color:var(--danger-tint-text);font-weight:600;font-size:1.05rem;margin-bottom:8px">⚠️ ' + overlaps.length + ' overlap' + (overlaps.length > 1 ? 's' : '') + ' found!</p>';
        for (var o = 0; o < overlaps.length; o++) {
            var ov = overlaps[o];
            html += '<p style="color:var(--danger-tint-text);margin:4px 0">• <strong>' + ov.s1.ip + '/' + ov.s1.cidr + '</strong> overlaps with <strong>' + ov.s2.ip + '/' + ov.s2.cidr + '</strong></p>';
        }
        html += '</div>';
    }

    /* Visual range bar */
    var allMin = subnets[0].network, allMax = subnets[0].broadcast;
    for (var v = 1; v < subnets.length; v++) {
        if (subnets[v].network < allMin) allMin = subnets[v].network;
        if (subnets[v].broadcast > allMax) allMax = subnets[v].broadcast;
    }
    var totalRange = allMax - allMin + 1;
    if (totalRange > 0 && totalRange <= 0x100000000) {
        /* Build set of overlapping subnet indices */
        var overlapSet = {};
        for (var oi = 0; oi < overlaps.length; oi++) {
            overlapSet[overlaps[oi].a] = true;
            overlapSet[overlaps[oi].b] = true;
        }

        /* Assign each subnet to a lane (row) so overlapping segments don't hide each other */
        var lanes = []; /* lanes[l] = array of {network,broadcast} already placed */
        var laneOf = [];
        for (var vi = 0; vi < subnets.length; vi++) {
            var placed = false;
            for (var l = 0; l < lanes.length; l++) {
                var conflict = false;
                for (var li = 0; li < lanes[l].length; li++) {
                    if (subnets[vi].network <= lanes[l][li].broadcast && subnets[vi].broadcast >= lanes[l][li].network) {
                        conflict = true;
                        break;
                    }
                }
                if (!conflict) {
                    lanes[l].push({network: subnets[vi].network, broadcast: subnets[vi].broadcast});
                    laneOf.push(l);
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                lanes.push([{network: subnets[vi].network, broadcast: subnets[vi].broadcast}]);
                laneOf.push(lanes.length - 1);
            }
        }

        var laneCount = lanes.length;
        var laneH = 36;
        var laneGap = 4;
        var barH = laneCount * laneH + (laneCount - 1) * laneGap + 8;

        html += '<h4 style="margin:1rem 0 0.5rem 0">Address Space Map</h4>';
        html += '<div class="overlap-visual-bar" style="height:' + barH + 'px">';
        for (var vi = 0; vi < subnets.length; vi++) {
            var leftPct = ((subnets[vi].network - allMin) / totalRange * 100).toFixed(2);
            var widthPct = Math.max((subnets[vi].size / totalRange * 100), 2).toFixed(2);
            var topPx = 4 + laneOf[vi] * (laneH + laneGap);
            var isOverlapping = overlapSet[vi] === true;
            var segClass = 'overlap-bar-segment' + (isOverlapping ? ' overlap-bar-conflict' : '');
            html += '<div class="' + segClass + '" style="left:' + leftPct + '%;width:' + widthPct + '%;top:' + topPx + 'px;height:' + laneH + 'px;background:' + getSubnetBarColor(vi) + '"';
            html += ' title="#' + (vi + 1) + ': ' + subnets[vi].networkStr + '/' + subnets[vi].cidr + ' (' + subnets[vi].size.toLocaleString() + ' IPs)">';
            html += '<span>' + (vi + 1) + '</span></div>';
        }
        html += '</div>';

        /* Legend */
        html += '<div class="overlap-bar-legend">';
        for (var vi = 0; vi < subnets.length; vi++) {
            html += '<span class="overlap-legend-item">';
            html += '<span class="overlap-legend-swatch" style="background:' + getSubnetBarColor(vi) + '"></span>';
            html += '<span>' + (vi + 1) + ': ' + subnets[vi].networkStr + '/' + subnets[vi].cidr + '</span>';
            html += '</span>';
        }
        html += '</div>';
    }

    html += '</div>';
    out.innerHTML = html;
}

/* =============================================
   Route Summarization (Supernetting)
   ============================================= */
function addSummarizeRow() {
    var list = document.getElementById('summarizeInputList');
    var rows = list.querySelectorAll('.overlap-row');
    if (rows.length >= 10) return;
    var idx = rows.length + 1;
    var div = document.createElement('div');
    div.className = 'overlap-row';
    div.innerHTML = '<div class="calc-input-group" style="flex:2"><label>Network ' + idx + ' IP</label>' +
        '<input type="text" class="summarize-ip" placeholder="e.g. 10.0.0.0" oninput="sanitizeIpInput(this)" aria-label="Network ' + idx + ' IP"></div>' +
        '<div class="calc-input-group" style="flex:1"><label>CIDR</label>' +
        '<input type="text" class="summarize-cidr" placeholder="/24" inputmode="numeric" maxlength="2" oninput="sanitizeCidrInput(this)" aria-label="Network ' + idx + ' CIDR"></div>';
    list.appendChild(div);
}

function calculateSummarize() {
    var ips = document.querySelectorAll('#summarizeInputList .summarize-ip');
    var cidrs = document.querySelectorAll('#summarizeInputList .summarize-cidr');
    var out = document.getElementById('summarizeResults');
    if (!out) return;

    var networks = [];
    for (var i = 0; i < ips.length; i++) {
        var ip = (ips[i].value || '').trim();
        var cidr = parseInt((cidrs[i].value || '').trim(), 10);
        if (!validateIP(ip) || isNaN(cidr) || cidr < 0 || cidr > 32) {
            out.innerHTML = '<p style="color:var(--danger)">⚠️ Enter valid IP and CIDR for all networks</p>';
            return;
        }
        var maskInt = cidr === 0 ? 0 : (0xFFFFFFFF << (32 - cidr)) >>> 0;
        var ipInt = ipToInt(ip);
        var netInt = (ipInt & maskInt) >>> 0;
        var bcastInt = (netInt | (~maskInt >>> 0)) >>> 0;
        networks.push({
            ip: ip,
            cidr: cidr,
            network: netInt,
            broadcast: bcastInt,
            networkStr: intToIp(netInt)
        });
    }

    /* Find the smallest / largest addresses across all networks */
    var minAddr = networks[0].network;
    var maxAddr = networks[0].broadcast;
    for (var n = 1; n < networks.length; n++) {
        if (networks[n].network < minAddr) minAddr = networks[n].network;
        if (networks[n].broadcast > maxAddr) maxAddr = networks[n].broadcast;
    }

    /* Find the minimum CIDR that covers minAddr to maxAddr */
    var diff = (minAddr ^ maxAddr) >>> 0;
    var commonBits = 0;
    for (var bit = 31; bit >= 0; bit--) {
        if (((diff >>> bit) & 1) === 0) {
            commonBits++;
        } else {
            break;
        }
    }
    var summaryCIDR = commonBits;
    var summaryMask = summaryCIDR === 0 ? 0 : (0xFFFFFFFF << (32 - summaryCIDR)) >>> 0;
    var summaryNet = (minAddr & summaryMask) >>> 0;
    var summaryBcast = (summaryNet | (~summaryMask >>> 0)) >>> 0;
    var summarySize = Math.pow(2, 32 - summaryCIDR);

    /* Binary comparison */
    var binRows = [];
    for (var br = 0; br < networks.length; br++) {
        var binStr = '';
        for (var b = 31; b >= 0; b--) {
            binStr += ((networks[br].network >>> b) & 1) ? '1' : '0';
        }
        binRows.push({ label: networks[br].networkStr + '/' + networks[br].cidr, bin: binStr });
    }
    var summaryBinStr = '';
    for (var sb = 31; sb >= 0; sb--) {
        summaryBinStr += ((summaryNet >>> sb) & 1) ? '1' : '0';
    }

    var html = '<div class="copy-result-wrap"><button class="copy-result-btn" onclick="copyResultText(this)" title="Copy results to clipboard">📋 Copy</button>';
    html += '<h3 style="margin:0 0 12px 0;color:var(--text-main)">📦 Summary Route</h3>';

    html += '<div style="text-align:center;padding:16px;background:var(--primary-tint-light);border-radius:8px;border:1px solid var(--primary-tint-border);margin-bottom:1rem">';
    html += '<p style="color:var(--primary-tint-text);font-size:1.3em;font-weight:700">' + intToIp(summaryNet) + '/' + summaryCIDR + '</p>';
    html += '<p style="color:var(--text-muted);margin-top:4px">Mask: ' + cidrToMask(summaryCIDR) + ' | ' + summarySize.toLocaleString() + ' total IPs</p>';
    html += '</div>';

    /* Binary comparison table */
    html += '<h4 style="margin:0.75rem 0 0.5rem 0">Binary Comparison (common prefix highlighted)</h4>';
    html += '<div class="dec-steps-table-wrap"><table class="edu-table"><thead><tr><th>Network</th><th>Binary (32 bits)</th></tr></thead><tbody>';
    for (var t = 0; t < binRows.length; t++) {
        html += '<tr><td>' + binRows[t].label + '</td><td style="font-family:monospace;letter-spacing:0.05em">';
        for (var c = 0; c < 32; c++) {
            if (c > 0 && c % 8 === 0) html += '<span style="opacity:0.3">.</span>';
            if (c < summaryCIDR) {
                html += '<span class="highlight-cell" style="padding:1px 2px;border-radius:2px">' + binRows[t].bin[c] + '</span>';
            } else {
                html += '<span style="opacity:0.4">' + binRows[t].bin[c] + '</span>';
            }
        }
        html += '</td></tr>';
    }
    html += '<tr style="border-top:2px solid var(--primary)"><td><strong>Summary: ' + intToIp(summaryNet) + '/' + summaryCIDR + '</strong></td>';
    html += '<td style="font-family:monospace;letter-spacing:0.05em">';
    for (var sc = 0; sc < 32; sc++) {
        if (sc > 0 && sc % 8 === 0) html += '<span style="opacity:0.3">.</span>';
        if (sc < summaryCIDR) {
            html += '<span class="highlight-cell" style="padding:1px 2px;border-radius:2px;font-weight:700">' + summaryBinStr[sc] + '</span>';
        } else {
            html += '<span style="opacity:0.4">*</span>';
        }
    }
    html += '</td></tr>';
    html += '</tbody></table></div>';

    html += '<table class="edu-table" style="margin-top:0.75rem"><tbody>';
    html += '<tr><td><strong>Summary Network</strong></td><td>' + intToIp(summaryNet) + '</td></tr>';
    html += '<tr><td><strong>Summary CIDR</strong></td><td>/' + summaryCIDR + '</td></tr>';
    html += '<tr><td><strong>Summary Mask</strong></td><td>' + cidrToMask(summaryCIDR) + '</td></tr>';
    html += '<tr><td><strong>Address Range</strong></td><td>' + intToIp(summaryNet) + ' – ' + intToIp(summaryBcast) + '</td></tr>';
    html += '<tr><td><strong>Total IPs</strong></td><td>' + summarySize.toLocaleString() + '</td></tr>';
    html += '<tr><td><strong>Common Bits</strong></td><td>' + summaryCIDR + ' bits match across all networks</td></tr>';
    html += '<tr><td><strong>Networks Summarized</strong></td><td>' + networks.length + ' routes → 1 summary route</td></tr>';
    html += '</tbody></table>';

    var inputTotal = 0;
    for (var it = 0; it < networks.length; it++) {
        inputTotal += Math.pow(2, 32 - networks[it].cidr);
    }
    if (summarySize > inputTotal) {
        html += '<div class="note-box" style="margin-top:12px"><p><strong>⚠️ Note:</strong> The summary route covers <strong>' + summarySize.toLocaleString() + '</strong> IPs, but your input networks only use <strong>' + inputTotal.toLocaleString() + '</strong>. The extra ' + (summarySize - inputTotal).toLocaleString() + ' addresses are included in the summary — ensure they don\'t conflict with other allocations.</p></div>';
    }

    html += '</div>';
    out.innerHTML = html;
}

/* =============================================
   IP-in-Subnet Checker
   ============================================= */
function checkIPInSubnet() {
    var ipVal = (document.getElementById('ipcheckIP').value || '').trim();
    var subnetIP = (document.getElementById('ipcheckSubnetIP').value || '').trim();
    var cidr = parseInt((document.getElementById('ipcheckCIDR').value || '').trim(), 10);
    var out = document.getElementById('ipcheckResults');
    if (!out) return;

    if (!validateIP(ipVal) || !validateIP(subnetIP) || isNaN(cidr) || cidr < 0 || cidr > 32) {
        out.innerHTML = '<p style="color:var(--danger)">⚠️ Enter valid IP, subnet, and CIDR values</p>';
        return;
    }

    var maskInt = cidr === 0 ? 0 : (0xFFFFFFFF << (32 - cidr)) >>> 0;
    var ipInt = ipToInt(ipVal);
    var subnetInt = (ipToInt(subnetIP) & maskInt) >>> 0;
    var bcastInt = (subnetInt | (~maskInt >>> 0)) >>> 0;
    var ipNetworkInt = (ipInt & maskInt) >>> 0;
    var belongs = (ipNetworkInt === subnetInt);

    var html = '<div class="copy-result-wrap"><button class="copy-result-btn" onclick="copyResultText(this)" title="Copy results to clipboard">📋 Copy</button>';

    if (belongs) {
        html += '<div style="padding:14px;background:var(--secondary-tint);border-radius:8px;border-left:4px solid var(--secondary);margin-bottom:12px">';
        html += '<p style="color:var(--secondary-tint-text);font-weight:600;font-size:1.1rem">✅ Yes — ' + ipVal + ' belongs to ' + intToIp(subnetInt) + '/' + cidr + '</p>';
        html += '</div>';
    } else {
        html += '<div style="padding:14px;background:var(--danger-tint);border-radius:8px;border-left:4px solid var(--danger);margin-bottom:12px">';
        html += '<p style="color:var(--danger-tint-text);font-weight:600;font-size:1.1rem">❌ No — ' + ipVal + ' does NOT belong to ' + intToIp(subnetInt) + '/' + cidr + '</p>';
        html += '<p style="color:var(--danger-tint-text);margin-top:4px">' + ipVal + ' belongs to network <strong>' + intToIp(ipNetworkInt) + '/' + cidr + '</strong></p>';
        html += '</div>';
    }

    html += '<table class="edu-table"><tbody>';
    html += '<tr><td><strong>IP Address</strong></td><td>' + ipVal + '</td></tr>';
    html += '<tr><td><strong>Subnet Network</strong></td><td>' + intToIp(subnetInt) + '/' + cidr + '</td></tr>';
    html += '<tr><td><strong>Subnet Range</strong></td><td>' + intToIp(subnetInt) + ' – ' + intToIp(bcastInt) + '</td></tr>';
    html += '<tr><td><strong>Subnet Mask</strong></td><td>' + cidrToMask(cidr) + '</td></tr>';
    html += '<tr><td><strong>IP\'s Network</strong></td><td>' + intToIp(ipNetworkInt) + '/' + cidr + '</td></tr>';
    html += '</tbody></table>';

    html += '</div>';
    out.innerHTML = html;
}

/* =============================================
   Copy Results to Clipboard
   ============================================= */
function copyResultText(btn) {
    var wrap = btn.closest('.copy-result-wrap');
    if (!wrap) wrap = btn.parentElement;
    var text = '';
    var tables = wrap.querySelectorAll('table');
    if (tables.length > 0) {
        for (var t = 0; t < tables.length; t++) {
            var rows = tables[t].querySelectorAll('tr');
            for (var r = 0; r < rows.length; r++) {
                var cells = rows[r].querySelectorAll('th, td');
                var rowText = [];
                for (var c = 0; c < cells.length; c++) {
                    rowText.push(cells[c].textContent.trim());
                }
                text += rowText.join('\t') + '\n';
            }
            text += '\n';
        }
    } else {
        text = wrap.textContent;
    }
    navigator.clipboard.writeText(text.trim()).then(function() {
        var orig = btn.textContent;
        btn.textContent = '✅ Copied!';
        btn.classList.add('copied');
        setTimeout(function() {
            btn.textContent = orig;
            btn.classList.remove('copied');
        }, 2000);
    }).catch(function() {
        btn.textContent = '❌ Failed';
        setTimeout(function() { btn.textContent = '📋 Copy'; }, 2000);
    });
}

/* =============================================
   Challenge Session History (localStorage)
   ============================================= */
function saveChallengeSession() {
    if (challengeState.total === 0) return;
    var sessions = JSON.parse(localStorage.getItem('challengeHistory') || '[]');
    var session = {
        date: new Date().toISOString(),
        difficulty: challengeState.difficulty,
        correct: challengeState.correct,
        total: challengeState.total,
        bestStreak: challengeState._bestStreak || challengeState.streak,
        accuracy: challengeState.total > 0 ? Math.round((challengeState.correct / challengeState.total) * 100) : 0
    };
    sessions.unshift(session);
    if (sessions.length > 20) sessions = sessions.slice(0, 20);
    localStorage.setItem('challengeHistory', JSON.stringify(sessions));
    loadChallengeHistory();
}

function loadChallengeHistory() {
    var el = document.getElementById('challengeHistory');
    if (!el) return;
    var sessions = JSON.parse(localStorage.getItem('challengeHistory') || '[]');
    if (sessions.length === 0) {
        el.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:1rem">No sessions recorded yet. Complete a challenge to see your history!</p>';
        return;
    }

    var totalCorrect = 0, totalAttempted = 0, bestStreak = 0;
    for (var i = 0; i < sessions.length; i++) {
        totalCorrect += sessions[i].correct;
        totalAttempted += sessions[i].total;
        if (sessions[i].bestStreak > bestStreak) bestStreak = sessions[i].bestStreak;
    }
    var allTimeAccuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

    var html = '<div class="divider-stats-grid" style="margin-bottom:1rem">';
    html += '<div class="divider-stat"><span class="divider-stat-val">' + sessions.length + '</span><span class="divider-stat-lbl">Sessions</span></div>';
    html += '<div class="divider-stat"><span class="divider-stat-val">' + totalCorrect + '/' + totalAttempted + '</span><span class="divider-stat-lbl">All-Time Score</span></div>';
    html += '<div class="divider-stat"><span class="divider-stat-val">' + allTimeAccuracy + '%</span><span class="divider-stat-lbl">Accuracy</span></div>';
    html += '<div class="divider-stat"><span class="divider-stat-val">' + bestStreak + '</span><span class="divider-stat-lbl">Best Streak</span></div>';
    html += '</div>';

    html += '<div class="dec-steps-table-wrap"><table class="edu-table"><thead><tr>';
    html += '<th>Date</th><th>Difficulty</th><th>Score</th><th>Accuracy</th><th>Best Streak</th>';
    html += '</tr></thead><tbody>';
    var showCount = Math.min(sessions.length, 10);
    for (var j = 0; j < showCount; j++) {
        var s = sessions[j];
        var d = new Date(s.date);
        var dateStr = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        var diffLabel = s.difficulty.charAt(0).toUpperCase() + s.difficulty.slice(1);
        var accColor = s.accuracy >= 80 ? 'var(--secondary)' : s.accuracy >= 50 ? 'var(--warning)' : 'var(--danger)';
        html += '<tr>';
        html += '<td style="font-size:0.85em">' + dateStr + '</td>';
        html += '<td>' + diffLabel + '</td>';
        html += '<td>' + s.correct + '/' + s.total + '</td>';
        html += '<td style="color:' + accColor + ';font-weight:600">' + s.accuracy + '%</td>';
        html += '<td>' + (s.bestStreak || 0) + '</td>';
        html += '</tr>';
    }
    if (sessions.length > 10) {
        html += '<tr><td colspan="5" style="text-align:center;font-style:italic">Showing latest 10 of ' + sessions.length + ' sessions</td></tr>';
    }
    html += '</tbody></table></div>';
    el.innerHTML = html;
}

function clearChallengeHistory() {
    localStorage.removeItem('challengeHistory');
    loadChallengeHistory();
}

/* ========================================
   Antigravity Particle Background
   ======================================== */
(function initParticles() {
    var canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');

    var particles = [];
    var PARTICLE_COUNT = 50;
    var CONNECT_DIST = 130;

    function isDark() {
        return document.documentElement.getAttribute('data-theme') === 'dark';
    }

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function Particle() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.25;
        this.vy = -Math.random() * 0.35 - 0.08; /* float upward — antigravity */
        this.radius = Math.random() * 1.5 + 0.5;
        this.opacity = Math.random() * 0.3 + 0.05;
        this.hue = Math.random() > 0.7 ? 174 : 210; /* azure or teal */
    }

    for (var i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(new Particle());
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        var dark = isDark();
        var lineAlphaScale = dark ? 0.08 : 0.05;
        var dotSat = dark ? '70%' : '50%';
        var dotLit = dark ? '70%' : '55%';
        var glowAlphaScale = dark ? 0.15 : 0.08;

        /* Draw connections */
        for (var i = 0; i < particles.length; i++) {
            for (var j = i + 1; j < particles.length; j++) {
                var dx = particles[i].x - particles[j].x;
                var dy = particles[i].y - particles[j].y;
                var dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < CONNECT_DIST) {
                    var alpha = (1 - dist / CONNECT_DIST) * lineAlphaScale;
                    ctx.strokeStyle = dark
                        ? 'rgba(96, 165, 250, ' + alpha + ')'
                        : 'rgba(59, 130, 196, ' + alpha + ')';
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }

        /* Draw & update particles */
        for (var k = 0; k < particles.length; k++) {
            var p = particles[k];
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'hsla(' + p.hue + ', ' + dotSat + ', ' + dotLit + ', ' + p.opacity + ')';
            ctx.fill();

            /* Subtle glow */
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
            ctx.fillStyle = 'hsla(' + p.hue + ', ' + dotSat + ', ' + dotLit + ', ' + (p.opacity * glowAlphaScale) + ')';
            ctx.fill();

            p.x += p.vx;
            p.y += p.vy;

            /* Wrap around edges */
            if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
            if (p.x < -10) p.x = canvas.width + 10;
            if (p.x > canvas.width + 10) p.x = -10;
        }

        requestAnimationFrame(draw);
    }

    draw();
})();
