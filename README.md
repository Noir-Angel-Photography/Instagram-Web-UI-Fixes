# Instagram-Web-UI-Fixes

This is a small collection of various fixes and improvements to Instagram's web UI. Check out my [Definitive(ish) Guide to How Instagram Handles Images](https://www.reddit.com/user/NoirAngelPhotography/comments/1j4hugh/a_definitiveish_guide_to_how_instagram_handles/) for more information about how Instagram works behind the scenes.

#### Disclaimer:
Please note that while I am a technically literate person, I am not a coder or software developer. These tools were developed with the use of Gemini AI, albeit with substantial direction and input from me.

## Included tools (so far):

### Instagram Image Quality Fix + Extras

This script prevents Instagram from using srcset attributes site-wide, ensuring that the *primary* image (see my guide linked above for an explanation of this terminaology) is always shown. An small "HD" badge has been added after the Like/Comment/Share buttons. If the badge is grey, this means that the primary image is already shown by default (in that specific part of the UI). If the badge is green, that means the script took action to remove the srcset attribute, thereby switching the image displayed to the primary. The script *should* be able to adapt if/when Instagram changes whether or not the primary is shown by default in any part of the UI, and if you see that the color of badges has changed in a certain part of the UI, this is an indication that such a change has taken place.

Hovering on the badge displays a tooltip over the badge which explains what it means. It also shows a small overlay over the image displaying the resolution and aspect ratio of the primary image. Finally, clicking on this badge opens the primary image in a lightbox view. There are buttons that allow you to quickly fit the image to your browser window or scale it 1:1 with your display's pixels. This view supports standard zoom gestures and is also fully touch-compatible for those using the site on mobile, or the PWA.

### Instagram Ghost Click Fix

This is the first of hopefully many quality-of-life fixes for anyone following my advice to use the Instagram PWA rather than the app. The web UI has a bug when using touch to navigate. If you open a post from someone's profile grid and attempt to tap outside of the post to return to the grid, tapping anywhere that shows the profile grid underneath will trigger a series of events that ends with you being returned to the Instagram homepage. This is quite annoying for navigating the site. This script simply blocks this from happening.

---
Everything below this point is still under construction.

## Recommended usage:
