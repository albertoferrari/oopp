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
* @fileoverview Interface blocks for Blockly.
* @author SoWIDE Lab - DIA University of Parma
*/
'use strict';

// For validating variable and method names (avoid spaces or weird characters)
function isValidJavaName(str) {
  return /^([a-zA-Z_]([a-zA-Z0-9_]+)?)$/.test(str);
}

goog.provide('Blockly.Blocks.interfaces');
goog.require('Blockly.Blocks');


Blockly.Blocks['interfaces_get'] = {
  /**
  * Block for interface definition
  * @this Blockly.Block
  */
  init: function() {
    this.setHelpUrl(Blockly.Msg.OOP_HELPURL);
    this.setColour(OOPP_COL.interfaces_get);
    this.appendDummyInput()
    .appendField(this.id, 'INTERFACE');
    this.setOutput(true,'INTERFACE');
    this.setTooltip(Blockly.Msg.OOP_TOOLTIP_INTERFACE_GET);
    this.contextMenuMsg_ = Blockly.Msg.OOP_GET_CREATE_SET;
  },
  contextMenuType_: 'interfaces_set',

  getInterfaceCall: function() {
    // The NAME field is guaranteed to exist, null will never be returned.
    return /** @type {string} */ (this.getFieldValue('INTERFACE'));
  },
  /**
  * Notification that a object is renaming.
  * If the name matches this block's object, rename it.
  * @param {string} oldName Previous name of object.
  * @param {string} newName Renamed object.
  * @this Blockly.Block
  */
  renameInterface: function(oldName, newName) {
    if (Blockly.Names.equals(oldName, this.getInterfaceCall())) {
      this.setFieldValue(newName, 'INTERFACE');
      this.setTooltip(Blockly.Msg.OOP_INTERFACE_RENAME.replace('%1', newName));
    }
  },
  /**
  * Create XML to represent the (non-editable) name.
  * @return {!Element} XML storage element.
  * @this Blockly.Block
  */
  mutationToDom: function() {
    var container = document.createElement('mutation');
    container.setAttribute('name', this.getInterfaceCall());

    return container;
  },
  /**
  * Parse XML to restore the (non-editable) name and parameters.
  * @param {!Element} xmlElement XML storage element.
  * @this Blockly.Block
  */
  domToMutation: function(xmlElement) {
    var name = xmlElement.getAttribute('name');
    this.renameInterface(this.getInterfaceCall(), name);

  },
};

