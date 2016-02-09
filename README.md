Caleydo D3 Plugins
==================

## Selectioninfo

## Databrowser

Provides easy-to-setup browsing capabilities for caleydo-data.

### Add to your app

import module in your main.ts:
```javascript
import databrowser = require('../caleydo_d3/databrowser');
```

Add anchor element to your DOM:
```html
<div id="databrowser"></div>
```

Create the databrowser in your main.ts:
```javascript
databrowser.create(document.getElementById('databrowser'));
```

### Options

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




