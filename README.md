# tree-view-panes
Show open files / panes on the top of the tree view.

![screenshot](https://github.com/susisu/tree-view-panes/wiki/images/demo.gif)

## Notes
I recommend turning off "Auto Reveal" setting of the "tree-view" package,
because it moves the tree view up and down and this might be a bit annoying when
switching files from the tree view.

If you are using One Dark/Light theme, add the following snippet to your
`style.less` to fix a styling issue.

``` less
.tree-view::before {
  position: absolute !important;
}
```
