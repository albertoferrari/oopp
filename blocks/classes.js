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
* @fileoverview Class blocks for Blockly.
* @author SoWIDE Lab - DIA University of Parma
*/
'use strict';

// For validating variable and method names (avoid spaces or weird characters)
function isValidJavaName(str) {
  return /^([a-zA-Z_]([a-zA-Z0-9_]+)?)$/.test(str);
}
// For validating package name format
function isValidJavaPackageName(str) {
  return /^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+[0-9a-z_]$/.test(str);
}

goog.provide('Blockly.Blocks.classes');
goog.require('Blockly.Blocks');

/**
 * The classes_get block refers to already defined classes, which are then pluggable into
 * other sockets, they contain only the class name. It's the small puzzle piece with the class name
 */
Blockly.Blocks['classes_get'] = {
  /**
  * Block for class getter.
  * @this Blockly.Block
  */
  init: function() {
    this.setHelpUrl(Blockly.Msg.OOP_HELPURL);
    this.setColour(OOPP_COL.classes_get);
    this.appendDummyInput()
    .appendField(this.id, 'CLASS');
    this.setOutput(true,'CLASS');
    this.setTooltip(Blockly.Msg.OOP_TOOLTIP_CLASS_GET);
    this.contextMenuMsg_ = Blockly.Msg.OOP_GET_CREATE_SET;
  },
  contextMenuType_: 'classes_set',

  getClassCall: function() {
    // The NAME field is guaranteed to exist, null will never be returned.
    return /** @type {string} */ (this.getFieldValue('CLASS'));
  },
  /**
  * Notification that a class is renaming.
  * If the name matches this block's object, rename it.
  * @param {string} oldName Previous name of object.
  * @param {string} newName Renamed object.
  * @this Blockly.Block
  */
  renameClass: function(oldName, newName) {
    if (Blockly.Names.equals(oldName, this.getClassCall())) {
      this.setFieldValue(newName, 'CLASS');
      this.setTooltip(Blockly.Msg.OOP_CLASS_RENAME.replace('%1', newName));
    }
  },
  /**
  * Create XML to represent the (non-editable) name.
  * @return {!Element} XML storage element.
  * @this Blockly.Block
  */
  mutationToDom: function() {
    var container = document.createElement('mutation');
    container.setAttribute('name', this.getClassCall());
    return container;
  },
  /**
  * Parse XML to restore the (non-editable) name.
  * @param {!Element} xmlElement XML storage element.
  * @this Blockly.Block
  */
  domToMutation: function(xmlElement) {
    var name = xmlElement.getAttribute('name');
    // var package = xmlElement.getAttribute('package');
    this.renameClass(this.getClassCall(), name);
  },
};

/**
 * The classes_set block refers to the class definition, so with fields, mutators and so on
 */
