/**
 * Store Locator section behavior.
 * Handles: live "Verified accounts / Cities" stat counts, the "Where It
 * Pours" city pill cloud, and pill clicks driving the Stockist widget's
 * search -- with a no-reload path when possible, falling back to a
 * documented reload-based link when it isn't.
 *
 * Scoped per section instance via data attributes, no globals leaked.
 * Re-initializes on shopify:section:load so it keeps working through
 * theme editor edits without a full page reload.
 */
(function () {
  'use strict';

  var initialized = new WeakSet();

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function initInstance(root) {
    if (!root || initialized.has(root)) return;
    initialized.add(root);

    var widgetTag = root.getAttribute('data-widget-tag');
    if (!widgetTag) return;

    var anchorId = root.getAttribute('data-anchor-id');
    var statsAccountsEl = root.querySelector('[data-stat="accounts"]');
    var statsCitiesEl = root.querySelector('[data-stat="cities"]');
    var pillsList = root.querySelector('[data-city-pills]');
    var clearBtn = root.querySelector('[data-clear-city]');

    if (!statsAccountsEl && !statsCitiesEl && !pillsList) return; // nothing to do

    /* ---------- Wait for the Stockist search API to exist ----------
       window.Stockist.__widget only exists once the custom element's
       connectedCallback has run. We deliberately do NOT gate on the
       widget's own .ready() -- tested live: .ready() only resolves after
       the map finishes loading, so it never fires at all when the Google
       Maps key is misconfigured. That would tie an unrelated search
       feature to a map bug. _broker.publishQuery is wired up earlier in
       init and worked in live testing well before .ready() would have
       fired, so we poll for that directly instead.

       None of this (window.Stockist.__widget, _broker, publishQuery,
       _form._input, getSelectedFilters) is documented anywhere in
       Stockist's help center -- confirmed by reading every article across
       all five categories, not just searching. It was found by reading
       the shipped widget.min.js directly. Every call below is guarded,
       and the pill's <a href> always stays a valid, documented
       ?stockist-query= link, so if Stockist ever renames or removes any
       of this in a future update, clicks silently fall back to a normal
       (reload-based) navigation instead of breaking outright. */
    var stockistReady = false;

    function pollForWidget(attemptsLeft) {
      var w = window.Stockist && window.Stockist.__widget;
      var broker = w && w._client && w._client._broker;
      if (broker && typeof broker.publishQuery === 'function') {
        stockistReady = true;
        return;
      }
      if (attemptsLeft <= 0) return; // never showed up; pills keep working as plain links
      setTimeout(function () { pollForWidget(attemptsLeft - 1); }, 150);
    }
    pollForWidget(60); // ~9s of polling before giving up

    function tryLiveSearch(city) {
      try {
        if (!stockistReady) return false;
        var w = window.Stockist && window.Stockist.__widget;
        var broker = w && w._client && w._client._broker;
        if (!broker || typeof broker.publishQuery !== 'function') return false;

        /* publishQuery alone runs the search but does not touch the
           visible search box (confirmed live: results start updating but
           the input stays blank). w._form._input is a direct reference to
           the real <input>, handed to us via the widget's own object
           graph rather than through .shadowRoot, so it works despite the
           closed shadow root. Purely cosmetic -- no input event needed,
           since publishQuery independently runs the actual search. */
        var input = w._form && w._form._input;
        if (input) { input.value = city; }

        /* Read the visitor's currently-checked category filters instead
           of assuming none are selected. getSelectedFilters() is a real
           public method (no underscore) mirroring the checkbox state --
           passing [] here would silently ignore an already-checked
           filter: the checkbox stays visibly checked while results
           quietly include everything. */
        var currentFilters = (typeof w._client.getSelectedFilters === 'function')
          ? w._client.getSelectedFilters()
          : [];

        broker.publishQuery({ address: city, source: 3, filters: currentFilters });
        return true;
      } catch (err) {
        console.warn('Store Locator: live search failed, falling back to link navigation', err);
        return false;
      }
    }

    function tryLiveClear() {
      try {
        if (!stockistReady) return false;
        var w = window.Stockist && window.Stockist.__widget;
        var service = w && w._client && w._client._service;
        if (!service || typeof service.all !== 'function') return false;

        var input = w._form && w._form._input;
        if (input) { input.value = ''; }

        var currentFilters = (typeof w._client.getSelectedFilters === 'function')
          ? w._client.getSelectedFilters()
          : [];

        service.all({ filters: currentFilters, source: 5 });
        return true;
      } catch (err) {
        console.warn('Store Locator: live clear failed, falling back to link navigation', err);
        return false;
      }
    }

    function setActivePill(link) {
      if (pillsList) {
        pillsList.querySelectorAll('.store-locator__pill.is-active').forEach(function (el) {
          el.classList.remove('is-active');
        });
      }
      if (link) link.classList.add('is-active');
      if (clearBtn) clearBtn.hidden = !link;
    }

    function scrollToAnchor() {
      if (!anchorId) return;
      var el = document.getElementById(anchorId);
      if (el && el.scrollIntoView) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    fetch('https://stockist.co/api/v1/' + encodeURIComponent(widgetTag) + '/locations/all')
      .then(function (r) { return r.json(); })
      .then(function (locations) {
        var byCity = {};
        locations.forEach(function (loc) {
          if (!loc.city) return;
          byCity[loc.city] = (byCity[loc.city] || 0) + 1;
        });

        var cityNames = Object.keys(byCity).sort(function (a, b) {
          return byCity[b] - byCity[a] || a.localeCompare(b);
        });

        if (statsAccountsEl) statsAccountsEl.textContent = locations.length;
        if (statsCitiesEl) statsCitiesEl.textContent = cityNames.length;

        if (pillsList) {
          var basePath = window.location.pathname;
          pillsList.innerHTML = cityNames.map(function (city) {
            var href = basePath + '?stockist-query=' + encodeURIComponent(city) +
              (anchorId ? '#' + anchorId : '');
            return '<li><a class="store-locator__pill" href="' + href + '" data-city="' +
              escapeHtml(city) + '">' + escapeHtml(city) + ' <b>' + byCity[city] + '</b></a></li>';
          }).join('');

          pillsList.addEventListener('click', function (e) {
            var link = e.target.closest('a.store-locator__pill');
            if (!link) return;
            var city = link.getAttribute('data-city');
            if (tryLiveSearch(city)) {
              e.preventDefault(); // stay on page, no reload
              setActivePill(link);
              scrollToAnchor();
            }
            // else: let the click proceed as a normal navigation to ?stockist-query=...
          });
        }

        if (clearBtn) {
          // Fallback href for when the live path isn't available: a plain
          // link back to the page with no ?stockist-query, which is
          // Stockist's own default "show everything" state on load.
          clearBtn.href = window.location.pathname + (anchorId ? '#' + anchorId : '');
          clearBtn.addEventListener('click', function (e) {
            if (tryLiveClear()) {
              e.preventDefault();
              setActivePill(null);
              scrollToAnchor();
            }
          });
        }
      })
      .catch(function (err) {
        console.error('Store Locator: failed to load Stockist locations', err);
      });
  }

  function initAll() {
    document.querySelectorAll('[data-store-locator]').forEach(initInstance);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  document.addEventListener('shopify:section:load', function (e) {
    var root = e.target.querySelector('[data-store-locator]');
    if (root) initInstance(root);
  });
})();
