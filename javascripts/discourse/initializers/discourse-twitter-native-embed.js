import { withPluginApi } from "discourse/lib/plugin-api";

export default {
  name: "discourse-twitter-native-embed",
  initialize() {
    withPluginApi("1.0.0", (api) => {
      function ensureTwitterWidgets(targetElement) {
        const existing = document.querySelector('script[src^="https://platform.twitter.com/widgets.js"]');
        if (existing) {
          // If script already present, try to load widgets for the new element
          if (window.twttr?.widgets?.load) {
            try {
              window.twttr.widgets.load(targetElement);
            } catch (e) {
              console.error("twttr.widgets.load error:", e);
            }
          } else {
            // script present but not ready yet: call load when it finishes loading
            existing.addEventListener("load", () => {
              try { window.twttr?.widgets?.load(targetElement); } catch (e) { console.error(e); }
            }, { once: true });
          }
          return;
        }

        // If not present, add the script and call load on onload
        const s = document.createElement("script");
        s.async = true;
        s.src = "https://platform.twitter.com/widgets.js";
        s.charset = "utf-8";
        s.onload = () => {
          try { window.twttr?.widgets?.load(targetElement); } catch (e) { console.error(e); }
        };
        document.head.appendChild(s);
      }

      api.decorateCookedElement((el) => {
        let found = false;

        // Be permissive: select anchors that look like tweet URLs (cover /status/ and /i/web/status/)
        const anchors = el.querySelectorAll('a[href*="/status/"], a[href*="/i/web/status/"]');

        anchors.forEach((link) => {
          try {
            // canonicalize host -> twitter.com
            const parsed = new URL(link.href, window.location.origin);
            parsed.hostname = "twitter.com";
            const tweetUrl = parsed.toString();

            // build blockquote expected by widgets.js
            const blockquote = document.createElement("blockquote");
            blockquote.classList.add("twitter-tweet");

            const a = document.createElement("a");
            a.href = tweetUrl;
            a.rel = "nofollow";
            blockquote.appendChild(a);

            // replace the original link (or insert after, if you prefer)
            link.replaceWith(blockquote);

            found = true;
            console.log("twitter-native-embed: replaced", link.href, "→", tweetUrl);
          } catch (err) {
            console.error("twitter-native-embed: failed to handle link", link.href, err);
          }
        });

        if (found) {
          ensureTwitterWidgets(el);
        }
      }, {
        id: "discourse-twitter-native-embed",
        afterAdopt: true,
        onlyStream: true,
      });
    });
  },
};