Blockly.Blocks['classes_set'] = {
  /**
  * Block for class definition. Called on instantiation
  * @this Blockly.Block
  */
  init: function() {
    // Class name
    var nameField = new Blockly.FieldTextInput(
      Blockly.Msg.OOP_DEFAULTCLASSNAME,
      Blockly.Classes.rename);
    this.appendDummyInput('CLASS_NAME')
    .appendField(Blockly.Msg.OOP_CLASS)
    .appendField(nameField, "CLASS")

    this.appendDummyInput()
    .appendField(Blockly.Msg.OOP_LIB)
    .appendField(new Blockly.FieldCheckbox('FALSE'), 'LIB');

    // Set the class mutators (left blocks in mutator view)
    this.setMutator(new Blockly.Mutator([
      'classes_mutatorclass',
      'classes_mutatorinterface',
      'classes_mutatorpackage'
      ]));

    // Comment
    if (Blockly.Msg.OOP_DESCRIBECLASS) {
      this.setCommentText(Blockly.Msg.OOP_DESCRIBECLASS + '\n' + Blockly.Msg.OOP_AUTHORCOMMENT);
    }

    // Fields, constructors, methods
    this.appendStatementInput("FIELDS")
    .setCheck("FIELD")
    .appendField(Blockly.Msg.OOP_FIELD);
    this.appendStatementInput("CONSTRUCTORS")
    .setCheck("CONSTRUCTOR")
    .appendField(Blockly.Msg.OOP_CONSTRUCTOR);
    this.appendStatementInput("METHODS")
    .setCheck("METHOD")
    .appendField(Blockly.Msg.OOP_METHOD);

    this.setCollapsed(false);
    this.setInputsInline(true);
    this.setColour(OOPP_COL.classes_set);
    this.setTooltip(Blockly.Msg.OOP_TOOLTIP_CLASS_SET);
    this.setHelpUrl(Blockly.Msg.OOP_HELPURL);
    this.extendsCount = 0;      // If the extended classe is specified
    this.interfaceCount = 0;  // Number of implemented interfaces
    this.packageCount = 0;    // If the package is specified
  },

  contextMenuType_: 'classes_get',

  getClassDef: function() {
    return (this.getFieldValue('CLASS'));
  },

  getID: function() {
    return Blockly.mainWorkspace.getBlockById(this.id);
  },

  /**
  * Modify this block to get a class to extend or an interface to implement. Adds the "sockets"
  * next to the class title. Also used to set the package name
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
    if (this.extendsCount > 0 && !this.getInput('INSERT_CLASS')) {
      this.appendValueInput('INSERT_CLASS')
      .appendField(Blockly.Msg.OOP_MUTATORCONTAINER_TITLE)
      .setCheck('CLASS');
      this.setInputsInline(true);
      if (this.getInput('IMPLEMENTS_INTERFACE')) {
        this.moveInputBefore('INSERT_CLASS','IMPLEMENTS_INTERFACE');
      } else {
        this.moveInputBefore('INSERT_CLASS','FIELDS');
      }
    } else if (this.extendsCount == 0 && this.getInput('INSERT_CLASS')) {
      this.removeInput('INSERT_CLASS');
    }

    // Handle implements mutation
    if (this.getInput('IMPLEMENTS_INTERFACE') && !this.interfaceCount) {
      this.removeInput('IMPLEMENTS_INTERFACE');
    }
    for (var i = 0; i < this.interfaceCount; i++) {
      if (i==0 && !this.getInput('IMPLEMENTS_INTERFACE')) {
        this.appendDummyInput('IMPLEMENTS_INTERFACE')
        .appendField(Blockly.Msg.OOP_MUTATORINTERFACE_TITLE);
        this.setInputsInline(true);
        this.moveInputBefore('IMPLEMENTS_INTERFACE','FIELDS');
      }
      if (!this.getInput('ADD' + i)) {
        this.appendValueInput('ADD' + i)
        .setCheck('INTERFACE');
        this.moveInputBefore('ADD' + i,'FIELDS');
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
    container.setAttribute('implements', this.interfaceCount);
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
    this.interfaceCount = parseInt(xmlElement.getAttribute('implements'), 10);
    this.extendsCount = parseInt(xmlElement.getAttribute('extends'), 10);
    this.packageCount = parseInt(xmlElement.getAttribute('package'), 10);
    this.updateShape_();
  },

  /**
  * Found undocumented
  */
  decompose: function(workspace) {
    var containerBlock = workspace.newBlock('classes_mutatorcontainer');
    containerBlock.initSvg();

    // Attaches blocks to containers
    var connection = containerBlock.getInput('STACK_INTERFACE').connection;
    var connection2 = containerBlock.getInput('STACK_CLASS').connection;
    var connection3 = containerBlock.getInput('STACK_PACKAGE').connection;

    for (var i = 0; i < this.interfaceCount; i++) {
      var itemBlock = workspace.newBlock('classes_mutatorinterface');
      itemBlock.initSvg();
      connection.connect(itemBlock.previousConnection);
    }

    if (this.extendsCount) {
      var classBlock = workspace.newBlock('classes_mutatorclass');
      classBlock.initSvg();
      connection2.connect(classBlock.previousConnection);
    }

    if (this.packageCount) {
      var packageBlock = workspace.newBlock('classes_mutatorpackage');
      packageBlock.initSvg();
      connection3.connect(packageBlock.previousConnection);
    }

    return containerBlock;
  },

  /**
  * Found undocumented
  */
  compose: function(containerBlock) {
    this.extendsCount = 0;
    this.interfaceCount = 0;
    this.packageCount = 0;
    var classStatementConnection = null;
    var packageStatementConnection = null;
    var connections = [];
    var itemBlock = containerBlock.getInputTargetBlock('STACK_INTERFACE');
    var classBlock = containerBlock.getInputTargetBlock('STACK_CLASS');
    var packageBlock = containerBlock.getInputTargetBlock('STACK_PACKAGE');

    if (classBlock) {
      this.extendsCount++;
      classStatementConnection = classBlock.valueConnection_;
      classBlock = classBlock.nextConnection &&
      classBlock.nextConnection.targetBlock();
    }

    if (packageBlock) {
      this.packageCount++;
      packageStatementConnection = packageBlock.valueConnection_;
      packageBlock = packageBlock.nextConnection &&
      packageBlock.nextConnection.targetBlock();
    }

    while (itemBlock) {
      connections.push(itemBlock.statementConnection_);
      itemBlock = itemBlock.nextConnection &&
      itemBlock.nextConnection.targetBlock();
    }

    this.interfaceCount = connections.length;
    this.updateShape_();

    // Reconnect any child blocks.
    for (var i = 0; i < this.interfaceCount; i++) {
      Blockly.Mutator.reconnect(connections[i], this, 'ADD' + i);
    }
    Blockly.Mutator.reconnect(classStatementConnection, this, 'INSERT_CLASS');
    Blockly.Mutator.reconnect(packageStatementConnection, this, 'INSERT_PACKAGE');

  },

  customContextMenu: Blockly.Blocks['classes_get'].customContextMenu,

  onchange: function(changeEvent) {

    // Validate input for correct variable name
    // We are interested only in change events hereent.type == 'change')) return;
    if (this.id === changeEvent.blockId) {
      // Validate name
      if (changeEvent.name == "CLASS") {
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

Blockly.Blocks['object_type'] = {
  /**
  * Block for object type.
  * @this Blockly.Block
  */
  init: function() {
    this.appendDummyInput()
    .appendField(new Blockly.FieldDropdown([
      [Blockly.Msg.OOP_TYPE_BYTE, "BYTE"],
      [Blockly.Msg.OOP_TYPE_SHORT, "SHORT"],
      [Blockly.Msg.OOP_TYPE_INTEGER, "INTEGER"],
      [Blockly.Msg.OOP_TYPE_LONG, "LONG"],
      [Blockly.Msg.OOP_TYPE_FLOAT, "FLOAT"],
      [Blockly.Msg.OOP_TYPE_DOUBLE, "DOUBLE"],
      [Blockly.Msg.OOP_TYPE_CHAR, "CHAR"],
      [Blockly.Msg.OOP_TYPE_BOOLEAN, "BOOLEAN"],
      ]), "TYPE_NAME");
    this.setInputsInline(false);
    this.setOutput(true, "TYPE");
    this.setColour(OOPP_COL.object_type);
    this.setTooltip(Blockly.Msg.OOP_TOOLTIP_OBJECT_TYPE);
    this.setHelpUrl(Blockly.Msg.OOP_HELPURL);
  }
};

Blockly.Blocks['classes_field'] = {
  /**
  * Block for class field.
  * @this Blockly.Block
  */
  init: function() {
    this.appendDummyInput()
    .appendField(Blockly.Msg.OOP_FIELD_NAME)
    .appendField(new Blockly.FieldTextInput(""), "NAME");
    this.appendDummyInput()
    .appendField(Blockly.Msg.OOP_VISIBILITY)
    .appendField(new Blockly.FieldDropdown([
      [Blockly.Msg.OOP_VISIBILITY_PUBLIC, "PUBLIC"],
      [Blockly.Msg.OOP_VISIBILITY_PROTECTED, "PROTECTED"],
      [Blockly.Msg.OOP_VISIBILITY_PACKAGE, "PACKAGE"],
      [Blockly.Msg.OOP_VISIBILITY_PRIVATE, "PRIVATE"]
      ]), "VISIBILITY");
    this.appendValueInput('TYPE')
    .setCheck(['TYPE','CLASS','INTERFACE'])
    .appendField(Blockly.Msg.OOP_TYPE);
    this.setInputsInline(true);
    this.setPreviousStatement(true, "FIELD");
    this.setNextStatement(true, "FIELD");
    this.setColour(OOPP_COL.classes_field);
    this.setTooltip(Blockly.Msg.OOP_TOOLTIP_FIELD);
    this.setHelpUrl(Blockly.Msg.OOP_HELPURL);
  },

  getFieldName: function() {
    return this.getFieldValue('NAME');
  },

  getFieldType: function() {
    return this.getFieldValue('TYPE');
  },

  onchange: function(changeEvent) {

    // We are interested only in change events here
    if (!(changeEvent.type == 'change')) return;
    if (this.id === changeEvent.blockId) {
      // Validate name
      if (changeEvent.name == "NAME") {
        if (isValidJavaName(changeEvent.newValue)) {
          this.setWarningText(null);
        } else {
          this.setWarningText(Blockly.Msg.OOP_ERROR_INVALIDNAME);
        }
      }
    }
  }
};

Blockly.Blocks['classes_parameter'] = {
  /**
  * Block for class parameter.
  * @this Blockly.Block
  */
  init: function() {
    this.appendDummyInput()
    .appendField(Blockly.Msg.OOP_PARAMETER_NAME)
    .appendField(new Blockly.FieldTextInput(""), "NAME");
    this.appendValueInput("TYPE")
    .setCheck(['TYPE','CLASS','INTERFACE'])
    .appendField(Blockly.Msg.OOP_TYPE);
    this.setInputsInline(true);
    this.setPreviousStatement(true, "PARAMETER");
    this.setNextStatement(true, "PARAMETER");
    this.setColour(OOPP_COL.classes_parameter);
    this.setTooltip(Blockly.Msg.OOP_TOOLTIP_PARAMETER);
    this.setHelpUrl(Blockly.Msg.OOP_HELPURL);
  },

  getParamConstructor: function() {
    return this.getFieldValue('NAME');
  },

  onchange: function(changeEvent) {
    // We are interested only in change events here
    if (!(changeEvent.type == 'change')) return;
    if (this.id === changeEvent.blockId) {
      // Validate name
      if (changeEvent.name == "NAME") {
        if (isValidJavaName(changeEvent.newValue)) {
          this.setWarningText(null);
        } else {
          this.setWarningText(Blockly.Msg.OOP_ERROR_INVALIDNAME);
        }
      }
    }
  }
};

Blockly.Blocks['classes_constructor'] = {
  /**
  * Block for class constructor.
  * @this Blockly.Block
  */
  init: function() {
    this.appendDummyInput()
    .appendField(Blockly.Msg.OOP_CONSTRUCTOR_NAME);
    this.appendDummyInput()
    .appendField(Blockly.Msg.OOP_VISIBILITY)
    .appendField(new Blockly.FieldDropdown([
      [Blockly.Msg.OOP_VISIBILITY_PUBLIC, "PUBLIC"],
      [Blockly.Msg.OOP_VISIBILITY_PROTECTED, "PROTECTED"],
      [Blockly.Msg.OOP_VISIBILITY_PACKAGE, "PACKAGE"],
      [Blockly.Msg.OOP_VISIBILITY_PRIVATE, "PRIVATE"]
      ]), "VISIBILITY");
    this.appendDummyInput()
    .appendField(Blockly.Msg.OOP_WITH_PARAMETER);
    this.appendStatementInput("PARAM")
    .setCheck("PARAMETER");
    this.setInputsInline(true);
    this.setPreviousStatement(true, "CONSTRUCTOR");
    this.setNextStatement(true, "CONSTRUCTOR");
    this.setColour(OOPP_COL.classes_constructor);
    this.setTooltip(Blockly.Msg.OOP_TOOLTIP_CONSTRUCTOR);
    this.setHelpUrl(Blockly.Msg.OOP_HELPURL);
    this.setCommentText(Blockly.Msg.OOP_DESCRIBECONSTRUCTOR + '\n');
  },

};

Blockly.Blocks['object_method'] = {
  /**
  * Block for object method.
  * @this Blockly.Block
  */
  init: function() {
    this.appendDummyInput()
    .appendField(Blockly.Msg.OOP_METHOD_NAME)
    .appendField(new Blockly.FieldTextInput(""), "NAME");
    this.appendDummyInput()
    .appendField(Blockly.Msg.OOP_VISIBILITY)
    .appendField(new Blockly.FieldDropdown([
      [Blockly.Msg.OOP_VISIBILITY_PUBLIC, "PUBLIC"],
      [Blockly.Msg.OOP_VISIBILITY_PROTECTED, "PROTECTED"],
      [Blockly.Msg.OOP_VISIBILITY_PACKAGE, "PACKAGE"],
      [Blockly.Msg.OOP_VISIBILITY_PRIVATE, "PRIVATE"]
      ]), "VISIBILITY");
    this.appendDummyInput()
    .appendField(Blockly.Msg.OOP_WITH_PARAMETER);
    this.appendStatementInput("PARAM")
    .setCheck("PARAMETER");
    this.setInputsInline(true);
    this.setPreviousStatement(true, "METHOD");
    this.setNextStatement(true, "METHOD");
    this.setColour(OOPP_COL.object_method);
    this.setTooltip(Blockly.Msg.OOP_TOOLTIP_METHOD);
    this.setHelpUrl(Blockly.Msg.OOP_HELPURL);
    this.setCommentText(Blockly.Msg.OOP_DESCRIBEMETHOD + '\n');
    this.arguments_ = [];
  },

  onchange: function(changeEvent) {
    var totalParamsName = [];
    var child = this.getInputTargetBlock('PARAM');
    do {
      if (child) {
        this.arguments_.push(child.getFieldValue('NAME'));
        totalParamsName.push(('\n' + '@param ' + child.getFieldValue('NAME')));
        child = child.getNextBlock();

      }
    } while (child);
    this.setCommentText(Blockly.Msg.OOP_DESCRIBEMETHOD + totalParamsName);

    // We are interested only in change events here
    if (!(changeEvent.type == 'change')) return;
    if (this.id === changeEvent.blockId) {
      // Validate name
      if (changeEvent.name == "NAME") {
        if (isValidJavaName(changeEvent.newValue)) {
          this.setWarningText(null);
        } else {
          this.setWarningText(Blockly.Msg.OOP_ERROR_INVALIDNAME);
        }
      }
    }
  }
};

Blockly.Blocks['object_method_return'] = {
  /**
  * Block for object method with return.
  * @this Blockly.Block
  */
  init: function() {
    this.appendDummyInput()
    .appendField(Blockly.Msg.OOP_METHOD_NAME)
    .appendField(new Blockly.FieldTextInput(""), "NAME");
    this.appendDummyInput()
    .appendField(Blockly.Msg.OOP_VISIBILITY)
    .appendField(new Blockly.FieldDropdown([
      [Blockly.Msg.OOP_VISIBILITY_PUBLIC, "PUBLIC"],
      [Blockly.Msg.OOP_VISIBILITY_PROTECTED, "PROTECTED"],
      [Blockly.Msg.OOP_VISIBILITY_PACKAGE, "PACKAGE"],
      [Blockly.Msg.OOP_VISIBILITY_PRIVATE, "PRIVATE"]
      ]), "VISIBILITY");
    this.appendDummyInput()
    .appendField(Blockly.Msg.OOP_WITH_PARAMETER);
    this.appendStatementInput("PARAM")
    .setCheck("PARAMETER");
    this.appendValueInput("RET")
    .setCheck(['TYPE','CLASS','INTERFACE'])
    .appendField(Blockly.Msg.OOP_RETURN_TYPE);
    this.setInputsInline(true);
    this.setPreviousStatement(true, "METHOD");
    this.setNextStatement(true, "METHOD");
    this.setColour(OOPP_COL.object_method_return);
    this.setTooltip(Blockly.Msg.OOP_TOOLTIP_METHOD_RETURN);
    this.setHelpUrl(Blockly.Msg.OOP_HELPURL);
    this.setCommentText(Blockly.Msg.OOP_DESCRIBEMETHOD + '\n');
  },

  onchange: function(changeEvent) {
    var totalParamsName = [];
    var child = this.getInputTargetBlock('PARAM');
    do {
      if (child) {
        totalParamsName.push(('\n' + '@param ' + child.getFieldValue('NAME')));
        child = child.getNextBlock();

      }
    } while (child);
    this.setCommentText(Blockly.Msg.OOP_DESCRIBEMETHOD + totalParamsName + '\n' + '@return');

    // We are interested only in change events here
    if (!(changeEvent.type == 'change')) return;
    if (this.id === changeEvent.blockId) {
      // Validate name
      if (changeEvent.name == "NAME") {
        if (isValidJavaName(changeEvent.newValue)) {
          this.setWarningText(null);
        } else {
          this.setWarningText(Blockly.Msg.OOP_ERROR_INVALIDNAME);
        }
      }
    }
  }
};

Blockly.Blocks['classes_mutatorcontainer'] = {
  /**
  * Mutator block for object container.
  * Where we can insert the 'extends', 'implements' and 'package' blocks
  * @this Blockly.Block
  */
  init: function() {
    this.setColour(OOPP_COL.classes_mutatorcontainer);

    this.appendDummyInput()
    .appendField(Blockly.Msg.OOP_MUTATORCONTAINER_TITLE);
    this.appendStatementInput('STACK_CLASS')
    .setCheck('MUTATORCLASS');

    this.appendDummyInput()
    .appendField(Blockly.Msg.OOP_MUTATORINTERFACE_TITLE);
    this.appendStatementInput('STACK_INTERFACE')
    .setCheck('MUTATORINTERFACE');

    this.appendDummyInput()
    .appendField(Blockly.Msg.OOP_MUTATORPACKAGE_TITLE);
    this.appendStatementInput('STACK_PACKAGE')
    .setCheck('MUTATORPACKAGE');

    this.setTooltip(Blockly.Msg.OOP_CREATE_WITH_CONTAINER_TOOLTIP);
    this.contextMenu = false;
  }
};

Blockly.Blocks['classes_mutatorclass'] = {
  /**
  * Mutator block for adding classes. The small one that goes inside the 'extends' mutator
  * @this Blockly.Block
  */
  init: function() {
    this.setColour(OOPP_COL.classes_mutatorclass);
    this.appendDummyInput()
    .appendField(Blockly.Msg.OOP_CLASS);
    this.setPreviousStatement(true,"MUTATORCLASS");
    this.setTooltip(Blockly.Msg.OOP_CREATE_WITH_CLASS_TOOLTIP);
    this.contextMenu = false;
  }
};

Blockly.Blocks['classes_mutatorinterface'] = {
  /**
  * Mutator block for adding interfaces.
  * @this Blockly.Block
  */
  init: function() {
    this.setColour(OOPP_COL.classes_mutatorinterface);
    this.appendDummyInput()
    .appendField(Blockly.Msg.OOP_INTERFACE);
    this.setPreviousStatement(true,"MUTATORINTERFACE");
    this.setNextStatement(true,"MUTATORINTERFACE");
    this.setTooltip(Blockly.Msg.OOP_CREATE_WITH_INTERFACE_TOOLTIP);
    this.contextMenu = false;
  }
};

Blockly.Blocks['classes_mutatorpackage'] = {
  /**
  * Mutator block for adding a package name.
  * @this Blockly.Block
  */
  init: function() {
    this.setColour(OOPP_COL.classes_mutatorpackage);
    this.appendDummyInput()
    .appendField(Blockly.Msg.OOP_PACKAGE);
    this.setPreviousStatement(true,"MUTATORPACKAGE");
    this.setNextStatement(false);
    this.setTooltip(Blockly.Msg.OOP_CREATE_WITH_PACKAGE_TOOLTIP);
    this.contextMenu = false;
  }
};
