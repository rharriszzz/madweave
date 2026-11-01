# Mac acceptance check

After the updated site is published, repeat this short check in **Safari,
Chrome, and Firefox** on your Mac. Automated Linux engine tests and Windows
browser checks complement this check; they do not replace the actual Mac builds.

1. Open <https://rharriszzz.github.io/madweave/editor.html>. Refresh if the
   Save Project and Open Project buttons are missing.
2. Change a pattern, size, spacing, and palette color. Recolor one strip and hide
   another; try a layer or direction toggle. Choose **Save Project**.
3. Find the downloaded `madweave-project.html` in Downloads and open it in the
   browser being tested. Confirm the design matches. Disconnect from the
   internet (or disable networking for the test) and confirm the editor still
   works, including the five pattern thumbnails.
4. Make another visible change and choose **Save Project** again. Open the new
   download and confirm that change survived. Your browser may add a number to
   the filename. Keep the newest copy, or rename copies to describe the designs.
5. Reconnect, return to the website, choose **Open Project**, and select the
   saved HTML file. Confirm the design and settings return and editing works.
6. If you have an old editable SVG saved with the original Firefox workflow,
   try **Open Project** with a copy of that file too. Preserve the original.
7. Choose **Export artwork as SVG**. Confirm the image has no editor controls.
   Save Project is the way to retain an editable copy.
8. Hide the SVG controls with **HB**, save, and reopen. Click HB again to reveal
   the controls. Try a keyboard Tab to the HTML Save/Open buttons and activate
   one with Return or Space.

For any failure, record the browser/version, whether you were on the website or
in a downloaded file, the step, and what happened. Keep the failing project file
so the state can be reproduced. There is no autosave or undo: save before
replacing a design or experimenting with pattern/size changes.