Blockly.Blocks['interfaces_set'] = {
  /**
  * Block for interface element
  * @this Blockly.Block
  */
  init: function() {
    var nameField = new Blockly.FieldTextInput(
      Blockly.Msg.OOP_INTERFACE_DEFAULT_NAME,
      Blockly.Interfaces.rename);
    this.appendDummyInput('INTERFACE_NAME')
    .appendField(Blockly.Msg.OOP_INTERFACE)
    .appendField(nameField, "INTERFACE")

    this.appendDummyInput()
    .appendField(Blockly.Msg.OOP_LIB)
    .appendField(new Blockly.FieldCheckbox('FALSE'), 'LIB');

    this.setMutator(new Blockly.Mutator([
      'classes_mutatorinterface',
      'classes_mutatorpackage'
    ]));
    if (Blockly.Msg.OOP_DESCRIBEINTERFACE) {
      this.setCommentText(Blockly.Msg.OOP_DESCRIBEINTERFACE + '\n' + Blockly.Msg.OOP_AUTHORCOMMENT);
    }
    this.appendStatementInput("CONSTANTS")
    .setCheck("CONSTANT")
    .appendField(Blockly.Msg.OOP_CONSTANT);
    this.appendStatementInput("METHODS")
    .setCheck("METHOD")
    .appendField(Blockly.Msg.OOP_METHOD);
    this.setInputsInline(true);
    this.setColour(OOPP_COL.interfaces_set);
    this.setTooltip(Blockly.Msg.OOP_TOOLTIP_INTERFACE_SET);
    this.setHelpUrl(Blockly.Msg.OOP_HELPURL);
    this.extendsCount = 0;      // Extended interfaces
    //this.hasField_ = null;
    this.packageCount = 0;    // If the package is specified
  },
  contextMenuType_: 'interfaces_get',
  getInterfaceDef: function() {
    return this.getFieldValue('INTERFACE');
  },

  /**
  * Modify this block to get a interface to extend.
  * @private
  * @this Blockly.Block
  */
  updateShape_: function() {
    // Handle package mutation
    if (this.packageCount > 0 && !this.getInput('INSERT_PACKAGE')) {
      // If package specified and block not present, add it
      this.appendDummyInput('INSERT_PACKAGE')
      .appendField(Blockly.Msg.OOP_PACKAGE) // this title appears in the class, not in the mutator stack
      .appendField(new Blockly.FieldTextInput(Blockly.Msg.OOP_MUTATORPACKAGE_DEFAULT), 'PACKAGE');
      this.setInputsInline(true);
      this.moveInputBefore('INSERT_PACKAGE', null); // Add after extends and implements
    } else if (this.packageCount == 0 && this.getInput('INSERT_PACKAGE')) {
      // No package but field present? Remove it!
      this.removeInput('INSERT_PACKAGE');
    }

    // Handle extends mutation
    if (this.getInput('EXTENDS_INTERFACE') && !this.extendsCount) {
      this.removeInput('EXTENDS_INTERFACE');
    }
    for (var i = 0; i < this.extendsCount; i++) {
      if (i==0 && !this.getInput('EXTENDS_INTERFACE')) {
        this.appendDummyInput('EXTENDS_INTERFACE')
        .appendField(Blockly.Msg.OOP_MUTATORCONTAINER_TITLE);
        this.setInputsInline(true);
        this.moveInputBefore('EXTENDS_INTERFACE','CONSTANTS');
      }
      if (!this.getInput('ADD' + i)) {
        this.appendValueInput('ADD' + i)
        .setCheck('INTERFACE');
        this.moveInputBefore('ADD' + i,'CONSTANTS');
        this.setInputsInline(true);
      }
    }
    while (this.getInput('ADD' + i)) {
      this.removeInput('ADD' + i); // Remove deleted inputs
      i++;
    }
  },

  /**
  * Create XML to represent the argument inputs.
  * @return {!Element} XML storage element.
  * @this Blockly.Block
  */
  mutationToDom: function() {
    var container = document.createElement('mutation');
    container.setAttribute('extends', this.extendsCount);
    container.setAttribute('package', this.packageCount);

    return container;
  },

  /**
  * Parse XML to restore the argument inputs.
  * @param {!Element} xmlElement XML storage element.
  * @this Blockly.Block
  */
  domToMutation: function(xmlElement) {
    this.extendsCount = parseInt(xmlElement.getAttribute('extends'), 10);
    this.packageCount = parseInt(xmlElement.getAttribute('package'), 10);
    this.updateShape_();
  },

  /**
  *
  */
  decompose: function(workspace) {
    var containerBlock = workspace.newBlock('objects_mutatorcontainer2');
    containerBlock.initSvg();

    var connection = containerBlock.getInput('STACK_INTERFACE').connection;
    var connection3 = containerBlock.getInput('STACK_PACKAGE').connection;

    for (var i = 0; i < this.extendsCount; i++) {
      var itemBlock = workspace.newBlock('objects_mutatorinterface2');
      itemBlock.initSvg();
      connection.connect(itemBlock.previousConnection);
    }

    if (this.packageCount) {
      var packageBlock = workspace.newBlock('classes_mutatorpackage');
      packageBlock.initSvg();
      connection3.connect(packageBlock.previousConnection);
    }

    return containerBlock;
  },

  /**
  *
  */
  compose: function(containerBlock) {
    this.extendsCount = 0;
    this.packageCount = 0;
    var connections = [];
    var packageStatementConnection = null;
    var itemBlock = containerBlock.getInputTargetBlock('STACK_INTERFACE');
    var packageBlock = containerBlock.getInputTargetBlock('STACK_PACKAGE');

    while (itemBlock) {
      connections.push(itemBlock.statementConnection_);
      itemBlock = itemBlock.nextConnection &&
      itemBlock.nextConnection.targetBlock();
    }

    if (packageBlock) {
      this.packageCount++;
      packageStatementConnection = packageBlock.valueConnection_;
      packageBlock = packageBlock.nextConnection &&
      packageBlock.nextConnection.targetBlock();
    }

    this.extendsCount = connections.length;

    this.updateShape_();
    // Reconnect any child blocks.
    for (var i = 0; i < this.extendsCount; i++) {
      Blockly.Mutator.reconnect(connections[i], this, 'ADD' + i);
    }
    Blockly.Mutator.reconnect(packageStatementConnection, this, 'INSERT_PACKAGE');
  },

  customContextMenu: Blockly.Blocks['interfaces_get'].customContextMenu,

  onchange: function(changeEvent) {

    // Validate input for correct variable name
    if (!(changeEvent.type == 'change')) return;
    if (this.id === changeEvent.blockId) {
      if (changeEvent.name == "INTERFACE") {
        if (isValidJavaName(changeEvent.newValue)) {
          this.setWarningText(null);
        } else {
          this.setWarningText(Blockly.Msg.OOP_ERROR_INVALIDNAME);
        }
      }
      if (changeEvent.name == "PACKAGE") {
        if (isValidJavaPackageName(changeEvent.newValue)) {
          this.setWarningText(null);
        } else {
          this.setWarningText(Blockly.Msg.OOP_ERROR_INVALIDPACKAGENAME);
        }
      }
    }
  }
};

