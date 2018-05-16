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
* @fileoverview Utility functions for handling classes.
* @author SoWIDE Lab - DIA University of Parma
*/
'use strict';

goog.provide('Blockly.Classes');

goog.require('Blockly.Blocks');
goog.require('Blockly.Workspace');
goog.require('goog.string');


/**
* Category to separate class names from interfaces, variables and generated functions.
*/
Blockly.Classes.NAME_TYPE = 'CLASS';

/**
* Find all user-created classes.
* @param {!Blockly.Block|!Blockly.Workspace} root Root block or workspace.
* @return {!Array.<string>} Array of class names.
*/
Blockly.Classes.allClasses = function(root) {
  var blocks = root.getAllBlocks();   // get all project blocks
  var classList = [];                 // list of project classes
  for (var bl in blocks) {
    if (blocks[bl].getClassDef) {     // if block is a Class block
      var className = blocks[bl].getClassDef();  // get class name
      classList.push(className);                 // push in list
    }
  }
  return classList;
};

/**
* Ensure two identically-named classes don't exist.
* @param {string} name Proposed procedure name.
* @param {!Blockly.Block} block Block to disambiguate.
* @return {string} Non-colliding name.
*/
Blockly.Classes.findLegalName = function(name, block) {
  if (block.isInFlyout) {
    // Flyouts can have multiple objects called 'NewClass'.
    return name;
  }
  while (!Blockly.Classes.isLegalName(name, block.workspace, block)) {
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
* Does this class have a legal name?  Illegal names include names of
* classes already defined.
* @param {string} name The questionable name.
* @param {!Blockly.Workspace} workspace The workspace to scan for collisions.
* @param {Blockly.Block=} opt_exclude Optional block to exclude from
*     comparisons (one doesn't want to collide with oneself).
* @return {boolean} True if the name is legal.
*/
Blockly.Classes.isLegalName = function(name, workspace, opt_exclude) {
  var blocks = workspace.getAllBlocks();
  // Iterate through every block and check the name.
  for (var i = 0; i < blocks.length; i++) {
    if (blocks[i] == opt_exclude) {
      continue;
    }
    if (blocks[i].getClassDef) {
      var className = blocks[i].getClassDef();
      if (Blockly.Names.equals(className, name)) {
        return false;
      }
    }
  }
  return true;
};

/**
* Rename a class.  Called by the editable field.
* @param {string} text The proposed new name.
* @return {string} The accepted name.
* @this {!Blockly.Field}
*/
Blockly.Classes.rename = function(text) {
  // Strip leading and trailing whitespace.  Beyond this, all names are legal.
  text = text.replace(/^[\s\xa0]+|[\s\xa0]+$/g, '');
  // Ensure two identically-named classes don't exist.
  text = Blockly.Classes.findLegalName(text, this.sourceBlock_);
  // Rename any class block of this renamed class.
  var blocks = this.sourceBlock_.workspace.getAllBlocks();
  for (var i = 0; i < blocks.length; i++) {
    if (blocks[i].renameClass) {
      blocks[i].renameClass(this.text_, text);
    }
  }
  return text;
};

/**
* Construct the blocks required by the flyout for the class category.
* @param {!Blockly.Workspace} workspace The workspace contianing classes.
* @return {!Array.<!Element>} Array of XML block elements.
*/
Blockly.Classes.flyoutCategory = function(workspace) {
  var classList = Blockly.Classes.allClasses(workspace);
  var xmlList = [];
  if (Blockly.Blocks['classes_set']) {
    var block = goog.dom.createDom('block');
    block.setAttribute('type', 'classes_set');
    block.setAttribute('gap', 16);
    xmlList.push(block);
  }
  for (var i = 0; i < classList.length; i++) {
    if (Blockly.Blocks['classes_get']) {
      var block = goog.dom.createDom('block');
      block.setAttribute('type', 'classes_get');
      block.setAttribute('gap', 16);
      var field = goog.dom.createDom('field', null, classList[i]);
      field.setAttribute('name', 'CLASS');
      block.appendChild(field);
      xmlList.push(block);
    }
  }
  return xmlList;
};
