# tree-view-panes
Show list of open panes and files on the top of the tree view.

![screenshot](https://github.com/susisu/tree-view-panes/wiki/images/demo.gif)

This package aims to provide an alternative to the functionality of tabs.

## Features
* Show list of open panes and files on the tree view
* All I wanted but other similar packages lacked
    - Intuitive pane ordering
    - Hiding pending items
    - Moving items by drag and drop
    - Context menus
    - File icons
    - Git statuses
    - etc.

## Styles
There are some theme-specific styling issues since this package is not official
one and most of (maybe all) theme packages do not have any support.

Those problems cannot be solved in a generic way (as far as I know), however,
there are patches prepared for some themes to fix them.
Visit [tree-view-panes style patches collection](https://github.com/susisu/tree-view-panes-styles)
repository and try one out.

## Notes
I recommend turning off "Auto Reveal" setting of the "tree-view" package,
because it moves the tree view up and down and this might be a bit annoying when
switching files from the tree view.
