/**
* @license
* Visual Blocks Language
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
* @fileoverview Generating Java for interfaces blocks.
* @author SoWIDE Lab - DIA University of Parma
*/
'use strict';

goog.provide('Blockly.Java.interfaces');
goog.require('Blockly.Java');


/**
* Convert the interface block into Java Code
* @param {Block} block interface block
* @return {String} Java code for the interface getter
*/
Blockly.Java['interfaces_get'] = function(block) {
  // Do not generate if it's not connected
  if (!block.getSurroundParent()) {return '';}

  var code = Blockly.Java.interfaceDB_.getName(block.getFieldValue('INTERFACE'),
  Blockly.Interfaces.NAME_TYPE);
  return [code, Blockly.Java.ORDER_ATOMIC];
};


/**
* Convert the interface definition into Java Code
* @param {Block} block interface definition block
* @return {String} Java code for the interface setter
*/
Blockly.Java['interfaces_set'] = function(block) {
  // Do not generate if it's a library
  if (block.getFieldValue('LIB') == 'TRUE') {return '';}

  // Interface setter.
  var faceName = Blockly.Java.interfaceDB_.getName(
    block.getFieldValue('INTERFACE'), Blockly.Interfaces.NAME_TYPE);
    var statements_constants = Blockly.Java.statementToCode(block, 'CONSTANTS');
    var statements_methods = Blockly.Java.statementToCode(block, 'METHODS');
    var statements_package = block.getFieldValue('PACKAGE');
    var code = "";

    if (statements_package) { code += 'package ' + statements_package + ';\n';}
    code += Blockly.Msg.OOP_PUBLIC_INTERFACE + faceName;
    if (block.extendsCount) {					//If interfaces are implemented
      code += Blockly.Msg.OOP_MUTATORCONTAINER_TITLE;
      for (var i = 0; i < block.extendsCount; i++) {
        var interfaceFromImplement = Blockly.Java.valueToCode(block, 'ADD'+i,Blockly.Java.ORDER_ADDITION);
        code += interfaceFromImplement + ' ';
      }
    }
    code += ' {\n' + statements_constants + '\n' + statements_methods + '\n' + '}\n';

    return code;
  };

/**
* Convert the object constant into Java Code
* @param {Block} block constant block
* @return {String} Java code for the object constant
*/
Blockly.Java['object_constant'] = function(block) {
  // Not connected? Don't show useless code
  if (!block.getSurroundParent()) {return '';}

  // Interface Constant and his values
  var name = block.getFieldValue('CONSTANT_NAME');
  var type = Blockly.Java.valueToCode(block, 'TYPE', Blockly.Java.ORDER_ATOMIC);
  var value = block.getFieldValue('VALUE');

  if (!name || !type || !value) {return '';}
  return type + ' ' + name + (value ? ' = ' + value : '') + ';\n';
};

/**
* Convert a string object into Java Code
* @param {Block} block string block
* @return {String} Java code for the object
*/
Blockly.Java['object_string'] = function(block) {
  // Not connected? Don't show useless code
  if (!block.getSurroundParent()) {return '';}

  var code = 'String';
  return [code, Blockly.Java.ORDER_ATOMIC];
};
