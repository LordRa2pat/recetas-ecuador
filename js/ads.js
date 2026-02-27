// Ecuador a la Carta — js/ads.js
// AdSense helpers: initAds, renderInFeedAd

'use strict';

export function initAds() {
  if (typeof adsbygoogle === 'undefined') return;
  document.querySelectorAll('ins.adsbygoogle:not([data-adsbygoogle-status])').forEach(function () {
    try { (adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { }
  });
}

export function renderInFeedAd(slotId) {
  slotId = slotId || '2222222222';
  return '<div class="ad-slot ad-slot--square col-span-1 sm:col-span-2 lg:col-span-3 my-4" role="complementary" aria-label="Publicidad">' +
    '<p class="ad-label">Publicidad</p>' +
    '<ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-9813915136648702"' +
    ' data-ad-slot="' + slotId + '" data-ad-format="auto" data-full-width-responsive="true"></ins>' +
    '</div>';
}
