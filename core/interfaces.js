/**
* @license
* Visual Blocks Editor
*
* Copyright 2012 Google Inc.
* https://developers.google.com/blockly/
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

/**
* @fileoverview Utility functions for handling objects.
* @author SoWIDE Lab - DIA University of Parma
*/
'use strict';

goog.provide('Blockly.Interfaces');

goog.require('Blockly.Blocks');
goog.require('Blockly.Workspace');
goog.require('goog.string');


/**
* Category to separate interface names from classes, variables and generated functions.
*/
Blockly.Interfaces.NAME_TYPE = 'INTERFACE';

/**
* Find all user-created interfaces.
* @param {!Blockly.Block|!Blockly.Workspace} root Root block or workspace.
* @return {!Array.<string>} Array of interface names.
*/
Blockly.Interfaces.allInterfaces = function(root) {
  var blocks = root.getAllBlocks();   // get all project blocks
  var faceList = [];                  // list of project interfaces
  for (var bl in blocks) {
    if (blocks[bl].getInterfaceDef) {     // if block is a Interface block
      var interfaceName = blocks[bl].getInterfaceDef();  // get interface name
      faceList.push(interfaceName);                 // push in list
    }
  }
  return faceList;
};

/**
* Ensure two identically-named interfaces don't exist.
* @param {string} name Proposed procedure name.
* @param {!Blockly.Block} block Block to disambiguate.
* @return {string} Non-colliding name.
*/
Blockly.Interfaces.findLegalName = function(name, block) {
  if (block.isInFlyout) {
    // Flyouts can have multiple objects called 'NewInterface'.
    return name;
  }
  while (!Blockly.Interfaces.isLegalName(name, block.workspace, block)) {
    // Collision with another object.
    var r = name.match(/^(.*?)(\d+)$/);
    if (!r) {
      name += '2';
    } else {
      name = r[1] + (parseInt(r[2], 10) + 1);
    }
  }
  return name;
};

/**
* Does this interface have a legal name?  Illegal names include names of
* interfaces already defined.
* @param {string} name The questionable name.
* @param {!Blockly.Workspace} workspace The workspace to scan for collisions.
* @param {Blockly.Block=} opt_exclude Optional block to exclude from
*     comparisons (one doesn't want to collide with oneself).
* @return {boolean} True if the name is legal.
*/
Blockly.Interfaces.isLegalName = function(name, workspace, opt_exclude) {
  var blocks = workspace.getAllBlocks();
  // Iterate through every block and check the name.
  for (var i = 0; i < blocks.length; i++) {
    if (blocks[i] == opt_exclude) {
      continue;
    }
    if (blocks[i].getInterfaceDef) {
      var faceName = blocks[i].getInterfaceDef();
      if (Blockly.Names.equals(faceName, name)) {
        return false;
      }
    }
  }
  return true;
};

/**
* Rename an interface.  Called by the editable field.
* @param {string} text The proposed new name.
* @return {string} The accepted name.
* @this {!Blockly.Field}
*/
Blockly.Interfaces.rename = function(text) {
  // Strip leading and trailing whitespace.  Beyond this, all names are legal.
  text = text.replace(/^[\s\xa0]+|[\s\xa0]+$/g, '');

  // Ensure two identically-named objects don't exist.
  text = Blockly.Interfaces.findLegalName(text, this.sourceBlock_);
  // Rename any interface block of this renamed interface.
  var blocks = this.sourceBlock_.workspace.getAllBlocks();
  for (var i = 0; i < blocks.length; i++) {
    if (blocks[i].renameInterface) {
      blocks[i].renameInterface(this.text_, text);
    }
  }
  return text;
};

/**
* Construct the blocks required by the flyout for the interface category.
* @param {!Blockly.Workspace} workspace The workspace contianing objects.
* @return {!Array.<!Element>} Array of XML block elements.
*/
Blockly.Interfaces.flyoutCategory = function(workspace) {
  var faceList = Blockly.Interfaces.allInterfaces(workspace);
  var xmlList = [];
  if (Blockly.Blocks['interfaces_set']) {
    var block = goog.dom.createDom('block');
    block.setAttribute('type', 'interfaces_set');
    block.setAttribute('gap', 16);
    xmlList.push(block);
  }
  for (var i = 0; i < faceList.length; i++) {
    if (Blockly.Blocks['interfaces_get']) {
      var block = goog.dom.createDom('block');
      block.setAttribute('type', 'interfaces_get');
      block.setAttribute('gap', 16);
      var field = goog.dom.createDom('field', null, faceList[i]);
      field.setAttribute('name', 'INTERFACE');
      block.appendChild(field);
      xmlList.push(block);
    }
  }
  return xmlList;
};
