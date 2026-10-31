/* Glossy chocolate, berry cream, and a hand-drawn number-16 candle topper. */
(() => {
  'use strict';
  let instance = 0;

  function cakeSvg() {
    const id = `sweet-sixteen-${++instance}`;
    const paint = name => `url(#${id}-${name})`;
    const cream = (x,y,scale=1) => `<g transform="translate(${x} ${y}) scale(${scale})"><ellipse cy="3" rx="8" ry="3" fill="#2e110d" opacity=".25"/><path d="M-9 0C-9-4-4-5-4-8-3-10 0-10 2-15 7-11 5-8 7-6 12-2 10 3 5 4H-4C-9 4-11 2-9 0Z" fill="${paint('cream')}"/><path d="M-6 0C1 0-3-7 2-12M-2 3C5 3 1-3 7-4" fill="none" stroke="#fff8e8" stroke-width="1.5" stroke-linecap="round" opacity=".85"/></g>`;
    const strawberry = (x,y,scale=1,turn=0) => `<g class="cake-strawberry" transform="translate(${x} ${y}) rotate(${turn}) scale(${scale})"><ellipse cy="10" rx="12" ry="4" fill="#3c1713" opacity=".25"/><path d="M0-10C-6-16-15-10-14-2-13 7-4 17 0 20 5 16 14 7 14-2 15-10 6-16 0-10Z" fill="${paint('berry')}"/><path d="M-7-6C-12-1-7 9-2 12" fill="none" stroke="#ffb4a9" stroke-width="3" stroke-linecap="round" opacity=".75"/><g fill="#ffe3a4" transform="rotate(-8)"><ellipse cx="-7" cy="-3" rx=".9" ry="1.6"/><ellipse cx="1" cy="-4" rx=".9" ry="1.6"/><ellipse cx="8" cy="-1" rx=".9" ry="1.6"/><ellipse cx="-4" cy="5" rx=".8" ry="1.4"/><ellipse cx="5" cy="6" rx=".8" ry="1.4"/><ellipse cy="12" rx=".7" ry="1.2"/></g><path d="m0-8-9-6 6 1-1-6 6 5 5-5-1 7 8-1-9 6Z" fill="#638758"/><path d="m0-10 1-10" stroke="#597445" stroke-width="2" stroke-linecap="round"/><path d="M6-7q4 0 5 3" stroke="#fff3d9" stroke-width="1.2" stroke-linecap="round" opacity=".75"/></g>`;
    const raspberry = (x,y,scale=1) => `<g class="cake-raspberry" transform="translate(${x} ${y}) scale(${scale})"><ellipse cy="4" rx="9" ry="3" fill="#341713" opacity=".2"/><g fill="${paint('raspberry')}" stroke="#a53555" stroke-width=".45"><circle cx="-4" cy="-6" r="3.6"/><circle cx="3" cy="-7" r="3.9"/><circle cx="-7" cy="0" r="3.6"/><circle cy="0" r="4"/><circle cx="7" cy="0" r="3.6"/><circle cx="-3.5" cy="5" r="3.7"/><circle cx="3.5" cy="5" r="3.7"/></g><path d="m-4-8 1-1m5 0 1-1m-11 9 1-1m5 1 1-1m6 0 1-1" stroke="#ffb2b9" stroke-width="1.8" stroke-linecap="round"/></g>`;
    const curl = (x,y,scale=1,turn=0) => `<g transform="translate(${x} ${y}) rotate(${turn}) scale(${scale})"><path d="M-13 9C-10-11 13-15 15-4 17 8-1 14-4 6-6 0 5-6 9-3" fill="none" stroke="#442018" stroke-width="9" stroke-linecap="round"/><path d="M-14 5C-7-12 13-12 13-3 13 5 2 9-1 5" fill="none" stroke="#c58a60" stroke-width="2" stroke-linecap="round" opacity=".8"/></g>`;
    const numberCandle = (digit,x) => {
      const shape = digit==='1' ? 'M4 13 16 4H28V43H36V53H5V43H17V18L9 23Z' : 'M35 7 29 17C26 12 19 13 15 20 35 14 44 28 36 45 30 58 7 58 4 38 1 17 14-3 35 7ZM15 35C15 47 29 48 28 35 27 26 15 27 15 35Z';
      return `<g class="cake-candle cake-number-candle" data-candle-digit="${digit}" transform="translate(${x} 43)"><ellipse cx="21" cy="54" rx="19" ry="3.5" fill="#321713" opacity=".24"/><path d="${shape}" transform="translate(1 2)" fill="#a85578" stroke="#ad7750" stroke-width="2.6" stroke-linejoin="round" fill-rule="evenodd"/><path d="${shape}" fill="${paint('wax')}" stroke="#d8ac6b" stroke-width="1.7" stroke-linejoin="round" fill-rule="evenodd"/><path d="${digit==='1'?'M8 14 18 7H24M21 18V40M10 47H29':'M29 9C15 3 7 24 8 35M16 47q12 6 16-6'}" fill="none" stroke="#fffaf1" stroke-width="2" stroke-linecap="round" opacity=".88"/><g fill="#d8aa68"><circle cx="${digit==='1'?23:11}" cy="25" r="1"/><circle cx="${digit==='1'?24:32}" cy="39" r="1.1"/><circle cx="${digit==='1'?11:21}" cy="49" r=".8"/></g><path d="M22 4V-2" stroke="#593b31" stroke-width="1.8" stroke-linecap="round"/><g class="cake-candle-flame"><ellipse cx="22" cy="-10" rx="17" ry="18" fill="${paint('flame-halo')}"/><path d="M22-1C10-5 14-16 23-25 22-16 31-13 29-7 28-3 24-1 22-1Z" fill="${paint('flame')}"/><path d="M22-4C17-7 20-12 23-15 22-10 26-10 25-7 24-5 23-4 22-4Z" fill="#fff9d8"/></g><path class="cake-candle-smoke" d="M22-2C15-9 29-13 22-20S18-28 24-33" fill="none" stroke="#c4a9a6" stroke-width="2" stroke-linecap="round"/></g>`;
    };
    const baseCream=[186,208,230,252,274,296,318,340,362,384,406,428].map((x,i)=>cream(x,278+Math.sin(i/11*Math.PI)*5,.8)).join('');
    const middleCream=[225,248,271,294,317,340,363,386].map((x,i)=>cream(x,197+Math.sin(i/7*Math.PI)*4,.7)).join('');
    const topCream=[260,280,300,320,340,360].map((x,i)=>cream(x,114+Math.sin(i/5*Math.PI)*3,.55)).join('');
    return `<svg class="birthday-cake-art cake-sixteen-art" data-cake-age="16" viewBox="0 0 560 380" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="${id}-chocolate" x1="0" y1="0" x2="1" y2=".2"><stop stop-color="#ab6b45"/><stop offset=".2" stop-color="#81452e"/><stop offset=".55" stop-color="#64301f"/><stop offset=".85" stop-color="#482218"/><stop offset="1" stop-color="#2d1611"/></linearGradient>
        <linearGradient id="${id}-ganache" x1="0" y1="0" x2=".2" y2="1"><stop stop-color="#a45f3d"/><stop offset=".2" stop-color="#6c3021"/><stop offset=".65" stop-color="#421b15"/><stop offset="1" stop-color="#57251a"/></linearGradient>
        <linearGradient id="${id}-top" x1="0" y1="0" x2=".7" y2="1"><stop stop-color="#ce9667"/><stop offset=".28" stop-color="#965335"/><stop offset=".65" stop-color="#5b291e"/><stop offset="1" stop-color="#341813"/></linearGradient>
        <linearGradient id="${id}-cream" x1="0" y1="0" x2="1" y2=".4"><stop stop-color="#fffdf1"/><stop offset=".45" stop-color="#fff0d8"/><stop offset="1" stop-color="#dcb68d"/></linearGradient>
        <linearGradient id="${id}-filling" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fff1e7"/><stop offset=".25" stop-color="#f3c8cf"/><stop offset=".6" stop-color="#cf7895"/><stop offset="1" stop-color="#93415c"/></linearGradient>
        <radialGradient id="${id}-berry" cx=".25" cy=".2" r=".85"><stop stop-color="#ff9b83"/><stop offset=".33" stop-color="#ed5e66"/><stop offset=".7" stop-color="#c82f4e"/><stop offset="1" stop-color="#811d38"/></radialGradient>
        <radialGradient id="${id}-raspberry" cx=".25" cy=".15" r=".9"><stop stop-color="#f88c9b"/><stop offset=".5" stop-color="#d95075"/><stop offset="1" stop-color="#9d2850"/></radialGradient>
        <linearGradient id="${id}-wax" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff4eb"/><stop offset=".25" stop-color="#ffdeeb"/><stop offset=".7" stop-color="#eaa6c4"/><stop offset="1" stop-color="#c879a0"/></linearGradient>
        <radialGradient id="${id}-flame-halo"><stop stop-color="#ffd884" stop-opacity=".43"/><stop offset="1" stop-color="#ffd884" stop-opacity="0"/></radialGradient>
        <linearGradient id="${id}-flame" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#ffe6a6"/><stop offset=".55" stop-color="#ffbd55"/><stop offset="1" stop-color="#e88536"/></linearGradient>
        <linearGradient id="${id}-plate" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fff6e8"/><stop offset=".5" stop-color="#edcfcc"/><stop offset="1" stop-color="#bc8f91"/></linearGradient>
      </defs>
      <ellipse cx="310" cy="349" rx="174" ry="16" fill="#48211c" opacity=".13"/>
      <ellipse cx="310" cy="339" rx="170" ry="19" fill="${paint('plate')}"/>
      <ellipse cx="310" cy="334" rx="169" ry="17" fill="#fff6e9" stroke="#d4ad78" stroke-width="1.4"/>
      <ellipse cx="310" cy="334" rx="154" ry="12" fill="#f3e2d5"/>
      <path d="M157 337c58 17 248 17 306 0" fill="none" stroke="#fffdf3" stroke-width="2.5" opacity=".8"/>

      <g class="chocolate-tier chocolate-tier-bottom">
        <path d="M170 260V316C170 338 450 338 450 316V260Z" fill="${paint('chocolate')}"/>
        <path d="M173 295C232 312 390 313 448 295V306C388 324 233 323 173 306Z" fill="${paint('filling')}"/>
        <path d="M177 296c69 15 191 16 264 0" fill="none" stroke="#fff6dd" stroke-width="1.7" opacity=".75"/>
        <path d="M178 310c64 16 198 16 264 0" fill="none" stroke="#33140e" stroke-width="2.3"/>
        <path d="M180 316c67 14 191 14 260 0" fill="none" stroke="#b56b43" stroke-width="2.7" opacity=".65"/>
        <ellipse cx="310" cy="260" rx="140" ry="17" fill="${paint('top')}"/>
        <path class="cake-ganache" d="M170 260C197 241 420 240 450 260V270C449 279 438 280 437 270 436 265 431 269 430 284 429 304 416 304 415 281 414 271 405 271 404 282 403 294 392 293 392 279 392 272 381 274 380 292 379 309 366 308 366 287 365 276 352 275 351 289 350 306 337 304 337 283 336 276 326 276 325 296 324 315 310 314 310 291 310 277 297 276 296 289 295 305 282 303 282 283 282 275 272 275 271 293 270 309 257 307 257 284 257 274 246 272 245 285 244 301 232 298 232 280 232 272 219 269 219 285 218 298 205 294 205 278 205 269 196 266 195 279 194 290 180 286 179 274L170 270Z" fill="${paint('ganache')}"/>
        <path class="cake-gloss" d="M184 257c55-15 192-16 250-2" fill="none" stroke="#e7b28b" stroke-width="3.4" stroke-linecap="round" opacity=".63"/>
        <path class="cake-gloss" d="M190 266q4 12 4 15m72-1v15m51-9v17m105-26v14" fill="none" stroke="#e7a879" stroke-width="2.5" stroke-linecap="round" opacity=".42"/>
        ${baseCream}
        <g fill="#e7b970"><circle cx="226" cy="320" r="1.5"/><circle cx="269" cy="325" r="1.3"/><circle cx="351" cy="325" r="1.3"/><circle cx="398" cy="320" r="1.5"/></g>
      </g>

      <g class="chocolate-tier chocolate-tier-middle">
        <path d="M210 181V252C210 272 410 272 410 252V181Z" fill="${paint('chocolate')}"/>
        <path d="M211 238c44 15 156 15 198 0v10c-48 15-153 16-198 0Z" fill="${paint('filling')}"/>
        <path d="M216 239c47 13 141 13 188 0" fill="none" stroke="#fff0dc" stroke-width="1.7" opacity=".85"/>
        <path d="M219 254c52 14 131 14 183 0" fill="none" stroke="#bf8052" stroke-width="2.3" opacity=".65"/>
        <ellipse cx="310" cy="181" rx="100" ry="16" fill="${paint('top')}"/>
        <path class="cake-ganache" d="M210 181c23-19 175-20 200 0v11c0 10-12 11-13-1-1-6-10-1-10 12 0 19-14 18-14 0 0-11-13-11-14 3-1 21-15 21-16-3 0-9-11-9-12 8-1 22-15 22-15 0 0-15-13-15-14-1-2 19-14 18-14-4 0-11-12-12-13 2-1 18-14 17-15-3 0-9-12-10-12 2-1 15-14 14-14-6 0-9-9-11-10-2-1 10-12 8-12-3Z" fill="${paint('ganache')}"/>
        <path class="cake-gloss" d="M222 178c39-13 132-13 174 0" stroke="#e5ac80" stroke-width="3" stroke-linecap="round" fill="none" opacity=".65"/>
        <path class="cake-gloss" d="M269 194v13m54-9v13m57-18v10" stroke="#dda077" stroke-width="2.2" stroke-linecap="round" opacity=".45"/>
        ${middleCream}
        <g class="cake-sweet-sixteen-plaque"><path d="M278 218q32-8 64 0v17q-32 8-64 0Z" fill="#f6dfca" stroke="#c1955b" stroke-width="1.2"/><path d="M282 220q28-6 56 0" fill="none" stroke="#fff8e7" stroke-width="1.2"/><text x="310" y="229" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="9" fill="#824654">Sweet sixteen</text></g>
      </g>

      <g class="chocolate-tier chocolate-tier-top">
        <path d="M250 101V175C250 189 370 189 370 175V101Z" fill="${paint('chocolate')}"/>
        <path d="M251 155c28 12 90 12 118 0v9c-29 13-88 13-118 0Z" fill="${paint('filling')}"/>
        <path d="M255 156c26 10 84 10 110 0" fill="none" stroke="#fff6de" stroke-width="1.5" opacity=".8"/>
        <path d="M257 175c24 8 82 8 106 0" stroke="#be8155" stroke-width="2" opacity=".7" fill="none"/>
        <ellipse cx="310" cy="101" rx="60" ry="14" fill="${paint('top')}"/>
        <path class="cake-ganache" d="M250 101c16-19 104-19 120 0v11c0 11-10 11-11-1-1-7-10-4-11 10-1 18-13 18-13-1 0-10-11-10-12 8-1 16-13 16-13-4 0-12-11-14-12 0-1 16-13 15-13-4 0-9-10-11-11 2-1 13-12 10-12-3 0-8-9-10-10-3-1 10-2 9-2-4Z" fill="${paint('ganache')}"/>
        <path class="cake-gloss" d="M260 99c22-11 77-11 99-1" stroke="#efbd92" stroke-width="2.5" stroke-linecap="round" fill="none" opacity=".75"/>
        <path class="cake-gloss" d="M290 109v13m27-10v16m25-18v10" stroke="#d68f66" stroke-width="1.9" stroke-linecap="round" opacity=".55"/>
        ${topCream}
        <g fill="#e9bc76"><circle cx="270" cy="144" r="1.5"/><circle cx="350" cy="144" r="1.5"/><circle cx="310" cy="146" r="1.6"/></g>
      </g>

      <g class="cake-berry-toppings">
        ${cream(187,252,.9)}${strawberry(192,246,.82,-18)}${raspberry(213,250,.7)}
        ${cream(430,252,.9)}${strawberry(434,242,.9,19)}${raspberry(413,250,.72)}
        ${strawberry(230,178,.69,-25)}${raspberry(247,181,.65)}${curl(396,178,.55,15)}
        ${raspberry(263,97,.62)}${strawberry(363,98,.7,23)}
        ${strawberry(188,325,.85,-37)}${raspberry(207,333,.8)}${curl(433,328,.7,-15)}
        ${curl(260,327,.5,-25)}${raspberry(385,328,.6)}
      </g>
      <g class="cake-number-topper" data-cake-number="16">${numberCandle('1',278)}${numberCandle('6',321)}</g>
      <g class="cake-sugar-sparkles" fill="#ffedbc"><path d="m189 218 1.5 4.5 4.5 1.5-4.5 1.5-1.5 4.5-1.5-4.5-4.5-1.5 4.5-1.5Zm234-75 1.2 3.8 3.8 1.2-3.8 1.2-1.2 3.8-1.2-3.8-3.8-1.2 3.8-1.2Z"/><circle cx="221" cy="135" r="1.7"/><circle cx="403" cy="293" r="1.5"/></g>
    </svg>`;
  }
  window.GardenCakeArt = {cakeSvg};
})();