Blockly.Blocks['objects_mutatorcontainer2'] = {
  /**
  * Mutator block for interface container.
  * @this Blockly.Block
  */
  init: function() {
    this.setColour(OOPP_COL.objects_mutatorcontainer2);

    this.appendDummyInput()
    .appendField(Blockly.Msg.OOP_MUTATORCONTAINER_TITLE);
    this.appendStatementInput('STACK_INTERFACE')
    .setCheck('MUTATORINTERFACE');

    this.appendDummyInput()
    .appendField(Blockly.Msg.OOP_MUTATORPACKAGE_TITLE);
    this.appendStatementInput('STACK_PACKAGE')
    .setCheck('MUTATORPACKAGE');

    this.setTooltip(Blockly.Msg.OOP_CREATE_WITH_CONTAINER_TOOLTIP_INTERFACE);
    this.contextMenu = false;
  }
};

Blockly.Blocks['objects_mutatorinterface2'] = {
  /**
  * Mutator bolck for adding interfaces.
  * @this Blockly.Block
  */
  init: function() {
    this.setColour(OOPP_COL.objects_mutatorinterface2);
    this.appendDummyInput()
    .appendField(Blockly.Msg.OOP_INTERFACE);
    this.setPreviousStatement(true,"MUTATORINTERFACE");
    this.setNextStatement(true,"MUTATORINTERFACE");
    this.setTooltip(Blockly.Msg.OOP_CREATE_WITH_INTERFACE_TOOLTIP_INTERFACE);
    this.contextMenu = false;
  }
};

Blockly.Blocks['objects_mutatorpackage2'] = {
  /**
  * Mutator bolck for adding interfaces.
  * @this Blockly.Block
  */
  init: function() {
    this.setColour(OOPP_COL.objects_mutatorpackage2);
    this.appendDummyInput()
    .appendField(Blockly.Msg.OOP_PACKAGE);
    this.setPreviousStatement(true,"MUTATORPACKAGE");
    this.setNextStatement(true,"MUTATORPACKAGE");
    this.setTooltip(Blockly.Msg.OOP_CREATE_WITH_PACKAGE_TOOLTIP);
    this.contextMenu = false;
  }
};

Blockly.Blocks['object_constant'] = {
  /**
  * Block for object constant.
  * @this Blockly.Block
  */
  init: function() {
    this.appendDummyInput('CONSTANT')
    .appendField(Blockly.Msg.OOP_CONSTANT_NAME)
    .appendField(new Blockly.FieldTextInput(""), "CONSTANT_NAME");
    this.appendValueInput('TYPE')
    .setCheck(['TYPE','CLASS'])
    .appendField(Blockly.Msg.OOP_TYPE);
    this.appendDummyInput()
    .appendField(Blockly.Msg.OOP_CONSTANT_VALUE)
    .appendField(new Blockly.FieldTextInput(""), 'VALUE');
    this.setInputsInline(true);
    this.setPreviousStatement(true, "CONSTANT");
    this.setNextStatement(true, "CONSTANT");
    this.setColour(OOPP_COL.object_constant);
    this.setTooltip(Blockly.Msg.OOP_TOOLTIP_CONSTANT);
    this.setHelpUrl(Blockly.Msg.OOP_HELPURL);
  },

  onchange: function(changeEvent) {
    // Validate input for correct variable name
    if (!(changeEvent.type == 'change')) return;
    if (this.id === changeEvent.blockId) {
      if (changeEvent.name == "CONSTANT_NAME") {
        if (isValidJavaName(changeEvent.newValue)) {
          this.setWarningText(null);
        } else {
          this.setWarningText(Blockly.Msg.OOP_ERROR_INVALIDNAME);
        }
      }
    }
  }
};

Blockly.Blocks['object_string'] = {
  /**
  * Block for object constant.
  * @this Blockly.Block
  */
  init: function() {
    this.setHelpUrl(Blockly.Msg.OOP_HELPURL);
    this.setColour(OOPP_COL.object_string);
    this.appendDummyInput()
    .appendField(Blockly.Msg.OOP_STRING, 'CLASS');
    this.setOutput(true,'CLASS');
    //this.setTooltip(Blockly.Msg.OOP_TOOLTIP_GET_INTERFACE);
    //this.contextMenuMsg_ = Blockly.Msg.OOP_GET_CREATE_SET;
  },
};
