# The Online PE Explorer

This is the source code for the online parameter estimation results plotter developed by Daniel Williams at the Institute for Gravitational Research at the University of Glasgow.

It's still very much a work in progress, but you can visit it [here](https://transientlunatic.github.io/gw-data-viewer/).

ALl of the plotting code runs locally on your own machine, and no data is shared back to a server.

## Loading files

You can load a file from your machine using the browse button in the header.

You can also load a web-accessible file by appending a `metafileurl` argument to the end of the url, e.g. 

```
https://transientlunatic.github.io/gw-data-viewer/?metafileurl=https://zenodo.org/api/records/14537407/files/IGR-BeyondGWTC3-v2-GW151216_092416_PEDataRelease.h5/content
```
which will plot a file from the Beyond GWTC-3 data release.
