/* *****************************************************************************
 * Caleydo - Visualization for Molecular Biology - http://caleydo.org
 * Copyright (c) The Caleydo Team. All rights reserved.
 * Licensed under the new BSD license, available at http://caleydo.org/license
 **************************************************************************** */

//register all extensions in the registry following the given pattern
module.exports = function(registry) {
  //registry.push('extension-type', 'extension-id', function() { return System.import('./src/extension_impl'); }, {});

  registry.push('autoload', 'caleydo_links', function() { return System.import('./src/link_renderer'); }, {});

  registry.push('link-representation', 'link-block', function() { return System.import('./src/link_representation'); }, {
  'name': 'Block Link Representation',
  'factory': 'createBlockRep',
  'granularity': 0
 });

  registry.push('link-representation', 'link-group', function() { return System.import('./src/link_representation'); }, {
  'name': 'Group Link Representation',
  'factory': 'createGroupRep',
  'granularity': 5
 });

  registry.push('link-representation', 'link-item', function() { return System.import('./src/link_representation'); }, {
  'name': 'Item Link Representation',
  'factory': 'createItemRep',
  'granularity': 10
 });
};

