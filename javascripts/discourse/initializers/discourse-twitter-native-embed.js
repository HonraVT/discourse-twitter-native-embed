import { withPluginApi } from "discourse/lib/plugin-api";

export default {
  name: "discourse-twitter-native-embed",
  initialize() {
    withPluginApi("1.0.0", (api) => {
      function ensureTwitterWidgets(targetElement) {
        // If the script is already present
        const existing = document.querySelector('script[src^="https://platform.twitter.com/widgets.js"]');
        if (existing) {
          if (window.twttr?.widgets?.load) {
            window.twttr.widgets.load(targetElement);
          } else {
            existing.addEventListener(
              "load",
              () => window.twttr?.widgets?.load(targetElement),
              { once: true }
            );
          }
          return;
        }

        // Add the script if missing
        const s = document.createElement("script");
        s.async = true;
        s.src = "https://platform.twitter.com/widgets.js";
        s.charset = "utf-8";
        s.onload = () => window.twttr?.widgets?.load(targetElement);
        document.head.appendChild(s);
      }

      api.decorateCookedElement(
        (el) => {
          // Avoid running multiple times on the same element
          if (el.dataset.twitterEmbedded === "true") return;
          el.dataset.twitterEmbedded = "true";

          let found = false;

          const anchors = el.querySelectorAll('a[href*="/status/"], a[href*="/i/web/status/"]');
          anchors.forEach((link) => {
            if (link.dataset.twitterEmbedded === "true") return; // skip if already done
            link.dataset.twitterEmbedded = "true";

            try {
              const parsed = new URL(link.href, window.location.origin);
              parsed.hostname = "twitter.com";
              const tweetUrl = parsed.toString();

              // Avoid creating duplicate embeds for the same tweet
              if (el.querySelector(`blockquote.twitter-tweet a[href="${tweetUrl}"]`)) return;

              const blockquote = document.createElement("blockquote");
              blockquote.classList.add("twitter-tweet");

              const a = document.createElement("a");
              a.href = tweetUrl;
              a.rel = "nofollow";
              blockquote.appendChild(a);

              link.replaceWith(blockquote);
              found = true;
              console.log("twitter-native-embed: embedded", tweetUrl);
            } catch (err) {
              console.error("twitter-native-embed: failed to embed", link.href, err);
            }
          });

          if (found) ensureTwitterWidgets(el);
        },
        {
          id: "discourse-twitter-native-embed",
          afterAdopt: true,
          onlyStream: true,
        }
      );
    });
  },
};
