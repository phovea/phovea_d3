Caleydo D3 ![Caleydo Web Client Plugin](https://img.shields.io/badge/Caleydo%20Web-Client%20Plugin-F47D20.svg)
==================

This plugin provides several D3 modules and applications, such as: selection info, data browser, visual links between views.

Installation
------------

[Set up a virtual machine using Vagrant](http://www.caleydo.org/documentation/vagrant/) and run these commands inside the virtual machine:

```bash
./manage.sh clone Caleydo/caleydo_d3
./manage.sh resolve
```

If you want this plugin to be dynamically resolved as part of another application of plugin, you need to add it as a peer dependency to the _package.json_ of the application or plugin it should belong to:

```json
{
  "peerDependencies": {
    "caleydo_d3": "*"
  }
}
```

Usage
------------

### Selectioninfo

### Databrowser

Provides easy-to-setup browsing capabilities for caleydo-data.

#### Add to your app

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
This repository is part of **[Caleydo Web](http://caleydo.org/)**, a platform for developing web-based visualization applications. For tutorials, API docs, and more information about the build and deployment process, see the [documentation page](http://caleydo.org/documentation/).
