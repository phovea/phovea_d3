phovea_d3 [![Phovea][phovea-image]][phovea-url] [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url]
=====================

This plugin provides several D3 modules and applications, such as: selection info, data browser, visual links between views.

Installation
------------

```
git clone https://github.com/phovea/phovea_d3.git
cd phovea_d3
npm install
```

Testing
-------

```
npm test
```

Building
--------

```
npm run build
```

Usage
------------

### Selectioninfo

### Databrowser

Provides easy-to-setup browsing capabilities for caleydo-data.

#### Add to your app

import module in your main.ts:
```javascript
import databrowser = require('phovea_d3/databrowser');
```

Add anchor element to your DOM:
```html
<div id="databrowser"></div>
```

Create the databrowser in your main.ts:
```javascript
databrowser.create(document.getElementById('databrowser'));
```

#### Options

```javascript
databrowser.create(document.getElementById('databrowser'), {
      layout: 'tree',
      draggable: true,
      filter: function(d) { 
        // filter out all the datasets that don't have "Test" in the description!
        return (d && d.desc.name.indexOf("Test") > -1);
      }
    });
```

| Name | Values |
| -----| ------ |
| layout | tree, list |
| draggable | true, false |
| filter | provide a callback function! |

***

<a href="https://caleydo.org"><img src="http://caleydo.org/assets/images/logos/caleydo.svg" align="left" width="200px" hspace="10" vspace="6"></a>
This repository is part of **[Phovea](http://phovea.caleydo.org/)**, a platform for developing web-based visualization applications. For tutorials, API docs, and more information about the build and deployment process, see the [documentation page](http://caleydo.org/documentation/).


[phovea-image]: https://img.shields.io/badge/Phovea-Client%20Plugin-F47D20.svg
[phovea-url]: https://phovea.caleydo.org
[npm-image]: https://badge.fury.io/js/phovea_d3.svg
[npm-url]: https://npmjs.org/package/phovea_d3
[travis-image]: https://travis-ci.org/phovea/phovea_d3.svg?branch=master
[travis-url]: https://travis-ci.org/phovea/phovea_d3
[daviddm-image]: https://david-dm.org/phovea/phovea_d3.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/phovea/phovea_d3
