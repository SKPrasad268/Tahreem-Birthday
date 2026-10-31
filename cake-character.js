/* A tiny paper-doll helper, drawn in the cake scene's own coordinate scale. */
(() => {
  'use strict';

  function markup() {
    return `<div class="cake-helper" aria-hidden="true">
      <svg class="cake-helper-girl" viewBox="0 0 48 60" xmlns="http://www.w3.org/2000/svg" focusable="false">
        <g stroke="#6f4750" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round">
          <path fill="#5d3a31" d="M15 13C4 9 3 23 7 29c2 4 6 5 11 4l1-12z"/>
          <path fill="#795047" d="M10 15c-4 3-3 10 0 13" stroke="#a87563" stroke-width="1.6"/>
          <path fill="#f0b8c9" d="M11 10C5 3 3 6 4 11c-1 5 3 6 8 2 6 5 10 2 7-2 1-5-3-7-8-1z"/>
          <circle cx="11.6" cy="11.5" r="2.2" fill="#c57796"/>
          <path fill="#f2bd9c" d="M26 28v9l8 1 1-10z"/>
          <path fill="#eeb0c4" d="M22 34c-5 1-9 9-11 15 7 6 22 6 29 0-3-8-4-13-9-15z"/>
          <path fill="#ce84a1" d="M22 36c-1 7-2 12-5 15 7 3 15 3 23-2-3-8-4-13-9-15z" stroke="none"/>
          <path d="M21 43c0 3-1 5-2 7m9-7 1 8m6-9 2 7" fill="none" stroke="#b76f90" stroke-width=".8"/>
          <path fill="#fff4dd" d="M22 34l5 5 5-5-4-2z"/>
          <path fill="#f3c4a8" d="M20 35c-5 0-7 4-9 7-1 2 2 4 4 2l8-6z"/>
          <path fill="#f3c4a8" d="M33 35c4 1 5 0 7-3 1-2 4-1 4 1-1 5-5 8-10 7z"/>
          <path fill="#eeb0c4" d="M19 34c-2 0-4 2-5 4l6 3 4-6zm13 0 5 1-1 6-5-3z"/>
          <path fill="#f2bd9c" d="M20 51v6l5 1 1-6zm11 1v6h5v-7z"/>
          <path fill="#904f6a" d="M19 56h6l1 4h-9c-1-2 0-3 2-4zm12 0h5c3 1 4 2 3 4h-9z"/>
          <path d="M19 57h4m10 0h3" stroke="#efc4d4" stroke-width="1.4"/>
          <path fill="#5d3a31" d="M13 21C9 9 19 1 31 3c11-1 16 8 14 20l-7 8-19-2z"/>
          <path fill="#f7d0b6" d="M20 12c5-7 17-6 22 1l1 5 3 3-3 2c-1 8-11 12-18 8-7-3-10-12-5-19z"/>
          <path fill="#5d3a31" d="M15 18c-4-9 5-17 16-15 7-1 13 3 14 10-5 0-9-3-11-7-2 7-9 11-16 12l1 9-4-1z"/>
          <path d="M19 11c3-5 7-6 11-5" fill="none" stroke="#ad7a64" stroke-width="1.8"/>
          <path fill="#f2bd9c" d="M18 21c-5-2-6 6-1 7l3-1"/>
          <ellipse class="cake-helper-cheek" cx="29" cy="23" rx="3.2" ry="1.9" fill="#e7a0a0" stroke="none"/>
          <g class="cake-helper-awake-eyes" fill="#543b3c" stroke="none">
            <ellipse cx="28.4" cy="17.3" rx="1.65" ry="2.2"/>
            <ellipse cx="38" cy="16.6" rx="1.45" ry="2.05"/>
            <circle cx="28.8" cy="16.6" r=".5" fill="#fffaf0"/>
            <circle cx="38.4" cy="16" r=".45" fill="#fffaf0"/>
          </g>
          <path class="cake-helper-smile" d="M35 21c1.5 2.6 3.6 2.7 5.3.3" fill="none" stroke="#a6636f"/>
          <ellipse class="cake-helper-blow-mouth" cx="38" cy="20" rx="1.9" ry="2.6" fill="#8d5660" stroke="none"/>
          <g class="cake-helper-dizzy-eyes" fill="none" stroke="#774951" stroke-width="1.3">
            <path d="m26.5 15.8 3.6 3.7m0-3.7-3.6 3.7m9.8-4.3 3.5 3.7m0-3.7-3.5 3.7"/>
          </g>
          <path class="cake-helper-dizzy-mouth" d="M35 23q3-2 6 0" fill="none" stroke="#a6636f"/>
          <circle cx="27" cy="44" r="2.1" fill="#f5ddaa" stroke="none"/>
          <path d="M27 40.8v6.4m-3.2-3.2h6.4m-5.4-2.2 4.4 4.4m0-4.4-4.4 4.4" stroke="#fff4dd" stroke-width="1.15"/>
        </g>
        <g class="cake-helper-dizzy-stars" fill="#edc568" stroke="#c49a53" stroke-width=".5">
          <path d="m4 0 1.5 3.3 3.5.3-2.6 2.5.8 3.5L4 7.8.8 9.6l.8-3.5L-1 3.6l3.5-.3z"/>
          <path d="m45 0 1 2.2 2.5.2-1.8 1.7.5 2.5L45 5.3l-2.2 1.3.5-2.5-1.8-1.7 2.5-.2z"/>
          <text x="0" y="38" fill="#b68a9d" stroke="none" font-family="Georgia,serif" font-size="6" font-style="italic">z z</text>
        </g>
      </svg>
      <span class="cake-wind"><svg viewBox="0 0 200 40" xmlns="http://www.w3.org/2000/svg" focusable="false">
        <g fill="none" stroke="#f7fff7" stroke-linecap="round" stroke-width="2.7">
          <path d="M0 20h118c19 0 20-14 9-14-6 0-8 6-3 8"/>
          <path d="M8 25h143c18 0 18 12 7 12-7 0-8-7-3-8"/>
          <path d="M15 15h68c16 0 16-12 8-12-6 0-8 6-4 8"/>
          <path d="M35 31h49m66-17h29m-9 10h23" opacity=".75"/>
        </g>
        <g fill="#e2efe2" opacity=".65"><ellipse cx="41" cy="20" rx="18" ry="3"/><ellipse cx="91" cy="23" rx="24" ry="3"/><ellipse cx="155" cy="20" rx="16" ry="2.5"/></g>
      </svg></span>
    </div>`;
  }

  window.GardenCakeCharacter = {markup};
})();
